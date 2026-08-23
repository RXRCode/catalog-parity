# Catalog Parity

> Compare commerce catalogs before migrations and integrations go live.

Catalog Parity is an offline, deterministic CLI for comparing source and target catalog exports. It finds records that did not arrive, unexpected target records, and field-level drift without requiring storefront, ERP, PIM, or marketplace credentials.

**Status:** v0.1.x pre-release / early open source.

Catalog Parity is an independent open-source project by [RXR Code](https://rxrcode.dev/open-source/catalog-parity).

## Why this exists

Catalog migrations and integrations often look successful before anyone checks whether every product, SKU, price, status, or title arrived correctly. Manual spreadsheet checks are difficult to repeat and easy to miss.

Catalog Parity keeps that verification explicit:

```text
Export source → Export target → Compare → Review differences → Release
```

The comparison runs locally. Catalog data is not uploaded to RXR Code or any third party.

## Quick start

Clone the repository and install dependencies:

```bash
git clone https://github.com/RXRCode/catalog-parity.git
cd catalog-parity
npm install
npm run build
npm link
```

Compare the included example exports:

```bash
catalog-parity compare examples/source.csv examples/target.csv \
  --key sku \
  --field title \
  --field price \
  --field status
```

Example output:

```text
✗ Catalog differences found
Source 3 · Target 3 · Matched 2 · Missing 1 · Extra 1 · Changed fields 1

CHANGED MUG-WHT price
        source: "18.50"
        target: "19.00"

MISSING TOTE-NAT not found in target

EXTRA   CAP-NVY only in target
```

Exit code `0` means parity, `1` means differences were found, and `2` means the inputs or command were invalid.

## Compare different export schemas

Use `source=target` mappings when systems name the same field differently:

```bash
catalog-parity compare erp-products.csv storefront-products.json \
  --key product_code=sku \
  --field product_name=title \
  --field unit_price=variants.price \
  --field lifecycle_status=status
```

Dot paths work for nested JSON fields. A literal CSV heading containing dots is checked before nested traversal.

## Wrapped JSON exports

JSON can be a top-level array or use a conventional `products`, `items`, `records`, or `data` array. For any other shape, provide the path:

```bash
catalog-parity compare source.json target.json \
  --source-path export.catalog.products \
  --target-path payload.items \
  --key sku \
  --field title
```

## Machine-readable reports

Emit the complete result as JSON and optionally save it:

```bash
catalog-parity compare source.csv target.csv \
  --key sku \
  --field title \
  --field price \
  --format json \
  --output parity-report.json
```

This makes the CLI suitable for CI migration gates and repeatable reconciliation jobs.

## Options

```text
-k, --key <mapping>          key field or source=target mapping (default: sku)
-f, --field <mapping>        field to compare; repeat for additional fields
    --source-path <path>      path to the source record array in JSON
    --target-path <path>      path to the target record array in JSON
    --format <format>         terminal or json
-o, --output <file>          write the report to a file
    --ignore-case             compare keys and strings without case sensitivity
    --no-trim                 preserve leading and trailing whitespace
    --ignore-extra            allow records found only in the target
    --max-differences <n>     terminal detail limit (default: 50)
```

Running with no `--field` options checks record presence only.

## Comparison behavior

- Records are matched by one required key.
- Duplicate or missing keys fail validation rather than hiding ambiguity.
- Strings are trimmed by default.
- Primitive CSV and JSON values compare by their string representation.
- Nested objects are compared with stable key ordering.
- Target-only records are differences unless `--ignore-extra` is supplied.
- Difference ordering is deterministic for reviewable CI output.

## MVP boundaries

Supported in v0.1:

- CSV and JSON catalog exports
- cross-system key and field mappings
- nested JSON fields
- missing, extra, and field-mismatch reporting
- terminal and JSON output
- CI-friendly exit codes
- local-only processing

Deliberately not supported yet:

- direct platform, ERP, or PIM connections
- fuzzy product matching
- variant-array matching rules
- automatic data correction or synchronization
- remote dashboards or stored reports
- destructive writes of any kind

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run check
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [docs/architecture.md](docs/architecture.md), and [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
