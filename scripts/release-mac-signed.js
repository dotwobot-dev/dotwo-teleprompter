const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");
const { run, checkSigning, notaryArgs } = require("./macos-signing");
const packageInfo = require("../package.json");

const root = path.resolve(__dirname, "..");
const variants = {
  "modern-arm64": { arch: "arm64", electronVersion: packageInfo.devDependencies.electron, minimumSystemVersion: "12.0", legacy: false },
  "modern-x64": { arch: "x64", electronVersion: packageInfo.devDependencies.electron, minimumSystemVersion: "12.0", legacy: false },
  "legacy-x64": { arch: "x64", electronVersion: "26.6.10", minimumSystemVersion: "10.13", legacy: true }
};

function selectVariants(args, arch = process.arch) {
  if (args.length === 0) return [arch === "arm64" ? "modern-arm64" : "modern-x64"];
  if (args.length === 1 && args[0] === "--all") return Object.keys(variants);
  if (args.length === 2 && args[0] === "--variant" && variants[args[1]]) return [args[1]];
  throw new Error("Usage: npm run release:mac:signed -- [--all | --variant modern-arm64|modern-x64|legacy-x64 | --resume /absolute/candidate/variant]");
}

function buildConfig(name, output, signing) {
  const variant = variants[name];
  if (!variant) throw new Error(`Unknown variant: ${name}`);
  return {
    ...packageInfo.build,
    electronVersion: variant.electronVersion,
    forceCodeSigning: true,
    artifactName: `DoTwo-Teleprompter-${packageInfo.version}-${name}.\${ext}`,
    directories: { ...packageInfo.build.directories, output },
    mac: {
      ...packageInfo.build.mac,
      target: ["zip", "dmg", "pkg"],
      identity: signing.application.hash,
      minimumSystemVersion: variant.minimumSystemVersion,
      hardenedRuntime: true,
      entitlements: "build/entitlements.mac.plist",
      entitlementsInherit: "build/entitlements.mac.plist",
      // Notarization is handled below with persisted submission IDs and bounded waits.
      notarize: false
    },
    dmg: { ...packageInfo.build.dmg, title: `${packageInfo.build.productName} ${packageInfo.version} ${name}`, sign: true, writeUpdateInfo: false },
    pkg: {
      identity: signing.installer.hash,
      installLocation: "/Applications",
      allowAnywhere: false,
      allowCurrentUserHome: false,
      allowRootDirectory: true,
      isVersionChecked: true
    }
  };
}

function requireAccepted(result) {
  if (result.status !== "Accepted" || !result.id) {
    throw new Error(`Notarization did not succeed: ${result.status || "unknown"}; submission ${result.id || "unknown"}.`);
  }
  return result;
}

function verifyApplicationSignature(appPath, signing) {
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);
  const details = run("codesign", ["--display", "--verbose=4", appPath]);
  if (!details.includes(`TeamIdentifier=${signing.teamId}`) || !/flags=.*\bruntime\b/.test(details) || !/^Timestamp=/m.test(details)) {
    throw new Error("Application lacks the expected Team ID, hardened runtime or secure timestamp.");
  }
  const codeHash = details.match(/^CDHash=([a-f0-9]+)$/m)?.[1];
  if (!codeHash) throw new Error("Application has no code signature hash.");
  return codeHash;
}

function verifyApplication(appPath, signing) {
  verifyApplicationSignature(appPath, signing);
  const assessment = run("spctl", ["--assess", "--verbose=2", "--type", "execute", appPath]);
  if (!assessment.includes("source=Notarized Developer ID")) throw new Error("Application is not accepted as Notarized Developer ID.");
  run("xcrun", ["stapler", "validate", appPath]);
}

function verifyArtifact(file, signing) {
  const extension = path.extname(file);
  if (extension === ".zip") {
    const extracted = fs.mkdtempSync(path.join(os.tmpdir(), "dotwo-release-verify-"));
    try {
      run("ditto", ["-x", "-k", file, extracted]);
      verifyApplication(path.join(extracted, `${packageInfo.build.productName}.app`), signing);
    } finally {
      fs.rmSync(extracted, { recursive: true, force: true });
    }
  } else if (extension === ".pkg") {
    const signature = run("pkgutil", ["--check-signature", file]);
    if (!signature.includes(signing.installer.name)) throw new Error("PKG is not signed by the selected Developer ID Installer.");
    run("spctl", ["--assess", "--verbose=2", "--type", "install", file]);
    run("xcrun", ["stapler", "validate", file]);
  } else if (extension === ".dmg") {
    run("codesign", ["--verify", "--strict", file]);
    run("spctl", ["--assess", "--verbose=2", "--type", "open", "--context", "context:primary-signature", file]);
    run("xcrun", ["stapler", "validate", file]);
  } else {
    throw new Error(`Unsupported artifact: ${file}`);
  }
}

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

