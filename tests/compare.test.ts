import { describe, expect, it } from "vitest";
import { compareCatalogs } from "../src/core/compare.js";
import { CatalogParityError } from "../src/core/error.js";
import { parseFieldMappings, parseMapping } from "../src/core/mapping.js";

function options(overrides: Partial<Parameters<typeof compareCatalogs>[2]> = {}) {
  return {
    key: parseMapping("sku", "--key"),
    fields: parseFieldMappings(["title", "price"]),
    ignoreCase: false,
    trimStrings: true,
    ignoreExtra: false,
    ...overrides,
  };
}

describe("compareCatalogs", () => {
  it("reports parity across CSV-style and JSON-style primitive values", () => {
    const result = compareCatalogs(
      [{ sku: "MUG-1", title: "Studio Mug", price: "18.50" }],
      [{ sku: "MUG-1", title: "Studio Mug", price: 18.5 }],
      options(),
    );

    expect(result.parity).toBe(false);
    expect(result.fieldMismatchCount).toBe(1);
  });

  it("finds missing, extra, and changed records", () => {
    const result = compareCatalogs(
      [
        { sku: "TEE-1", title: "Classic Tee", price: "29.00" },
        { sku: "TOTE-1", title: "Canvas Tote", price: "24.00" },
      ],
      [
        { sku: "TEE-1", title: "Classic Tee", price: "31.00" },
        { sku: "CAP-1", title: "Studio Cap", price: "20.00" },
      ],
      options(),
    );

    expect(result.parity).toBe(false);
    expect(result.missingInTargetCount).toBe(1);
    expect(result.extraInTargetCount).toBe(1);
    expect(result.fieldMismatchCount).toBe(1);
    expect(result.mismatchedRecordCount).toBe(1);
  });

  it("supports source-to-target key and nested field mappings", () => {
    const result = compareCatalogs(
      [{ product_code: "MUG-1", details: { name: "Studio Mug" } }],
      [{ sku: "MUG-1", title: "Studio Mug" }],
      options({
        key: parseMapping("product_code=sku", "--key"),
        fields: parseFieldMappings(["details.name=title"]),
      }),
    );

    expect(result.parity).toBe(true);
  });

  it("can ignore case and target-only records", () => {
    const result = compareCatalogs(
      [{ sku: "mug-1", title: "studio mug" }],
      [
        { sku: "MUG-1", title: "Studio Mug" },
        { sku: "CAP-1", title: "Studio Cap" },
      ],
      options({ ignoreCase: true, ignoreExtra: true, fields: parseFieldMappings(["title"]) }),
    );

    expect(result.parity).toBe(true);
  });

  it("rejects duplicate catalog keys", () => {
    expect(() =>
      compareCatalogs(
        [
          { sku: "MUG-1", title: "One" },
          { sku: "MUG-1", title: "Two" },
        ],
        [],
        options(),
      ),
    ).toThrow(CatalogParityError);
  });
});
