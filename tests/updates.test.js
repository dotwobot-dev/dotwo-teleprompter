const assert = require("node:assert/strict");
const { test } = require("node:test");
const { checkForUpdate, compareVersions, currentVariant, isApprovedDownload } = require("../src/updates");

const asset = (version, variant) => ({
  name: `DoTwo-Teleprompter-${version}-${variant}.dmg`,
  browser_download_url: `https://github.com/dotwobot-dev/dotwo-teleprompter/releases/download/v${version}/DoTwo-Teleprompter-${version}-${variant}.dmg`
});

test("versiones beta, RC y estable se ordenan correctamente", () => {
  assert.ok(compareVersions("0.2.1-beta.2", "0.2.1-beta.1") > 0);
  assert.ok(compareVersions("0.2.1-rc.1", "0.2.1-beta.2") > 0);
  assert.ok(compareVersions("0.2.1", "0.2.1-rc.1") > 0);
  assert.equal(compareVersions("v0.2.1-beta.1", "0.2.1-beta.1"), 0);
});

test("arquitectura y macOS seleccionan la familia correcta", () => {
  assert.equal(currentVariant("arm64", 25), "modern-arm64");
  assert.equal(currentVariant("x64", 21), "modern-x64");
  assert.equal(currentVariant("x64", 17), "legacy-x64");
  assert.equal(currentVariant("x64", 20), "legacy-x64");
});

test("solo se ofrece el DMG compatible de una release pública", async () => {
  const version = "0.2.1-beta.2";
  const releases = async () => [{ tag_name: `v${version}`, prerelease: true, draft: false,
    assets: [asset(version, "modern-arm64"), asset(version, "modern-x64"), asset(version, "legacy-x64")] }];
  const result = await checkForUpdate({ currentVersion: "0.2.1-beta.1", includePrerelease: true, releases, variant: "legacy-x64" });
  assert.equal(result.status, "available");
  assert.equal(result.variant, "legacy-x64");
  assert.match(result.url, /legacy-x64\.dmg$/);
  assert.equal((await checkForUpdate({ currentVersion: "0.2.1-beta.1", includePrerelease: false, releases, variant: "legacy-x64" })).status, "current");
});

test("se rechazan descargas fuera del repositorio y assets mal etiquetados", async () => {
  assert.equal(isApprovedDownload("https://evil.example/releases/download/v0.2.1/DoTwo-Teleprompter-0.2.1-modern-arm64.dmg"), false);
  const release = { tag_name: "v0.2.1-beta.2", prerelease: true, draft: false,
    assets: [{ ...asset("0.2.1-beta.2", "modern-arm64"), browser_download_url: asset("0.2.1-beta.3", "modern-arm64").browser_download_url }] };
  assert.equal((await checkForUpdate({ currentVersion: "0.2.1-beta.1", includePrerelease: true,
    releases: async () => [release], variant: "modern-arm64" })).status, "current");
});
