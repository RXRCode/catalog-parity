# Changelog

All notable changes to this project will be documented here.

## 0.1.2 - 2026-08-26

- Distinguish missing fields from explicit `null` values in comparison results.
- Escape terminal control characters from catalog identifiers and CLI error output.
- Protect existing `--output` files by default and add explicit `--force` overwrite support.
- Reject circular and non-JSON-compatible compared library values with bounded normalization depth.
- Stream CSV parsing, reject duplicate CSV headings, and validate unsupported extensions before file reads.
- Precompile mapped field paths, maintain difference counters incrementally, and bound retained terminal difference details in the comparison hot path.
- Expand unit and packed-artifact smoke coverage for adversarial input, output safety, and public API semantics.
- Add repeatable performance benchmarking, production-dependency auditing, Dependabot configuration, and pinned GitHub Actions.

## 0.1.1 - 2026-08-24

- Normalize npm repository metadata and pin public npm-registry publication.
- Add explicit ESM, type declaration, and side-effect package metadata.
- Export the package version through the CLI and public library.
- Add clean-build and packed-artifact smoke tests.
- Verify the installed binary, exit codes, and public library exports in a temporary consumer project.
- Add a maintainer npm release checklist.

## 0.1.0 - 2026-08-24

- Compare CSV and JSON commerce catalog exports.
- Map differently named source and target keys and fields.
- Report missing, extra, and field-level differences.
- Produce terminal and JSON reports with CI-friendly exit codes.
- Process exports locally without credentials or network calls.
