import { CatalogParityError } from "./error.js";

type NormalizeOptions = {
  ignoreCase: boolean;
  trimStrings: boolean;
};

const MAX_NORMALIZATION_DEPTH = 100;

function normalizeString(value: string, options: NormalizeOptions): string {
  const trimmed = options.trimStrings ? value.trim() : value;
  return options.ignoreCase ? trimmed.toLocaleLowerCase("en-US") : trimmed;
}

function unsupportedValue(type: string): never {
  throw new CatalogParityError(`Catalog values must be JSON-compatible; ${type} values are not supported.`);
}

function normalizeValueInternal(
  value: unknown,
  options: NormalizeOptions,
  seen: WeakSet<object>,
  depth: number,
): unknown {
  if (depth > MAX_NORMALIZATION_DEPTH) {
    throw new CatalogParityError(
      `Catalog value nesting exceeds the supported depth of ${MAX_NORMALIZATION_DEPTH}.`,
    );
  }

  if (value === null) return null;
  if (value === undefined) return unsupportedValue("undefined");
  if (typeof value === "string") return normalizeString(value, options);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return unsupportedValue("non-finite number");
    return String(value);
  }
  if (typeof value === "boolean") return String(value);
  if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
    return unsupportedValue(typeof value);
  }

  if (seen.has(value)) {
    throw new CatalogParityError("Catalog values must not contain circular references.");
  }

  if (Array.isArray(value)) {
    seen.add(value);
    try {
      return value.map((item) => normalizeValueInternal(item, options, seen, depth + 1));
    } finally {
      seen.delete(value);
    }
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new CatalogParityError(
      "Catalog values must be JSON-compatible plain objects; class instances are not supported.",
    );
  }

  seen.add(value);
  try {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, item]) => [key, normalizeValueInternal(item, options, seen, depth + 1)]),
    );
  } finally {
    seen.delete(value);
  }
}

export function normalizeValue(value: unknown, options: NormalizeOptions): unknown {
  return normalizeValueInternal(value, options, new WeakSet<object>(), 0);
}

export function valuesEqual(left: unknown, right: unknown, options: NormalizeOptions): boolean {
  return JSON.stringify(normalizeValue(left, options)) === JSON.stringify(normalizeValue(right, options));
}

export function normalizeKey(value: unknown, options: NormalizeOptions): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return null;
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new CatalogParityError("Catalog keys must not be non-finite numbers.");
  }
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new CatalogParityError(`Catalog keys must be strings, numbers, or booleans; ${typeof value} is not supported.`);
  }

  const normalized = normalizeString(String(value), options);
  return normalized.length > 0 ? normalized : null;
}
