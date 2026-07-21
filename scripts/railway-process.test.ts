import { describe, expect, it } from "vitest";

import { railwayPredeployProcess, railwayProcess } from "./railway-process.mjs";

describe("Railway process selection", () => {
  it("starts the web service explicitly", () => {
    expect(railwayProcess({ PODS_SERVICE_KIND: "web" })).toEqual({
      command: "pnpm",
      args: ["--filter", "@pods/web", "start"]
    });
  });

  it("starts the built worker explicitly", () => {
    expect(railwayProcess({ PODS_SERVICE_KIND: "worker" })).toEqual({
      command: "pnpm",
      args: ["--filter", "@pods/worker", "start"]
    });
  });

  it("refuses an unspecified process instead of guessing", () => {
    expect(() => railwayProcess({})).toThrow(
      "PODS_SERVICE_KIND must be web or worker"
    );
  });

  it("runs database migrations only for the web service", () => {
    expect(railwayPredeployProcess({ PODS_SERVICE_KIND: "web" })).toEqual({
      command: "pnpm",
      args: ["--filter", "@pods/db", "db:migrate"]
    });
    expect(railwayPredeployProcess({ PODS_SERVICE_KIND: "worker" })).toBeNull();
  });
});
