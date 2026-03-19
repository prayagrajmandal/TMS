const { spawn } = require("node:child_process")
const path = require("node:path")

const root = process.cwd()

function run(name, cwd, args) {
  const child = spawn("npm.cmd", args, {
    cwd,
    stdio: "inherit",
    shell: false,
  })

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`)
      process.exitCode = code
    }
  })

  return child
}

const backend = run("backend", path.join(root, "backend"), ["run", "start"])
const frontend = run("frontend", path.join(root, "frontend"), ["run", "start"])

function shutdown() {
  backend.kill()
  frontend.kill()
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
