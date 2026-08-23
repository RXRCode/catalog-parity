# Architecture

Catalog Parity is intentionally a local, platform-neutral comparison engine with a thin command-line interface.

## Flow

1. `loadCatalog` reads CSV or JSON into plain records.
2. mappings translate source field paths to target field paths.
3. `compareCatalogs` indexes records by a normalized key and computes deterministic differences.
4. formatters produce human-readable or machine-readable reports.
5. the CLI maps parity, differences, and invalid input to exit codes `0`, `1`, and `2`.

## Boundaries

- `src/core` has no platform credentials or remote calls.
- `src/cli` owns argument parsing, file output, and process exit behavior.
- the public exports in `src/index.ts` allow the comparison engine to be embedded without invoking the CLI.

## Safety and privacy

The CLI reads the two files supplied by the user and writes only when `--output` is explicitly provided. It performs no network requests, mutations, or synchronization. Real catalog exports should remain outside Git unless they contain intentionally fictional test data.
