import { pathToFileURL } from "node:url";

import { createPodsRepository } from "@pods/db";

import { NimiqDepositRpc } from "./funding/nimiq-deposit-rpc";
import { runDepositCycle } from "./funding/run-deposit-cycle";
import { runCutoffCycle } from "./funding/run-cutoff-cycle";
import { runRefundCycle } from "./funding/refund-service";
import { NimiqRpcClient } from "./preflight/nimiq-rpc";
import { NimiqTransferSigner } from "./preflight/nimiq-signer";
import { treasuryConfigurationPath } from "./preflight/paths";
import { readTreasuryConfiguration } from "./preflight/treasury-config";

export const workerName = "pods-worker";

const localDatabaseUrl = "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";

export async function readDepositWorkerConfiguration(
  environment: NodeJS.ProcessEnv = process.env
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
  return {
    network,
    treasuryAddress,
    privateKeyHex,
    rpcUrl,
    databaseUrl,
    pollIntervalMs
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
  let stopping = false;
  let timer: NodeJS.Timeout | undefined;

  const run = async () => {
    if (stopping) return;
    try {
      await runDepositCycle({
        repository,
        rpc: depositRpc,
        onError(error) {
          console.error(`[deposit-cycle] ${error.message}`);
        }
      });
    } catch (error) {
      console.error(
        `[deposit-cycle] ${error instanceof Error ? error.message : "Cycle failed"}`
      );
    }
    try {
      await runCutoffCycle({
        repository,
        onError(podId, error) {
          console.error(`[cutoff-cycle:${podId}] ${error.message}`);
        }
      });
    } catch (error) {
      console.error(
        `[cutoff-cycle] ${error instanceof Error ? error.message : "Cycle failed"}`
      );
    }
    try {
      await runRefundCycle({
        repository,
        signer,
        rpc: transferRpc,
        onError(error, leg) {
          console.error(`[refund-cycle:${leg.id}] ${error.message}`);
        }
      });
    } catch (error) {
      console.error(
        `[refund-cycle] ${error instanceof Error ? error.message : "Cycle failed"}`
      );
    }
    if (!stopping) timer = setTimeout(run, configuration.pollIntervalMs);
  };

  const stop = async () => {
    if (stopping) return;
    stopping = true;
    if (timer) clearTimeout(timer);
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
