import { spawn } from "node:child_process";

const requestedTests = process.argv.slice(2);
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
let activeChild;
let interruptedSignal;

function forwardSignal(signal) {
  interruptedSignal = signal;
  activeChild?.kill(signal);
}

process.once("SIGINT", () => forwardSignal("SIGINT"));
process.once("SIGTERM", () => forwardSignal("SIGTERM"));

async function runPnpm(args) {
  return new Promise((resolve, reject) => {
    activeChild = spawn(
      pnpmCommand,
      args,
      {
        env: {
          ...process.env,
          NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--max-old-space-size=4096"
        },
        stdio: "inherit"
      }
    );
    activeChild.once("error", reject);
    activeChild.once("exit", (code, signal) => {
      activeChild = undefined;
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

let exitCode = 0;
exitCode = await runPnpm(["run", "build"]);
if (exitCode === 0 && !interruptedSignal) {
  exitCode = await runPnpm([
    "exec",
    "playwright",
    "test",
    ...requestedTests
  ]);
}

if (interruptedSignal) {
  process.kill(process.pid, interruptedSignal);
} else {
  process.exitCode = exitCode;
}
