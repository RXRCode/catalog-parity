import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { CatalogParityError } from "./error.js";
import { getPath } from "./path.js";
import type { CatalogRecord } from "./types.js";

const commonArrayKeys = ["products", "items", "records", "data"];

function assertRecords(value: unknown, filePath: string): CatalogRecord[] {
  if (!Array.isArray(value)) {
    throw new CatalogParityError(`${filePath} does not resolve to an array of records.`);
  }

  value.forEach((record, position) => {
    if (record === null || Array.isArray(record) || typeof record !== "object") {
      throw new CatalogParityError(`${filePath} record ${position + 1} is not an object.`);
    }
  });

  return value as CatalogRecord[];
}

function resolveJsonRecords(value: unknown, filePath: string, rootPath?: string): CatalogRecord[] {
  if (rootPath) {
    if (value === null || Array.isArray(value) || typeof value !== "object") {
      throw new CatalogParityError(`${filePath} cannot use --*-path because its JSON root is not an object.`);
    }
    return assertRecords(getPath(value as CatalogRecord, rootPath), `${filePath} at “${rootPath}”`);
  }

  if (Array.isArray(value)) return assertRecords(value, filePath);
  if (value !== null && typeof value === "object") {
    const object = value as CatalogRecord;
    for (const key of commonArrayKeys) {
      if (Array.isArray(object[key])) return assertRecords(object[key], `${filePath} at “${key}”`);
    }
  }

  throw new CatalogParityError(
    `${filePath} must contain a JSON array, a products/items/records/data array, or an explicit --*-path.`,
  );
}

export async function loadCatalog(filePath: string, rootPath?: string): Promise<CatalogRecord[]> {
  const extension = extname(filePath).toLocaleLowerCase("en-US");
  let contents: string;

  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CatalogParityError(`Could not read ${filePath}: ${message}`);
  }

  if (extension === ".csv") {
    if (rootPath) throw new CatalogParityError(`A JSON path cannot be used with CSV file ${filePath}.`);
    try {
      return assertRecords(
        parse(contents, { bom: true, columns: true, skip_empty_lines: true, trim: false }),
        filePath,
      );
    } catch (error) {
      if (error instanceof CatalogParityError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new CatalogParityError(`Could not parse CSV ${filePath}: ${message}`);
    }
  }

  if (extension === ".json") {
    try {
      return resolveJsonRecords(JSON.parse(contents), filePath, rootPath);
    } catch (error) {
      if (error instanceof CatalogParityError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new CatalogParityError(`Could not parse JSON ${filePath}: ${message}`);
    }
  }

  throw new CatalogParityError(`${filePath} must use a .csv or .json extension.`);
}
