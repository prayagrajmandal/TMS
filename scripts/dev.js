const { spawn } = require("node:child_process")
const path = require("node:path")

const root = process.cwd()

function run(name, cwd, args) {
  const child = spawn(args[0], args.slice(1), {
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

const backend = run("backend", root, ["python", "-m", "uvicorn", "main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000", "--reload"])
const frontend = run("frontend", path.join(root, "frontend"), ["npm.cmd", "run", "dev"])

function shutdown() {
  backend.kill()
  frontend.kill()
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
