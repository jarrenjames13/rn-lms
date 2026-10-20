const { spawnSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const projectRoot = path.dirname(require.resolve("./package.json"));
const outputDir = mkdtempSync(path.join(os.tmpdir(), "rn-lms-mobile-smoke-"));

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    throw new Error(`${path.basename(command)} ${args.join(" ")} failed`);
  }
}

try {
  run(process.execPath, [path.join(projectRoot, "mobile-content-smoke.test.cjs")]);
  run(process.execPath, [
    require.resolve("expo/bin/cli"),
    "export",
    "--platform",
    "android",
    "--output-dir",
    outputDir,
  ]);
  console.log("Mobile rich-content smoke checks passed.");
} catch {
  process.exitCode = process.exitCode || 1;
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
