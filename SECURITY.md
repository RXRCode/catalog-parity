# Security Policy

## Supported versions

Only the latest released minor version is supported during the MVP phase.

## Reporting a vulnerability

Please use GitHub private vulnerability reporting when available. Do not attach private catalog exports, credentials, customer data, unreleased pricing, or production-system identifiers to a public issue.

## Data handling

Catalog Parity processes files locally and does not make network requests. It writes a file only when `--output` is explicitly provided. Existing output files are not overwritten unless `--force` is also supplied. Users are responsible for keeping real commerce exports out of source control and other unintended storage.

## Untrusted input

Catalog exports should be treated as untrusted input even when they came from a familiar platform. Catalog Parity escapes terminal control characters from values that are rendered as terminal/log identifiers, rejects duplicate CSV headings, distinguishes missing fields from explicit `null`, and rejects circular or non-JSON-compatible compared library values.

The CLI still performs substantial work on user-supplied data. Very large JSON inputs and very large difference sets can consume significant memory. CSV input is streamed from disk to avoid retaining the entire raw CSV string. Terminal mode bounds retained difference details to `--max-differences`, while JSON mode intentionally retains the complete difference list. Parsed source/target records and key indexes are still held in memory. Run very large or externally supplied files with appropriate process/container resource limits until fully streaming comparison is available.

## Dependency and CI posture

CI installs dependencies with lifecycle scripts disabled, uses least-privilege repository permissions, runs the full package smoke test, and audits production dependencies separately. Automated dependency updates should remain enabled for npm and GitHub Actions. GitHub Actions references should be pinned to immutable commit SHAs and updated through reviewed dependency pull requests.
