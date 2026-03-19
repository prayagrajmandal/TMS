const { spawnSync } = require("node:child_process")
const path = require("node:path")

const root = process.cwd()

for (const app of ["backend", "frontend"]) {
  const result = spawnSync("npm.cmd", ["run", "build"], {
    cwd: path.join(root, app),
    stdio: "inherit",
    shell: false,
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}
