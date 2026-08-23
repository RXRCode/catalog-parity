import { CatalogParityError } from "./error.js";
import type { FieldMapping } from "./types.js";

export function parseMapping(value: string, optionName: string): FieldMapping {
  const separator = value.indexOf("=");
  const source = (separator === -1 ? value : value.slice(0, separator)).trim();
  const target = (separator === -1 ? value : value.slice(separator + 1)).trim();

  if (!source || !target) {
    throw new CatalogParityError(`${optionName} must be a field or source=target mapping.`);
  }

  return {
    source,
    target,
    label: source === target ? source : `${source} → ${target}`,
  };
}

export function parseFieldMappings(values: string[]): FieldMapping[] {
  const mappings = values.map((value) => parseMapping(value, "--field"));
  const labels = new Set<string>();

  for (const mapping of mappings) {
    const identity = `${mapping.source}\u0000${mapping.target}`;
    if (labels.has(identity)) {
      throw new CatalogParityError(`Duplicate --field mapping: ${mapping.label}`);
    }
    labels.add(identity);
  }

  return mappings;
}
