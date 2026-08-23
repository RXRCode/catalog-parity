import type { CatalogRecord } from "./types.js";

export function getPath(record: CatalogRecord, path: string): unknown {
  if (Object.prototype.hasOwnProperty.call(record, path)) {
    return record[path];
  }

  return path.split(".").reduce<unknown>((value, segment) => {
    if (value === null || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, record);
}
