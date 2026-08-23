import { CatalogParityError } from "./error.js";
import { getPath } from "./path.js";
import { normalizeKey, valuesEqual } from "./normalize.js";
import type { CatalogDifference, CatalogRecord, CompareOptions, CompareResult } from "./types.js";

function buildIndex(
  records: CatalogRecord[],
  keyPath: string,
  side: "source" | "target",
  options: CompareOptions,
): Map<string, CatalogRecord> {
  const index = new Map<string, CatalogRecord>();

  records.forEach((record, position) => {
    const key = normalizeKey(getPath(record, keyPath), options);
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

export function compareCatalogs(
  sourceRecords: CatalogRecord[],
  targetRecords: CatalogRecord[],
  options: CompareOptions,
): CompareResult {
  const source = buildIndex(sourceRecords, options.key.source, "source", options);
  const target = buildIndex(targetRecords, options.key.target, "target", options);
  const differences: CatalogDifference[] = [];
  const mismatchedKeys = new Set<string>();
  let matchedCount = 0;

  for (const key of [...source.keys()].sort()) {
    const sourceRecord = source.get(key)!;
    const targetRecord = target.get(key);

    if (!targetRecord) {
      differences.push({ kind: "missing_in_target", key });
      continue;
    }

    matchedCount += 1;
    for (const field of options.fields) {
      const sourceValue = getPath(sourceRecord, field.source);
      const targetValue = getPath(targetRecord, field.target);
      if (!valuesEqual(sourceValue, targetValue, options)) {
        differences.push({ kind: "field_mismatch", key, field, sourceValue, targetValue });
        mismatchedKeys.add(key);
      }
    }
  }

  if (!options.ignoreExtra) {
    for (const key of [...target.keys()].sort()) {
      if (!source.has(key)) differences.push({ kind: "extra_in_target", key });
    }
  }

  const missingInTargetCount = differences.filter((item) => item.kind === "missing_in_target").length;
  const extraInTargetCount = differences.filter((item) => item.kind === "extra_in_target").length;
  const fieldMismatchCount = differences.filter((item) => item.kind === "field_mismatch").length;

  return {
    parity: differences.length === 0,
    sourceCount: sourceRecords.length,
    targetCount: targetRecords.length,
    matchedCount,
    missingInTargetCount,
    extraInTargetCount,
    fieldMismatchCount,
    mismatchedRecordCount: mismatchedKeys.size,
    key: options.key,
    fields: options.fields,
    differences,
  };
}
