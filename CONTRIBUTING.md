# Contributing

Thanks for helping improve Catalog Parity.

## Principles

1. Keep comparisons deterministic and platform-neutral.
2. Fail visibly when keys or inputs are ambiguous.
3. Keep catalog data local by default.
4. Avoid platform credentials and destructive behavior in the core.
5. Add tests for behavior changes and bug fixes.

## Local setup

```bash
npm install
npm run check
npm run security
```

## Pull requests

Keep pull requests focused. Explain the comparison problem, expected behavior, any normalization tradeoffs, and the tests that cover the change. Changes to loading, indexing, path access, normalization, or difference accumulation should also include a before/after `npm run benchmark` result for a representative catalog size. Example exports must be fictional and free of customer, merchant, or employee data.

Conventional Commits are encouraged (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`), but correctness and clarity matter more than rigid formatting.
