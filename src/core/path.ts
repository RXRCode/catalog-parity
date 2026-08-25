import type { CatalogRecord } from "./types.js";

export const MISSING_PATH = Symbol("catalog-parity.missing-path");

export type PathValue = {
  found: boolean;
  value: unknown;
};

export type PathAccessor = (record: CatalogRecord) => unknown | typeof MISSING_PATH;

export function compilePath(path: string): PathAccessor {
  const segments = path.split(".");

  return (record: CatalogRecord): unknown | typeof MISSING_PATH => {
    if (Object.prototype.hasOwnProperty.call(record, path)) {
      return record[path];
    }

    let value: unknown = record;
    for (const segment of segments) {
      if (value === null || typeof value !== "object") {
        return MISSING_PATH;
      }

      const object = value as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(object, segment)) {
        return MISSING_PATH;
      }
      value = object[segment];
    }

    return value;
  };
}

export function getPathValue(record: CatalogRecord, path: string): PathValue {
  const value = compilePath(path)(record);
  return value === MISSING_PATH ? { found: false, value: undefined } : { found: true, value };
}

export function getPath(record: CatalogRecord, path: string): unknown {
  const value = compilePath(path)(record);
  return value === MISSING_PATH ? undefined : value;
}
