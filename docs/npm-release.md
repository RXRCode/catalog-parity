# npm release checklist

Catalog Parity publishes as the public scoped package `@rxrcode/catalog-parity` on the npm registry.

## Preconditions

- The release commit is merged to `main`.
- `package.json`, `package-lock.json`, `src/version.ts`, and `CHANGELOG.md` use the same version.
- The matching Git tag points to the exact release commit.
- GitHub Actions passes on Node.js 20 and 22.
- The npm account can publish packages in the `@rxrcode` scope.
- Any npm two-factor authentication requirement can be completed.

Do not commit an npm token or a user-level `.npmrc` file.

## Verify the release artifact

Use Node.js 20 or 22:

```bash
npm ci --ignore-scripts
npm run check
npm publish --dry-run
```

`npm run check` builds the package, packs it, installs that tarball into a clean temporary project, runs the installed CLI, checks parity and difference exit codes, and imports the public library entry point.

Review the dry-run output and confirm that the tarball contains only the compiled `dist` files, package metadata, README, changelog, and license.

## Publish

Confirm the active identity immediately before publishing:

```bash
npm login
npm whoami
npm publish --access public
```

The package-level `publishConfig` pins publication to `https://registry.npmjs.org/` with public access.

## Verify npm

Run these checks from a clean directory after npm finishes processing the release:

```bash
npm view @rxrcode/catalog-parity version dist-tags --json
npx @rxrcode/catalog-parity@0.1.1 --version
npx @rxrcode/catalog-parity@0.1.1 --help
```

Also run one comparison with fictional exports before updating the RXRCode website to claim npm availability.

## Failure handling

- npm versions are immutable. Never attempt to replace an already-published version.
- If publication partially succeeds, verify the registry before retrying.
- If `0.1.1` already exists, increment the patch version everywhere and create a new release.
- If the npm scope rejects publication, confirm account membership and package-creation permissions with the RXRCode npm organization owner.