function saveManifest(file, manifest) {
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

async function notarize(file, signing, entries, key, save, execute = run) {
  let entry = entries[key];
  if (!entry) {
    entry = entries[key] = { status: "Submitting" };
    save();
    const submitted = JSON.parse(execute("xcrun", [
      "notarytool", "submit", file, ...notaryArgs(signing), "--no-wait", "--output-format", "json"
    ], { timeout: 10 * 60 * 1000, stdoutOnly: true }));
    if (!submitted.id) throw new Error("Apple did not return a submission ID.");
    entry = entries[key] = { id: submitted.id, status: submitted.status || "In Progress" };
    save();
  }
  if (!entry.id) throw new Error(`Submission outcome for ${key} is unknown. Check Apple history before retrying; refusing a duplicate upload.`);
  process.stdout.write(`==> Notarization ${key}: ${entry.id}\n`);
  const args = [...notaryArgs(signing), "--output-format", "json"];
  entry.status = JSON.parse(execute("xcrun", ["notarytool", "info", entry.id, ...args], {
    timeout: 60000, stdoutOnly: true
  })).status;
  save();
  if (entry.status === "In Progress") {
    try {
      entry.status = JSON.parse(execute("xcrun", [
        "notarytool", "wait", entry.id, ...args, "--timeout", "5m"
      ], { timeout: 6 * 60 * 1000, stdoutOnly: true })).status;
      save();
    } catch (error) {
      entry.status = JSON.parse(execute("xcrun", ["notarytool", "info", entry.id, ...args], {
        timeout: 60000, stdoutOnly: true
      })).status;
      save();
      if (entry.status === "In Progress") {
        throw new Error(`Apple is still processing ${entry.id}. Resume this candidate later; do not resubmit it.`);
      }
      if (entry.status !== "Accepted") throw error;
    }
  }
  return requireAccepted(entry);
}

function validateResume(output, manifest, signing) {
  const signedRoot = path.join(root, "release", "signed");
  const relative = path.relative(signedRoot, fs.realpathSync(output));
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Resume must point to a candidate inside release/signed/.");
  }
  const variant = variants[manifest.variant];
  if (!variant || manifest.version !== packageInfo.version || manifest.teamId !== signing.teamId ||
      Object.entries(variant).some(([key, value]) => manifest[key] !== value) || !manifest.appCodeHash) {
    throw new Error("Candidate metadata does not match the current version, variant or signing team.");
  }
}

async function finishCandidate(output, manifest, signing) {
  const { build, Platform, Arch } = require("electron-builder");
  const manifestPath = path.join(output, "manifest.json");
  const save = () => saveManifest(manifestPath, manifest);
  const appPath = path.join(output, manifest.arch === "arm64" ? "mac-arm64" : "mac", `${packageInfo.build.productName}.app`);
  manifest.notarizations ||= {};
  try {
    const codeHash = verifyApplicationSignature(appPath, signing);
    if (manifest.appCodeHash !== codeHash) throw new Error("The signed app changed since submission; refusing to reuse its ticket.");
    const submissionZip = path.join(output, "application-for-notarization.zip");
    if (!manifest.notarizations.application) {
      run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appPath, submissionZip]);
    }
    await notarize(submissionZip, signing, manifest.notarizations, "application", save);
    run("xcrun", ["stapler", "staple", appPath]);
    verifyApplication(appPath, signing);
    const extensions = ["zip", "dmg", "pkg"];
    const artifactPath = (extension) => path.join(output, `DoTwo-Teleprompter-${packageInfo.version}-${manifest.variant}.${extension}`);
    if (!manifest.packaged) {
      // Prepackaged skips app signing: preserve the already approved app and its ticket.
      await build({
        projectDir: root, prepackaged: appPath, publish: "never",
        targets: Platform.MAC.createTarget(extensions, Arch[manifest.arch]),
        config: buildConfig(manifest.variant, output, signing)
      });
      if (verifyApplicationSignature(appPath, signing) !== codeHash) throw new Error("Packaging changed the approved app.");
      manifest.packaged = true;
      manifest.packagedHashes = {};
      for (const extension of extensions) manifest.packagedHashes[extension] = await sha256(artifactPath(extension));
      save();
    }
    for (const extension of extensions) {
      const file = artifactPath(extension);
      const hash = await sha256(file);
      const verified = manifest.artifacts.find((artifact) => artifact.file === path.basename(file));
      if (hash !== (verified?.sha256 || manifest.packagedHashes[extension])) throw new Error(`Artifact changed: ${file}`);
      if (extension !== "zip") {
        if (extension === "pkg") {
          const signature = run("pkgutil", ["--check-signature", file]);
          if (!signature.includes(signing.installer.name)) throw new Error("Installer identity does not match.");
        } else {
          run("codesign", ["--verify", "--strict", file]);
        }
        await notarize(file, signing, manifest.notarizations, extension, save);
        run("xcrun", ["stapler", "staple", file]);
        // Stapling changes container bytes, not the signed contents.
        manifest.packagedHashes[extension] = await sha256(file);
        save();
      }
      verifyArtifact(file, signing);
      const artifact = { file: path.basename(file), sha256: await sha256(file) };
      if (verified) Object.assign(verified, artifact);
      else manifest.artifacts.push(artifact);
      save();
    }
    manifest.status = "verified";
    manifest.verifiedAt = new Date().toISOString();
    delete manifest.error;
    save();
    process.stdout.write(`==> Verified candidate: ${output}\n`);
  } catch (error) {
    manifest.status = "incomplete";
    manifest.error = error.message;
    save();
    process.stderr.write(`Resume: npm run release:mac:signed -- --resume "${output}"\n`);
    throw error;
  }
}

