import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadCatalog } from "../src/core/load.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function fixture(name: string, contents: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "catalog-parity-"));
  temporaryDirectories.push(directory);
  const path = join(directory, name);
  await writeFile(path, contents, "utf8");
  return path;
}

describe("loadCatalog", () => {
  it("loads CSV exports through the streaming parser", async () => {
    const path = await fixture("source.csv", "sku,title\nMUG-1,Studio Mug\n");
    await expect(loadCatalog(path)).resolves.toEqual([{ sku: "MUG-1", title: "Studio Mug" }]);
  });

  it("supports quoted multiline CSV values", async () => {
    const path = await fixture("source.csv", 'sku,title\nMUG-1,"Studio\\nMug"\n'.replace("\\n", "\n"));
    await expect(loadCatalog(path)).resolves.toEqual([{ sku: "MUG-1", title: "Studio\nMug" }]);
  });

  it("rejects empty CSV headings", async () => {
    const path = await fixture("source.csv", "sku,,price\nMUG-1,Studio Mug,18.50\n");
    await expect(loadCatalog(path)).rejects.toThrow(/headings must not be empty/);
  });

  it("rejects duplicate CSV headings instead of silently overwriting columns", async () => {
    const path = await fixture("source.csv", "sku,title,title\nMUG-1,One,Two\n");
    await expect(loadCatalog(path)).rejects.toThrow(/duplicate heading/);
  });

  it("loads a conventional products array", async () => {
    const path = await fixture("source.json", JSON.stringify({ products: [{ sku: "MUG-1" }] }));
    await expect(loadCatalog(path)).resolves.toEqual([{ sku: "MUG-1" }]);
  });

  it("loads an explicit nested array", async () => {
    const path = await fixture("source.json", JSON.stringify({ export: { catalog: [{ sku: "MUG-1" }] } }));
    await expect(loadCatalog(path, "export.catalog")).resolves.toEqual([{ sku: "MUG-1" }]);
  });

  it("rejects unsupported extensions before attempting to read them", async () => {
    await expect(loadCatalog("does-not-exist.txt")).rejects.toThrow(/must use a \.csv or \.json extension/);
  });
});
