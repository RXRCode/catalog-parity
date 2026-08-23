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
  it("loads CSV exports", async () => {
    const path = await fixture("source.csv", "sku,title\nMUG-1,Studio Mug\n");
    await expect(loadCatalog(path)).resolves.toEqual([{ sku: "MUG-1", title: "Studio Mug" }]);
  });

  it("loads a conventional products array", async () => {
    const path = await fixture("source.json", JSON.stringify({ products: [{ sku: "MUG-1" }] }));
    await expect(loadCatalog(path)).resolves.toEqual([{ sku: "MUG-1" }]);
  });

  it("loads an explicit nested array", async () => {
    const path = await fixture("source.json", JSON.stringify({ export: { catalog: [{ sku: "MUG-1" }] } }));
    await expect(loadCatalog(path, "export.catalog")).resolves.toEqual([{ sku: "MUG-1" }]);
  });
});
