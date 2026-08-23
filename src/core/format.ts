import pc from "picocolors";
import type { CatalogDifference, CompareResult } from "./types.js";

function displayValue(value: unknown): string {
  const serialized = value === undefined ? "undefined" : JSON.stringify(value);
  const display = serialized ?? String(value);
  return display.length > 100 ? `${display.slice(0, 97)}…` : display;
}

function formatDifference(difference: CatalogDifference): string {
  if (difference.kind === "missing_in_target") {
    return `${pc.red("MISSING")} ${difference.key} ${pc.dim("not found in target")}`;
  }
  if (difference.kind === "extra_in_target") {
    return `${pc.yellow("EXTRA  ")} ${difference.key} ${pc.dim("only in target")}`;
  }
  return `${pc.magenta("CHANGED")} ${difference.key} ${difference.field.label}\n${pc.dim("        source:")} ${displayValue(difference.sourceValue)}\n${pc.dim("        target:")} ${displayValue(difference.targetValue)}`;
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
  const omitted = result.differences.length - visible.length;
  const detail = visible.length > 0 ? `\n\n${visible.join("\n\n")}` : "";
  const tail = omitted > 0 ? `\n\n${pc.dim(`${omitted} more differences omitted. Use --format json for the full report.`)}` : "";

  return `${heading}\n${pc.dim(counts)}${detail}${tail}`;
}

export function formatJson(result: CompareResult): string {
  return JSON.stringify(result, null, 2);
}
