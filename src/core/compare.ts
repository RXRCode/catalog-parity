import { CatalogParityError } from "./error.js";
import { compilePath, MISSING_PATH, type PathAccessor } from "./path.js";
import { normalizeKey, normalizeValue } from "./normalize.js";
import type { CatalogDifference, CatalogRecord, CompareOptions, CompareResult, FieldMapping } from "./types.js";

function buildIndex(
  records: CatalogRecord[],
  keyPath: string,
  side: "source" | "target",
  options: CompareOptions,
): Map<string, CatalogRecord> {
  const index = new Map<string, CatalogRecord>();
  const getKey = compilePath(keyPath);

  records.forEach((record, position) => {
    if (record === null || Array.isArray(record) || typeof record !== "object") {
      throw new CatalogParityError(`${side} record ${position + 1} is not an object.`);
    }
    const keyValue = getKey(record);
    const key = keyValue === MISSING_PATH ? null : normalizeKey(keyValue, options);
    if (key === null) {
      throw new CatalogParityError(`${side} record ${position + 1} has no usable key at “${keyPath}”.`);
    }
    if (index.has(key)) {
      throw new CatalogParityError(`${side} catalog contains duplicate key “${key}” at “${keyPath}”.`);
    }
    index.set(key, record);
  });

  return index;
}

type CompiledField = {
  field: FieldMapping;
  source: PathAccessor;
  target: PathAccessor;
};

function compileFields(fields: FieldMapping[]): CompiledField[] {
  return fields.map((field) => ({
    field,
    source: compilePath(field.source),
    target: compilePath(field.target),
  }));
}

export function compareCatalogs(
  sourceRecords: CatalogRecord[],
  targetRecords: CatalogRecord[],
  options: CompareOptions,
): CompareResult {
  const source = buildIndex(sourceRecords, options.key.source, "source", options);
  const target = buildIndex(targetRecords, options.key.target, "target", options);
  const fields = compileFields(options.fields);
  const differences: CatalogDifference[] = [];
  const maxRecordedDifferences = options.maxRecordedDifferences;
  if (
    maxRecordedDifferences !== undefined &&
    (!Number.isInteger(maxRecordedDifferences) || maxRecordedDifferences < 0)
  ) {
    throw new CatalogParityError("maxRecordedDifferences must be a non-negative integer when provided.");
  }
  const mismatchedKeys = new Set<string>();
  let totalDifferenceCount = 0;
  const recordDifference = (difference: CatalogDifference): void => {
    totalDifferenceCount += 1;
    if (maxRecordedDifferences === undefined || differences.length < maxRecordedDifferences) {
      differences.push(difference);
    }
  };
  let matchedCount = 0;
  let missingInTargetCount = 0;
  let extraInTargetCount = 0;
  let fieldMismatchCount = 0;

  for (const key of [...source.keys()].sort()) {
    const sourceRecord = source.get(key)!;
    const targetRecord = target.get(key);

    if (!targetRecord) {
      recordDifference({ kind: "missing_in_target", key });
      missingInTargetCount += 1;
      continue;
    }

    matchedCount += 1;
    for (const compiled of fields) {
      const sourceValue = compiled.source(sourceRecord);
      const targetValue = compiled.target(targetRecord);
      const sourcePresent = sourceValue !== MISSING_PATH;
      const targetPresent = targetValue !== MISSING_PATH;
      const sourceNormalized = sourcePresent ? normalizeValue(sourceValue, options) : undefined;
      const targetNormalized = targetPresent ? normalizeValue(targetValue, options) : undefined;
      const equal =
        sourcePresent === targetPresent &&
        (!sourcePresent || JSON.stringify(sourceNormalized) === JSON.stringify(targetNormalized));

      if (!equal) {
        recordDifference({
          kind: "field_mismatch",
          key,
          field: compiled.field,
          sourcePresent,
          targetPresent,
          sourceValue: sourcePresent ? sourceValue : undefined,
          targetValue: targetPresent ? targetValue : undefined,
        });
        fieldMismatchCount += 1;
        mismatchedKeys.add(key);
      }
    }
  }

  if (!options.ignoreExtra) {
    for (const key of [...target.keys()].sort()) {
      if (!source.has(key)) {
        recordDifference({ kind: "extra_in_target", key });
        extraInTargetCount += 1;
      }
    }
  }

  return {
    parity: totalDifferenceCount === 0,
    sourceCount: sourceRecords.length,
    targetCount: targetRecords.length,
    matchedCount,
    missingInTargetCount,
    extraInTargetCount,
    fieldMismatchCount,
    mismatchedRecordCount: mismatchedKeys.size,
    key: options.key,
    fields: options.fields,
    totalDifferenceCount,
    differencesTruncated: differences.length < totalDifferenceCount,
    differences,
  };
}
