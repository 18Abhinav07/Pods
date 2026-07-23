import { pathToFileURL } from "node:url";

import { createPodsRepository } from "@pods/db";
import { parseAlphaCapabilities } from "@pods/domain";

import { NimiqDepositRpc } from "./funding/nimiq-deposit-rpc.js";
import { runDepositCycle } from "./funding/run-deposit-cycle.js";
import { runCutoffCycle } from "./funding/run-cutoff-cycle.js";
import { runRefundCycle } from "./funding/refund-service.js";
import { NimiqRpcClient } from "./preflight/nimiq-rpc.js";
import { NimiqTransferSigner } from "./preflight/nimiq-signer.js";
import { treasuryConfigurationPath } from "./preflight/paths.js";
import { readTreasuryConfiguration } from "./preflight/treasury-config.js";
import { runOccurrenceCycle } from "./activity/run-occurrence-cycle.js";
import {
  startWorkerHealthServer,
  type WorkerHealthState
} from "./health/server.js";

export const workerName = "pods-worker";

const localDatabaseUrl = "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";

export async function readDepositWorkerConfiguration(
  environment: Record<string, string | undefined> = process.env
) {
  let localTreasury: Awaited<ReturnType<typeof readTreasuryConfiguration>> | undefined;
  if (
    !environment.PODS_TREASURY_ADDRESS ||
    !environment.PODS_TREASURY_PRIVATE_KEY_HEX ||
    !environment.NIMIQ_RPC_URL ||
    !environment.NIMIQ_NETWORK
  ) {
    try {
      localTreasury = await readTreasuryConfiguration(treasuryConfigurationPath);
    } catch {
      localTreasury = undefined;
    }
  }

  const network = environment.NIMIQ_NETWORK ?? localTreasury?.network;
  const treasuryAddress = environment.PODS_TREASURY_ADDRESS ?? localTreasury?.address;
  const privateKeyHex =
    environment.PODS_TREASURY_PRIVATE_KEY_HEX ?? localTreasury?.privateKeyHex;
  const rpcUrl = environment.NIMIQ_RPC_URL ?? localTreasury?.rpcUrl;
  const databaseUrl =
    environment.DATABASE_URL ??
    (environment.NODE_ENV === "production" ? undefined : localDatabaseUrl);
  const pollIntervalMs = Number(environment.PODS_DEPOSIT_POLL_INTERVAL_MS ?? "5000");
  const healthPort = Number(environment.PORT ?? "3412");

  if (network !== "testnet") throw new Error("Deposit worker requires NIMIQ_NETWORK=testnet");
  if (!treasuryAddress) throw new Error("Deposit worker requires PODS_TREASURY_ADDRESS");
  if (!privateKeyHex) {
    throw new Error("Funding worker requires PODS_TREASURY_PRIVATE_KEY_HEX");
  }
  if (!rpcUrl) throw new Error("Deposit worker requires NIMIQ_RPC_URL");
  if (!databaseUrl) throw new Error("Deposit worker requires DATABASE_URL");
  if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < 1_000) {
    throw new Error("PODS_DEPOSIT_POLL_INTERVAL_MS must be an integer of at least 1000");
  }
  if (!Number.isInteger(healthPort) || healthPort < 1 || healthPort > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  const capabilities = parseAlphaCapabilities({
    ...environment,
    NIMIQ_NETWORK: network
  });
  return {
    network,
    treasuryAddress,
    privateKeyHex,
    rpcUrl,
    databaseUrl,
    pollIntervalMs,
    healthPort,
    alphaMode: environment.APP_ENV === "alpha",
    capabilities
  } as const;
}

export async function startFundingWorker() {
  const configuration = await readDepositWorkerConfiguration();
  const repository = createPodsRepository(configuration.databaseUrl);
  const depositRpc = new NimiqDepositRpc(configuration.rpcUrl);
  const transferRpc = new NimiqRpcClient(configuration.rpcUrl);
  const signer = new NimiqTransferSigner({
    privateKeyHex: configuration.privateKeyHex,
    getBlockNumber: () => transferRpc.getBlockNumber()
  });
  if (signer.address !== configuration.treasuryAddress) {
    await repository.close();
    throw new Error("Treasury address does not match the configured private key");
  }
  await repository.checkHealth();

  const healthState: WorkerHealthState = {
    ready: true,
    cycleHealthy: null,
    lastSuccessfulCycleAt: null
  };
  const healthServer = await startWorkerHealthServer({
    port: configuration.healthPort,
    getState: () => healthState
  });
  let stopping = false;
  let timer: NodeJS.Timeout | undefined;

  const run = async () => {
    if (stopping) return;
    let cycleFailed = false;
    const fundingEnabled =
      !configuration.alphaMode || configuration.capabilities.depositMode !== "off";
    if (fundingEnabled) {
      try {
        await runDepositCycle({
          repository,
          rpc: depositRpc,
          onError(error) {
            cycleFailed = true;
            console.error(`[deposit-cycle] ${error.message}`);
          }
        });
      } catch (error) {
        cycleFailed = true;
        console.error(
          `[deposit-cycle] ${error instanceof Error ? error.message : "Cycle failed"}`
        );
      }
      try {
        await runCutoffCycle({
          repository,
          onError(podId, error) {
            cycleFailed = true;
            console.error(`[cutoff-cycle:${podId}] ${error.message}`);
          }
        });
      } catch (error) {
        cycleFailed = true;
        console.error(
          `[cutoff-cycle] ${error instanceof Error ? error.message : "Cycle failed"}`
        );
      }
    }
    try {
      await runOccurrenceCycle({ repository });
    } catch (error) {
      cycleFailed = true;
      console.error(
        `[occurrence-cycle] ${error instanceof Error ? error.message : "Cycle failed"}`
      );
    }
    const refundsEnabled =
      !configuration.alphaMode || configuration.capabilities.alphaRefund;
    if (refundsEnabled) {
      try {
        await runRefundCycle({
          repository,
          signer,
          rpc: transferRpc,
          onError(error, leg) {
            cycleFailed = true;
            console.error(`[refund-cycle:${leg.id}] ${error.message}`);
          }
        });
      } catch (error) {
        cycleFailed = true;
        console.error(
          `[refund-cycle] ${error instanceof Error ? error.message : "Cycle failed"}`
        );
      }
    }
    healthState.cycleHealthy = !cycleFailed;
    if (!cycleFailed) healthState.lastSuccessfulCycleAt = new Date().toISOString();
    if (!stopping) timer = setTimeout(run, configuration.pollIntervalMs);
  };

  const stop = async () => {
    if (stopping) return;
    stopping = true;
    healthState.ready = false;
    if (timer) clearTimeout(timer);
    await healthServer.close();
    await repository.close();
  };
  process.once("SIGINT", () => void stop());
  process.once("SIGTERM", () => void stop());
  await run();
  return { stop };
}

export const startDepositWorker = startFundingWorker;

const entryPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryPath) {
  startFundingWorker().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Funding worker failed to start");
    process.exitCode = 1;
  });
}
