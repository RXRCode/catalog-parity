#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { Command } from "commander";
import pc from "picocolors";
import { compareCatalogs } from "../core/compare.js";
import { CatalogParityError } from "../core/error.js";
import { formatJson, formatTerminal } from "../core/format.js";
import { loadCatalog } from "../core/load.js";
import { parseFieldMappings, parseMapping } from "../core/mapping.js";

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

type CompareCommandOptions = {
  key: string;
  field: string[];
  sourcePath?: string;
  targetPath?: string;
  format: string;
  output?: string;
  ignoreCase: boolean;
  trim: boolean;
  ignoreExtra: boolean;
  maxDifferences: string;
};

const program = new Command()
  .name("catalog-parity")
  .description("Compare commerce catalog exports before migrations and integrations go live.")
  .version("0.1.0");

program
  .command("compare")
  .description("Compare a source CSV/JSON export with a target CSV/JSON export")
  .argument("<source>", "source catalog export")
  .argument("<target>", "target catalog export")
  .option("-k, --key <mapping>", "record key, or source=target field mapping", "sku")
  .option("-f, --field <mapping>", "field to compare; repeat for more fields", collect, [])
  .option("--source-path <path>", "dot path to the source array inside JSON")
  .option("--target-path <path>", "dot path to the target array inside JSON")
  .option("--format <format>", "terminal or json", "terminal")
  .option("-o, --output <file>", "write the report to a file")
  .option("--ignore-case", "compare keys and string fields without case sensitivity", false)
  .option("--no-trim", "preserve leading and trailing string whitespace")
  .option("--ignore-extra", "do not fail for records found only in the target", false)
  .option("--max-differences <number>", "maximum differences shown in terminal output", "50")
  .action(async (source: string, target: string, options: CompareCommandOptions) => {
    if (!['terminal', 'json'].includes(options.format)) {
      throw new CatalogParityError("--format must be terminal or json.");
    }

    const maxDifferences = Number(options.maxDifferences);
    if (!Number.isInteger(maxDifferences) || maxDifferences < 1) {
      throw new CatalogParityError("--max-differences must be a positive integer.");
    }

    const [sourceRecords, targetRecords] = await Promise.all([
      loadCatalog(source, options.sourcePath),
      loadCatalog(target, options.targetPath),
    ]);

    const result = compareCatalogs(sourceRecords, targetRecords, {
      key: parseMapping(options.key, "--key"),
      fields: parseFieldMappings(options.field),
      ignoreCase: options.ignoreCase,
      trimStrings: options.trim,
      ignoreExtra: options.ignoreExtra,
    });
    const report = options.format === "json" ? formatJson(result) : formatTerminal(result, maxDifferences);

    if (options.output) {
      await writeFile(options.output, `${report}\n`, "utf8");
      console.log(pc.green(`Report written to ${options.output}`));
    } else {
      console.log(report);
    }

    process.exitCode = result.parity ? 0 : 1;
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(error instanceof CatalogParityError ? message : `Unexpected error: ${message}`));
  process.exitCode = 2;
});
