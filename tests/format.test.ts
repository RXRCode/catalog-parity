import { stripVTControlCharacters } from "node:util";
import { describe, expect, it } from "vitest";
import { compareCatalogs } from "../src/core/compare.js";
import { escapeTerminalText, formatJson, formatTerminal } from "../src/core/format.js";
import { parseFieldMappings, parseMapping } from "../src/core/mapping.js";

describe("terminal safety", () => {
  it("escapes control characters used for terminal and log manipulation", () => {
    expect(escapeTerminalText("SKU\u001b[2J\nnext\rline\tend")).toBe(
      "SKU\\x1b[2J\\nnext\\rline\\tend",
    );
  });

  it("renders malicious catalog keys without emitting their raw escape sequence", () => {
    const key = "SKU\u001b]8;;https://example.com\u0007bad";
    const result = compareCatalogs(
      [{ sku: key }],
      [],
      {
        key: parseMapping("sku", "--key"),
        fields: [],
        ignoreCase: false,
        trimStrings: true,
        ignoreExtra: false,
      },
    );

    const report = formatTerminal(result);
    expect(report).not.toContain("\u001b]8;;https://example.com");
    expect(report).toContain("\\x1b]8;;https://example.com\\x07bad");
  });
});

describe("bounded terminal details", () => {
  it("reports omitted totals even when only a bounded detail set is retained", () => {
    const result = compareCatalogs(
      [
        { sku: "A", title: "one" },
        { sku: "B", title: "two" },
        { sku: "C", title: "three" },
      ],
      [
        { sku: "A", title: "changed-one" },
        { sku: "B", title: "changed-two" },
        { sku: "C", title: "changed-three" },
      ],
      {
        key: parseMapping("sku", "--key"),
        fields: parseFieldMappings(["title"]),
        ignoreCase: false,
        trimStrings: true,
        ignoreExtra: false,
        maxRecordedDifferences: 1,
      },
    );

    expect(formatTerminal(result, 50)).toContain("2 more differences omitted");
  });
});

describe("missing value reporting", () => {
  it("makes missing-vs-null explicit in both terminal and JSON reports", () => {
    const result = compareCatalogs(
      [{ sku: "MUG-1" }],
      [{ sku: "MUG-1", title: null }],
      {
        key: parseMapping("sku", "--key"),
        fields: parseFieldMappings(["title"]),
        ignoreCase: false,
        trimStrings: true,
        ignoreExtra: false,
      },
    );

    expect(stripVTControlCharacters(formatTerminal(result))).toContain("source: <missing>");
    const json = JSON.parse(formatJson(result)) as { differences: Array<Record<string, unknown>> };
    expect(json.differences[0]).toMatchObject({
      sourcePresent: false,
      targetPresent: true,
      sourceValue: null,
      targetValue: null,
    });
  });
});
