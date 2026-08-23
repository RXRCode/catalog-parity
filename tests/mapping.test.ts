import { describe, expect, it } from "vitest";
import { parseFieldMappings, parseMapping } from "../src/core/mapping.js";

describe("field mappings", () => {
  it("uses the same field on both sides by default", () => {
    expect(parseMapping("sku", "--key")).toEqual({ source: "sku", target: "sku", label: "sku" });
  });

  it("parses source-to-target mappings", () => {
    expect(parseMapping("product_code=variant.sku", "--key")).toEqual({
      source: "product_code",
      target: "variant.sku",
      label: "product_code → variant.sku",
    });
  });

  it("rejects duplicate mappings", () => {
    expect(() => parseFieldMappings(["title", "title"])).toThrow(/Duplicate/);
  });
});
