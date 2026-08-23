import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";

const repositoryRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packageJson = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8"));
const temporaryRoot = await mkdtemp(join(tmpdir(), "catalog-parity-package-"));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const childEnvironment = { ...process.env };
delete childEnvironment.npm_config_dry_run;
delete childEnvironment.NPM_CONFIG_DRY_RUN;
childEnvironment.npm_config_cache = join(temporaryRoot, "npm-cache");
childEnvironment.NPM_CONFIG_CACHE = childEnvironment.npm_config_cache;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: "utf8",
    env: childEnvironment,
  });
  const expectedStatus = options.expectedStatus ?? 0;

  if (result.error) throw result.error;
  if (result.status !== expectedStatus) {
    throw new Error(
      [
        `${command} ${args.join(" ")} exited with ${result.status}; expected ${expectedStatus}.`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return { stdout: result.stdout, stderr: result.stderr };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const packResult = run(
    npmCommand,
    ["pack", "--json", "--ignore-scripts", "--pack-destination", temporaryRoot],
  );
  const [packed] = JSON.parse(packResult.stdout);
  assert(packed, "npm pack did not describe the generated artifact.");
  assert(packed.id === `${packageJson.name}@${packageJson.version}`, "Packed package identity is incorrect.");

  const packedPaths = new Set(packed.files.map((file) => file.path));
  for (const requiredPath of [
    "LICENSE",
    "README.md",
    "CHANGELOG.md",
    "dist/cli/index.js",
    "dist/index.js",
    "dist/index.d.ts",
    "package.json",
  ]) {
    assert(packedPaths.has(requiredPath), `Packed artifact is missing ${requiredPath}.`);
  }
  assert(
    !packed.files.some((file) => /^(src|tests|scripts|examples|docs|\.github)\//.test(file.path)),
    "Packed artifact contains repository-only files.",
  );

  const consumerDirectory = join(temporaryRoot, "consumer");
  await mkdir(consumerDirectory);
  await writeFile(
    join(consumerDirectory, "package.json"),
    JSON.stringify({ name: "catalog-parity-smoke-consumer", private: true, type: "module" }),
  );

  const tarballPath = join(temporaryRoot, packed.filename);
  run(
    npmCommand,
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath],
    { cwd: consumerDirectory },
  );

  const executable = join(
    consumerDirectory,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "catalog-parity.cmd" : "catalog-parity",
  );
  await access(executable);
  const versionResult = run(executable, ["--version"], { cwd: consumerDirectory });
  assert(versionResult.stdout.trim() === packageJson.version, "Installed CLI version does not match package.json.");

  const sourcePath = join(consumerDirectory, "source.csv");
  const targetPath = join(consumerDirectory, "target.csv");
  await writeFile(sourcePath, "sku,title,price\nMUG-1,Studio Mug,18.50\n");
  await writeFile(targetPath, "sku,title,price\nMUG-1,Studio Mug,18.50\n");

  const parityResult = run(
    executable,
    ["compare", sourcePath, targetPath, "--key", "sku", "--field", "title", "--field", "price"],
    { cwd: consumerDirectory },
  );
  assert(parityResult.stdout.includes("Catalogs are in parity"), "Installed CLI did not report parity.");

  await writeFile(targetPath, "sku,title,price\nMUG-1,Studio Mug,19.00\n");
  const differenceResult = run(
    executable,
    ["compare", sourcePath, targetPath, "--key", "sku", "--field", "price"],
    { cwd: consumerDirectory, expectedStatus: 1 },
  );
  assert(differenceResult.stdout.includes("Catalog differences found"), "Installed CLI did not report drift.");

  const libraryCheckPath = join(consumerDirectory, "verify-library.mjs");
  await writeFile(
    libraryCheckPath,
    [
      'import { VERSION, compareCatalogs } from "@rxrcode/catalog-parity";',
      `if (VERSION !== ${JSON.stringify(packageJson.version)}) throw new Error("Library version mismatch");`,
      'if (typeof compareCatalogs !== "function") throw new Error("Missing compareCatalogs export");',
    ].join("\n"),
  );
  run(process.execPath, [libraryCheckPath], { cwd: consumerDirectory });

  console.log(`✓ Packed and smoke-tested ${packed.id}`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
