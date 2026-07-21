import { createServer } from "node:http";

export type WorkerHealthState = {
  ready: boolean;
  cycleHealthy: boolean | null;
  lastSuccessfulCycleAt: string | null;
};

export function workerHealthResponse(pathname: string, state: WorkerHealthState) {
  if (pathname === "/health/live" || pathname === "/api/health/live") {
    return {
      statusCode: 200,
      body: { service: "pods-worker", status: "live" }
    } as const;
  }

  if (pathname === "/health/ready" || pathname === "/api/health/ready") {
    const operational = state.ready && state.cycleHealthy !== false;
    return {
      statusCode: operational ? 200 : 503,
      body: {
        service: "pods-worker",
        status: operational ? "ready" : "not_ready",
        cycle:
          state.cycleHealthy === null
            ? "starting"
            : state.cycleHealthy
              ? "healthy"
              : "failed",
        lastSuccessfulCycleAt: state.lastSuccessfulCycleAt
      }
    } as const;
  }

  return { statusCode: 404, body: { error: "Not found" } } as const;
}

export async function startWorkerHealthServer(input: {
  port: number;
  getState: () => WorkerHealthState;
}) {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://worker.local").pathname;
    const result = workerHealthResponse(pathname, input.getState());
    response.writeHead(result.statusCode, {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify(result.body));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(input.port, "0.0.0.0", () => {
      server.off("error", reject);
      resolve();
    });
  });

  return {
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}
