const { spawnSync } = require("node:child_process");

function run(command, args, options = {}) {
  const { stdoutOnly = false, ...spawnOptions } = options;
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, LC_ALL: "C" },
    ...spawnOptions
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "").trim()}`);
  }
  return stdoutOnly ? result.stdout || "" : `${result.stdout || ""}${result.stderr || ""}`;
}

function parseIdentities(output) {
  const identities = [];
  for (const line of output.split("\n")) {
    const match = line.match(/^\s*\d+\)\s+([A-Fa-f0-9]{40})\s+"(Developer ID (Application|Installer): (.+) \(([A-Z0-9]{10})\))"\s*$/);
    if (match) {
      identities.push({ hash: match[1], name: match[2], type: match[3], teamId: match[5] });
    }
  }
  return identities;
}

function selectIdentities(identities, requestedTeam) {
  if (requestedTeam && !/^[A-Z0-9]{10}$/.test(requestedTeam)) {
    throw new Error("APPLE_TEAM_ID must be a 10-character Team ID.");
  }
  const teams = [...new Set(identities.map((identity) => identity.teamId))];
  const teamId = requestedTeam || (teams.length === 1 ? teams[0] : undefined);
  if (!teamId) throw new Error("No unique Developer ID team found. Set APPLE_TEAM_ID if multiple teams exist.");
  const selected = { teamId };
  for (const type of ["Application", "Installer"]) {
    const matches = identities.filter((identity) => identity.teamId === teamId && identity.type === type);
    if (matches.length !== 1) throw new Error(`Expected one valid Developer ID ${type} identity for ${teamId}; found ${matches.length}.`);
    selected[type.toLowerCase()] = matches[0];
  }
  return selected;
}

function notaryArgs(signing) {
  const args = ["--keychain-profile", signing.profile];
  if (signing.notaryKeychain) args.push("--keychain", signing.notaryKeychain);
  return args;
}

function checkSigning({ env = process.env, platform = process.platform, execute = run } = {}) {
  if (platform !== "darwin") throw new Error("Signing requires macOS.");
  // Keep this local workflow on the validated Keychain rather than alternate credentials.
  for (const variable of ["APPLE_ID", "APPLE_APP_SPECIFIC_PASSWORD", "APPLE_API_KEY", "APPLE_API_KEY_ID", "APPLE_API_ISSUER", "CSC_LINK", "CSC_INSTALLER_LINK"]) {
    if (env[variable]) throw new Error(`Unset ${variable}; this workflow uses the local Keychain only.`);
  }
  const args = ["find-identity", "-v", "-p", "basic"];
  if (env.CSC_KEYCHAIN) args.push(env.CSC_KEYCHAIN);
  const identities = selectIdentities(parseIdentities(execute("security", args)), env.APPLE_TEAM_ID);
  const signing = {
    ...identities,
    profile: env.APPLE_KEYCHAIN_PROFILE || "dotwo-notary",
    notaryKeychain: env.APPLE_KEYCHAIN || undefined
  };
  const history = JSON.parse(execute("xcrun", ["notarytool", "history", ...notaryArgs(signing), "--output-format", "json"], { timeout: 60000, stdoutOnly: true }));
  if (!Array.isArray(history.history)) throw new Error("Apple did not return a valid notarization history.");
  return signing;
}

if (require.main === module) {
  try {
    process.stdout.write(`${JSON.stringify(checkSigning(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { run, parseIdentities, selectIdentities, notaryArgs, checkSigning };
