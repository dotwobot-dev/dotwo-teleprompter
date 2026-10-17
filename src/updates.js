const https = require("node:https");
const os = require("node:os");

const RELEASES_URL = "https://api.github.com/repos/dotwobot-dev/dotwo-teleprompter/releases?per_page=30";

function parseVersion(value) {
  const match = String(value).replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)(?:-(beta|rc)\.(\d+))?$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] ? (match[4] === "rc" ? -1 : -2) : 0, Number(match[5] || 0)];
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return Math.sign(a[i] - b[i]);
  }
  return 0;
}

function currentVariant(arch = process.arch, darwinMajor = Number(os.release().split(".")[0])) {
  if (arch === "arm64") return "modern-arm64";
  if (arch === "x64") return darwinMajor >= 21 ? "modern-x64" : "legacy-x64";
  return null;
}

function isApprovedDownload(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" && !url.username && !url.password &&
      /^\/dotwobot-dev\/dotwo-teleprompter\/releases\/download\/v[\w.-]+\/DoTwo-Teleprompter-[\w.-]+-(modern-arm64|modern-x64|legacy-x64)\.dmg$/.test(url.pathname);
  } catch {
    return false;
  }
}

function fetchReleases() {
  return new Promise((resolve, reject) => {
    const request = https.get(RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "DoTwo-Teleprompter" },
      timeout: 8000
    }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`GitHub: HTTP ${response.statusCode}`));
        return;
      }
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        raw += chunk;
        if (raw.length > 1024 * 1024) request.destroy(new Error("Respuesta demasiado grande"));
      });
      response.on("end", () => {
        try { resolve(JSON.parse(raw)); } catch (error) { reject(error); }
      });
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("Tiempo de espera agotado")));
    request.on("error", reject);
  });
}

async function checkForUpdate({ currentVersion, includePrerelease, releases = fetchReleases, variant = currentVariant() }) {
  if (!variant) return { status: "unavailable", currentVersion };
  try {
    const list = await releases();
    if (!Array.isArray(list)) throw new Error("Respuesta inesperada de GitHub");
    const candidates = list.filter((item) => !item.draft && (includePrerelease || !item.prerelease) &&
      parseVersion(item.tag_name) && compareVersions(item.tag_name, currentVersion) > 0);
    candidates.sort((a, b) => compareVersions(b.tag_name, a.tag_name));
    for (const release of candidates) {
      const version = release.tag_name.replace(/^v/, "");
      const filename = `DoTwo-Teleprompter-${version}-${variant}.dmg`;
      const asset = release.assets?.find((item) => item.name === filename && isApprovedDownload(item.browser_download_url) &&
        new URL(item.browser_download_url).pathname.endsWith(`/releases/download/${release.tag_name}/${filename}`));
      if (asset) return { status: "available", currentVersion, version, variant, prerelease: Boolean(release.prerelease), url: asset.browser_download_url };
    }
    return { status: "current", currentVersion };
  } catch {
    return { status: "error", currentVersion, message: "No se pudo consultar GitHub. Inténtalo más tarde." };
  }
}

module.exports = { checkForUpdate, compareVersions, currentVariant, isApprovedDownload };
