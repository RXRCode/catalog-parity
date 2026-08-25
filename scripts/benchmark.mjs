import { performance } from "node:perf_hooks";
import { compareCatalogs } from "../dist/core/compare.js";

const requestedSizes = process.argv.slice(2).map(Number);
const sizes = requestedSizes.length > 0 ? requestedSizes : [10_000, 50_000, 100_000];

if (sizes.some((size) => !Number.isInteger(size) || size < 1)) {
  throw new Error("Benchmark sizes must be positive integers.");
}

const options = {
  key: { source: "sku", target: "sku", label: "sku" },
  fields: [
    { source: "title", target: "title", label: "title" },
    { source: "price", target: "price", label: "price" },
    { source: "status", target: "status", label: "status" },
  ],
  ignoreCase: false,
  trimStrings: true,
  ignoreExtra: false,
};

for (const size of sizes) {
  const source = Array.from({ length: size }, (_, index) => ({
    sku: `SKU-${index.toString().padStart(8, "0")}`,
    title: `Product ${index}`,
    price: `${(index % 1000) / 10}`,
    status: index % 2 === 0 ? "active" : "draft",
  }));
  const target = source.map((record) => ({ ...record }));
  if (target.length > 0) target[target.length - 1].price = "changed";

  const startedAt = performance.now();
  const result = compareCatalogs(source, target, options);
  const elapsedMs = performance.now() - startedAt;
  const heapUsedMiB = process.memoryUsage().heapUsed / 1024 / 1024;
  const maxRssMiB = process.resourceUsage().maxRSS / 1024;

  console.log(
    JSON.stringify({
      recordsPerSide: size,
      fields: options.fields.length,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      heapUsedMiB: Number(heapUsedMiB.toFixed(2)),
      maxRssMiB: Number(maxRssMiB.toFixed(2)),
      differences: result.totalDifferenceCount,
    }),
  );
}