async function release(name, sessionDirectory, signing) {
  const { build, Platform, Arch } = require("electron-builder");
  const output = path.join(sessionDirectory, name);
  fs.mkdirSync(output);
  const manifestPath = path.join(output, "manifest.json");
  const manifest = {
    status: "incomplete",
    version: packageInfo.version,
    variant: name,
    ...variants[name],
    teamId: signing.teamId,
    profile: signing.profile,
    sourceCommit: run("git", ["rev-parse", "HEAD"], { cwd: root }).trim(),
    sourceDirty: Boolean(run("git", ["status", "--porcelain"], { cwd: root }).trim()),
    createdAt: new Date().toISOString(),
    artifacts: []
  };
  const save = () => saveManifest(manifestPath, manifest);
  save();
  try {
    process.stdout.write(`==> ${name}: Electron ${variants[name].electronVersion}, macOS ${variants[name].minimumSystemVersion}+\n`);
    if (variants[name].legacy) process.stdout.write("WARNING: Electron 26 is unsupported; this is an internal legacy compatibility build.\n");
    await build({
      projectDir: root,
      publish: "never",
      targets: Platform.MAC.createTarget(["dir"], Arch[variants[name].arch]),
      config: buildConfig(name, output, signing)
    });
    const appPath = path.join(output, variants[name].arch === "arm64" ? "mac-arm64" : "mac", `${packageInfo.build.productName}.app`);
    manifest.appCodeHash = verifyApplicationSignature(appPath, signing);
    save();
    await finishCandidate(output, manifest, signing);
  } catch (error) {
    manifest.error = error.message;
    save();
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const resume = args.length === 2 && args[0] === "--resume" ? args[1] : undefined;
  const names = resume ? [] : selectVariants(args);
  const signing = checkSigning();
  process.env.APPLE_KEYCHAIN_PROFILE = signing.profile;
  if (resume) {
    if (!path.isAbsolute(resume)) throw new Error("Resume requires an absolute candidate path.");
    const manifest = JSON.parse(fs.readFileSync(path.join(resume, "manifest.json"), "utf8"));
    validateResume(resume, manifest, signing);
    await finishCandidate(resume, manifest, signing);
    return;
  }
  const sessionDirectory = path.join(root, "release", "signed", `${packageInfo.version}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.mkdirSync(sessionDirectory, { recursive: true });
  run("npm", ["run", "check"], { cwd: root, stdio: "inherit" });
  run("npm", ["test"], { cwd: root, stdio: "inherit" });
  for (const name of names) await release(name, sessionDirectory, signing);
}

function reportFailure(error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
  // electron-builder's cleanup hooks can replace the exit status with zero.
  process.on("exit", () => { process.exitCode = 1; });
}

if (require.main === module) main().catch(reportFailure);

module.exports = { variants, selectVariants, buildConfig, requireAccepted, notarize, validateResume, reportFailure };
