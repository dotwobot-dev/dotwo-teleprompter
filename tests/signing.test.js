const assert = require("node:assert/strict");
const { test } = require("node:test");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { run } = require("../scripts/macos-signing");
const { parseIdentities, selectIdentities, checkSigning, notaryArgs } = require("../scripts/macos-signing");
const { variants, selectVariants, buildConfig, requireAccepted, notarize, validateResume } = require("../scripts/release-mac-signed");

const teamId = "ABCDEFGHIJ";
function identity(type, team = teamId, hash = type === "Application" ? "A".repeat(40) : "B".repeat(40)) {
  return { type, teamId: team, hash, name: `Developer ID ${type}: Example (${team})` };
}
const pair = [identity("Application"), identity("Installer")];
const output = pair.map((entry, index) => `  ${index + 1}) ${entry.hash} "${entry.name}"`).join("\n") + "\n 2 valid identities found\n";

test("selects only valid Developer ID identities, not Apple Development or invalid entries", () => {
  assert.deepEqual(parseIdentities(`${output}\n 3) ${"C".repeat(40)} "Apple Development: Example (${teamId})"\n 4) ${"D".repeat(40)} "Developer ID Application: Example (${teamId})" (CSSMERR_TP_CERT_EXPIRED)`), pair);
  assert.deepEqual(selectIdentities(pair), { teamId, application: pair[0], installer: pair[1] });
});

test("rejects missing certificates, mismatched teams and ambiguous certificates", () => {
  assert.throws(() => selectIdentities([]), /No unique/);
  assert.throws(() => selectIdentities([pair[0]]), /Installer/);
  assert.throws(() => selectIdentities([pair[0], identity("Installer", "ZYXWVUTSRQ")]), /No unique/);
  assert.throws(() => selectIdentities([...pair, pair[0]]), /found 2/);
  assert.throws(() => selectIdentities(pair, "invalid"), /Team ID/);
  const other = [identity("Application", "ZYXWVUTSRQ"), identity("Installer", "ZYXWVUTSRQ")];
  assert.equal(selectIdentities([...pair, ...other], teamId).teamId, teamId);
});

test("preflight authenticates through the Keychain and accepts empty Apple history", () => {
  const calls = [];
  const signing = checkSigning({
    platform: "darwin", env: {},
    execute: (command, args) => {
      calls.push({ command, args });
      return command === "security" ? output : JSON.stringify({ history: [] });
    }
  });
  assert.equal(signing.profile, "dotwo-notary");
  assert.deepEqual(calls[0].args, ["find-identity", "-v", "-p", "basic"]);
  assert.deepEqual(calls[1].args, ["notarytool", "history", "--keychain-profile", "dotwo-notary", "--output-format", "json"]);
  assert.deepEqual(notaryArgs({ profile: "custom", notaryKeychain: "/private/keychain" }), ["--keychain-profile", "custom", "--keychain", "/private/keychain"]);
});

test("preflight fails closed on other platforms, alternate credentials or failed authentication", () => {
  assert.throws(() => checkSigning({ platform: "linux", env: {} }), /macOS/);
  assert.throws(() => checkSigning({ platform: "darwin", env: { APPLE_ID: "example" } }), /Unset APPLE_ID/);
  assert.throws(() => checkSigning({ platform: "darwin", env: {}, execute: (command) => {
    if (command === "security") return output;
    throw new Error("Authentication failed");
  } }), /Authentication failed/);
  assert.throws(() => checkSigning({ platform: "darwin", env: {}, execute: (command) => command === "security" ? output : "{}" }), /valid notarization history/);
});

test("keeps modern and High Sierra builds independent and pins their OS minimums", () => {
  const signing = selectIdentities(pair);
  for (const name of Object.keys(variants)) {
    const config = buildConfig(name, `/private/output/${name}`, signing);
    assert.equal(config.forceCodeSigning, true);
    assert.equal(config.mac.hardenedRuntime, true);
    assert.equal(config.mac.notarize, false); // The script owns persisted, bounded notarization.
    assert.equal(config.mac.identity, pair[0].hash);
    assert.equal(config.pkg.identity, pair[1].hash);
    assert.equal(config.pkg.installLocation, "/Applications");
    assert.equal(config.dmg.sign, true);
    assert.equal(config.dmg.background, "build/dmg/background.png");
    assert.equal(config.dmg.format, "UDZO");
    assert.equal(config.dmg.contents.length, 2);
    assert.equal(config.dmg.contents[0].type, "file");
    assert.equal(config.dmg.contents[0].path, undefined); // The prepackaged app, never a stale dist/ copy.
    assert.equal(config.dmg.contents[1].path, "/Applications");
    assert.equal(config.dmg.contents[1].name, "Aplicaciones");
    assert(config.dmg.contents[0].x < config.dmg.contents[1].x);
    assert.equal(config.dmg.contents[0].y, config.dmg.contents[1].y);
    assert.deepEqual(config.mac.target, ["zip", "dmg", "pkg"]);
    assert(config.artifactName.includes(name));
  }
  assert.equal(buildConfig("legacy-x64", "/private/output", signing).electronVersion, "26.6.10");
  assert.equal(buildConfig("legacy-x64", "/private/output", signing).mac.minimumSystemVersion, "10.13");
  assert.equal(buildConfig("modern-arm64", "/private/output", signing).mac.minimumSystemVersion, "12.0");
  assert.notEqual(variants["modern-arm64"].electronVersion, "26.6.10");
  assert.throws(() => buildConfig("bad", "/private/output", signing), /Unknown variant/);
});

