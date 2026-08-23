type NormalizeOptions = {
  ignoreCase: boolean;
  trimStrings: boolean;
};

function normalizeString(value: string, options: NormalizeOptions): string {
  const trimmed = options.trimStrings ? value.trim() : value;
  return options.ignoreCase ? trimmed.toLocaleLowerCase("en-US") : trimmed;
}

export function normalizeValue(value: unknown, options: NormalizeOptions): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return normalizeString(value, options);
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item, options));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalizeValue(item, options)]),
    );
  }
  return String(value);
}

export function valuesEqual(left: unknown, right: unknown, options: NormalizeOptions): boolean {
  return JSON.stringify(normalizeValue(left, options)) === JSON.stringify(normalizeValue(right, options));
}

export function normalizeKey(value: unknown, options: NormalizeOptions): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return null;
  const normalized = normalizeString(String(value), options);
  return normalized.length > 0 ? normalized : null;
}
