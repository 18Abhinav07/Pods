import { spawn } from "node:child_process";

import { railwayPredeployProcess } from "./railway-process.mjs";

const selected = railwayPredeployProcess(process.env);
if (!selected) process.exit(0);

const child = spawn(selected.command, selected.args, {
  env: process.env,
  stdio: "inherit"
});
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