test("JSON commands keep stdout separate from warnings on stderr", () => {
  const output = run(process.execPath, ["-e", 'process.stdout.write("{\\"ok\\":true}"); process.stderr.write("warning");'], { stdoutOnly: true });
  assert.deepEqual(JSON.parse(output), { ok: true });
});

test("notarization persists the ID before waiting and resumes without another upload", async () => {
  const entries = {};
  const calls = [];
  let saved = 0;
  const execute = (command, args, options) => {
    calls.push(args);
    assert(options.timeout && options.stdoutOnly);
    if (args[1] === "submit") return JSON.stringify({ id: "submission", status: "In Progress" });
    assert.equal(entries.application.id, "submission");
    assert(saved > 0);
    return JSON.stringify({ id: "submission", status: args[1] === "wait" ? "Accepted" : "In Progress" });
  };
  const signing = { profile: "test" };
  await notarize("app.zip", signing, entries, "application", () => saved++, execute);
  assert(calls.some((args) => args.includes("--no-wait")));
  assert(calls.some((args) => args.includes("5m")));
  const previousUploads = calls.filter((args) => args[1] === "submit").length;
  await notarize("app.zip", signing, entries, "application", () => saved++, (command, args) => {
    calls.push(args);
    return JSON.stringify({ id: "submission", status: "Accepted" });
  });
  assert.equal(calls.filter((args) => args[1] === "submit").length, previousUploads);
});

test("pending or invalid submissions never become verified and accepted races are handled", async () => {
  const signing = { profile: "test" };
  const pending = { application: { id: "pending" } };
  await assert.rejects(notarize("app.zip", signing, pending, "application", () => {}, (command, args) => {
    if (args[1] === "submit") throw new Error("Must not resubmit");
    if (args[1] === "wait") throw new Error("Timed out");
    return JSON.stringify({ status: "In Progress" });
  }), /still processing.*pending/);
  assert.equal(pending.application.status, "In Progress");
  await assert.rejects(notarize("app.zip", signing, { application: { id: "invalid" } }, "application", () => {},
    () => JSON.stringify({ status: "Invalid" })), /did not succeed/);
  let infos = 0;
  const accepted = await notarize("app.zip", signing, { application: { id: "race" } }, "application", () => {}, (command, args) => {
    if (args[1] === "wait") throw new Error("Timed out");
    return JSON.stringify({ status: infos++ === 0 ? "In Progress" : "Accepted" });
  });
  assert.equal(accepted.status, "Accepted");
});

test("resume cannot use a path outside signed candidates", () => {
  assert.throws(() => validateResume(__dirname, {}, { teamId }), /inside release\/signed/);
});

test("an unknown upload outcome is preserved instead of uploaded twice", async () => {
  const entries = {};
  const signing = { profile: "test" };
  await assert.rejects(notarize("app.zip", signing, entries, "application", () => {}, () => {
    throw new Error("Upload connection lost");
  }), /connection lost/);
  assert.equal(entries.application.status, "Submitting");
  await assert.rejects(notarize("app.zip", signing, entries, "application", () => {}, () => {
    throw new Error("Must not upload again");
  }), /outcome.*unknown/);
});

test("builder cleanup cannot turn a failed release exit status into success", () => {
  const script = path.resolve(__dirname, "../scripts/release-mac-signed.js");
  const result = spawnSync(process.execPath, ["-e", `
    require("electron-builder");
    process.on("beforeExit", () => { process.exitCode = 0; });
    require(${JSON.stringify(script)}).reportFailure(new Error("not approved"));
  `], { cwd: path.resolve(__dirname, ".."), encoding: "utf8", timeout: 10000 });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /not approved/);
});

test("release selection is explicit and never accepts pending or invalid notarizations", () => {
  assert.deepEqual(selectVariants([], "arm64"), ["modern-arm64"]);
  assert.deepEqual(selectVariants(["--all"]), Object.keys(variants));
  assert.deepEqual(selectVariants(["--variant", "legacy-x64"]), ["legacy-x64"]);
  assert.throws(() => selectVariants(["--variant", "bad"]), /Usage/);
  assert.throws(() => selectVariants(["--all", "extra"]), /Usage/);
  assert.equal(requireAccepted({ status: "Accepted", id: "submission-id" }).id, "submission-id");
  for (const result of [{ status: "Invalid", id: "a" }, { status: "In Progress", id: "b" }, { status: "Accepted" }, {}]) {
    assert.throws(() => requireAccepted(result), /did not succeed/);
  }
});
