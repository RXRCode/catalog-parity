# Architecture

Catalog Parity is intentionally a local, platform-neutral comparison engine with a thin command-line interface.

## Flow

1. `loadCatalog` streams CSV input or reads JSON input into plain records.
2. mappings translate source field paths to target field paths.
3. field/key paths are compiled once into accessors for the comparison hot path.
4. `compareCatalogs` indexes records by a normalized key and computes deterministic differences while maintaining counters incrementally.
5. formatters produce terminal-safe human-readable output or machine-readable JSON reports.
6. the CLI maps parity, differences, and invalid input to exit codes `0`, `1`, and `2`.

## Boundaries

- `src/core` has no platform credentials or remote calls.
- `src/cli` owns argument parsing, file output, terminal-safe error rendering, and process exit behavior.
- the public exports in `src/index.ts` allow the comparison engine to be embedded without invoking the CLI.
- library callers are expected to supply JSON-compatible catalog values for compared fields.

## Correctness invariants

- missing fields and explicit `null` are distinct states
- duplicate or unusable keys fail comparison rather than being collapsed
- duplicate CSV headings fail parsing rather than silently overwriting columns
- object keys are normalized deterministically before nested-value comparison
- terminal identifiers are escaped before display so catalog data cannot inject raw control sequences into logs

## Performance model

CSV is parsed as a stream so the raw CSV file is not retained as one additional in-memory string. The current comparison still retains parsed source/target records and two key indexes. Terminal mode records only the configured detail limit while maintaining complete counters; JSON mode deliberately retains the complete difference list. Deterministic sorting is retained because stable output is part of the review/CI contract.

Path expressions are precompiled once per key/field mapping, and difference counters are updated as differences are produced rather than rescanning the difference array after comparison.

Use `npm run benchmark` to measure the comparison hot path against representative catalog sizes before and after optimization changes.

## Safety and privacy

The CLI reads the two files supplied by the user and writes only when `--output` is explicitly provided. Existing output files are protected unless `--force` is also supplied. It performs no network requests, remote mutations, or synchronization. Real catalog exports should remain outside Git unless they contain intentionally fictional test data.
