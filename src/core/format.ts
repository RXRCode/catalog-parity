import pc from "picocolors";
import type { CatalogDifference, CompareResult } from "./types.js";

function escapeControlCharacter(character: string): string {
  switch (character) {
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "\t":
      return "\\t";
    default:
      return `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
  }
}

export function escapeTerminalText(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    const isControlCharacter = code <= 0x1f || (code >= 0x7f && code <= 0x9f);
    return isControlCharacter ? escapeControlCharacter(character) : character;
  }).join("");
}

function displayValue(value: unknown, present = true): string {
  if (!present) return "<missing>";
  const serialized = value === undefined ? "undefined" : JSON.stringify(value);
  const display = serialized ?? String(value);
  return display.length > 100 ? `${display.slice(0, 97)}…` : display;
}

function formatDifference(difference: CatalogDifference): string {
  const key = escapeTerminalText(difference.key);
  if (difference.kind === "missing_in_target") {
    return `${pc.red("MISSING")} ${key} ${pc.dim("not found in target")}`;
  }
  if (difference.kind === "extra_in_target") {
    return `${pc.yellow("EXTRA  ")} ${key} ${pc.dim("only in target")}`;
  }

  const label = escapeTerminalText(difference.field.label);
  return `${pc.magenta("CHANGED")} ${key} ${label}\n${pc.dim("        source:")} ${displayValue(difference.sourceValue, difference.sourcePresent)}\n${pc.dim("        target:")} ${displayValue(difference.targetValue, difference.targetPresent)}`;
}

export function formatTerminal(result: CompareResult, maxDifferences = 50): string {
  const heading = result.parity ? pc.green("✓ Catalogs are in parity") : pc.red("✗ Catalog differences found");
  const counts = [
    `Source ${result.sourceCount}`,
    `Target ${result.targetCount}`,
    `Matched ${result.matchedCount}`,
    `Missing ${result.missingInTargetCount}`,
    `Extra ${result.extraInTargetCount}`,
    `Changed fields ${result.fieldMismatchCount}`,
  ].join(" · ");

  const visible = result.differences.slice(0, maxDifferences).map(formatDifference);
  const omitted = result.totalDifferenceCount - visible.length;
  const detail = visible.length > 0 ? `\n\n${visible.join("\n\n")}` : "";
  const tail = omitted > 0 ? `\n\n${pc.dim(`${omitted} more differences omitted. Use --format json for the full report.`)}` : "";

  return `${heading}\n${pc.dim(counts)}${detail}${tail}`;
}

export function formatJson(result: CompareResult): string {
  return JSON.stringify(result, (_key, value) => (value === undefined ? null : value), 2);
}
