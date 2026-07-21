import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

export function railwayProcess(environment) {
  if (environment.PODS_SERVICE_KIND === "web") {
    return {
      command: "pnpm",
      args: ["--filter", "@pods/web", "start"]
    };
  }
  if (environment.PODS_SERVICE_KIND === "worker") {
    return {
      command: "pnpm",
      args: ["--filter", "@pods/worker", "start"]
    };
  }
  throw new Error("PODS_SERVICE_KIND must be web or worker");
}

export function railwayPredeployProcess(environment) {
  if (environment.PODS_SERVICE_KIND === "web") {
    return {
      command: "pnpm",
      args: ["--filter", "@pods/db", "db:migrate"]
    };
  }
  if (environment.PODS_SERVICE_KIND === "worker") return null;
  throw new Error("PODS_SERVICE_KIND must be web or worker");
}

function start() {
  const selected = railwayProcess(process.env);
  const child = spawn(selected.command, selected.args, {
    env: process.env,
    stdio: "inherit"
  });

  const forward = (signal) => {
    if (!child.killed) child.kill(signal);
  };
  process.once("SIGINT", () => forward("SIGINT"));
  process.once("SIGTERM", () => forward("SIGTERM"));
  child.once("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.once("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code ?? 1;
  });
}

const entryPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryPath) start();
