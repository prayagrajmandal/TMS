const { spawnSync } = require("node:child_process")
const path = require("node:path")

const root = process.cwd()

const backendResult = spawnSync("python", ["-m", "py_compile", path.join("backend", "main.py")], {
  cwd: root,
  stdio: "inherit",
  shell: false,
})

if (backendResult.status !== 0) {
  process.exit(backendResult.status || 1)
}

const frontendResult = spawnSync("npm.cmd", ["run", "build"], {
  cwd: path.join(root, "frontend"),
  stdio: "inherit",
  shell: false,
})

if (frontendResult.status !== 0) {
  process.exit(frontendResult.status || 1)
}
