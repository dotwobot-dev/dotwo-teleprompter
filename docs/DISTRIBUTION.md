# Distribution

Current public builds are intended as unsigned beta ZIPs for technical users
and internal testing.

## Current status

- The app can be built locally from source.
- Generated ZIPs are not signed with Apple Developer ID.
- Generated ZIPs are not notarized by Apple.
- macOS Gatekeeper can show security warnings for downloaded builds.

## Build from source

```bash
npm ci
npm run check
npm run pack
```

For the current macOS beta ZIP workflow, use:

```bash
npm run release:mac
```

See also `docs/BUILD.md`.

## Future signing plan

The intended next distribution step is:

- Apple Developer ID certificate.
- Signed app bundles.
- Apple notarization.
- Signed ZIP/DMG release artifacts.

Until that is in place, public releases should be labelled clearly as unsigned
beta builds.
