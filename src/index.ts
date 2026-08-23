export { compareCatalogs } from "./core/compare.js";
export { CatalogParityError } from "./core/error.js";
export { formatJson, formatTerminal } from "./core/format.js";
export { loadCatalog } from "./core/load.js";
export { parseFieldMappings, parseMapping } from "./core/mapping.js";
export type {
  CatalogDifference,
  CatalogRecord,
  CompareOptions,
  CompareResult,
  FieldMapping,
} from "./core/types.js";
