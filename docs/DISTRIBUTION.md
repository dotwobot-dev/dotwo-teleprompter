# Distribution

Current public builds are intended as unsigned beta ZIPs for technical users
and internal testing.

## Current status

- The app can be built locally from source.
- Published beta ZIPs are not signed with Apple Developer ID.
- Published beta ZIPs are not notarized by Apple.
- macOS Gatekeeper can show security warnings for downloaded builds.
- On 2026-10-04, the owner's individual Developer ID Application and Developer
  ID Installer identities, plus Apple's G2 intermediate, were installed and
  verified on the local build Mac. The two identities use separate private keys.
- Notarization credentials are stored in the local Keychain profile
  `dotwo-notary`; authentication has been verified without exporting secrets.
- Version `0.2.0` is an unpublished candidate. A new local workflow requires
  both identities, hardened runtime, notarization and artifact verification.
  See `docs/PROJECT_STATUS.md` for actual build results; configuration alone
  is not evidence of a completed signed/notarized release.

## Compatibility policy

- Modern Apple Silicon and Intel: Electron 43.7.7, macOS 12 or later.
- Legacy Intel: Electron 26.6.10, macOS 10.13 or later, retained for faculty
  machines. This runtime is end-of-life and receives no security fixes.
- Signing/notarization does not eliminate the legacy runtime's security risk.
  Legacy is an internal compatibility exception, not the recommended build.

## Build from source

```bash
npm ci
npm run check
npm run pack
```

For a new signed candidate on this configured Mac, use:

```bash
npm run check:mac-signing
npm run release:mac:signed -- --all
```

See also `docs/BUILD.md`.

## Installer formats

- DMG is the preferred format for manual installation: open the disk image,
  drag DoTwo Teleprompter onto Aplicaciones, eject it and launch from Applications.
  The image includes a Spanish instruction background and Retina resources.
- PKG is the alternative for managed laboratory deployment into `/Applications`.
- ZIP remains available as an alternative archive; installing both formats is
  unnecessary. Choose the correct architecture and macOS compatibility variant.

See [installation and update instructions](INSTALLATION.md). The shared DMG
layout is used by all variants; it does not change the signed application.

## Release checks

The signed workflow:

- Signs apps/DMGs with Developer ID Application and PKGs with Developer ID Installer.
- Notarization credentials stored in the local Keychain, never in Git.
- Release checks that stop if signing or notarization is missing or fails.
- Requires Apple's acceptance and stapled notarization tickets.
- Verifies ZIP contents, DMG and PKG with macOS tooling.
- Keeps a manifest with artifact hashes and `incomplete`/`verified` state.
- Never publishes to GitHub or deletes previous signed candidates.
- Stores submission IDs before waiting, with bounded waits and `--resume`.
  Pending/invalid submissions remain `incomplete` and return a failure status.
  An unknown upload outcome stops rather than uploading a duplicate.

Only a candidate with all checks complete can be considered for distribution,
after functional/field tests and dependency review. Existing unsigned beta ZIPs
must keep their original labels. `release:mac` is the historical beta workflow,
not a substitute for the signed command.
