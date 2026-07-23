import { FileTransferRepository } from "./file-transfer-repository.js";
import { NimiqRpcClient } from "./nimiq-rpc.js";
import { NimiqTransferSigner } from "./nimiq-signer.js";
import {
  transferLedgerDirectory,
  treasuryConfigurationPath
} from "./paths.js";
import { readTreasuryConfiguration } from "./treasury-config.js";
import {
  broadcastPersistedTransfer,
  prepareTransfer,
  type TransferRpc
} from "./transfer-service.js";

class SimulatedUnknownBroadcastError extends Error {
  constructor(readonly acceptedHash: string) {
    super(`Simulated response loss after RPC accepted ${acceptedHash}`);
    this.name = "SimulatedUnknownBroadcastError";
  }
}

const argumentsWithoutFlags = process.argv.slice(2).filter((value) => !value.startsWith("--"));
const recipient = argumentsWithoutFlags[0] ?? process.env.PODS_PREFLIGHT_RECIPIENT;
if (!recipient) {
  throw new Error(
    "Recipient required: pnpm --filter @pods/worker preflight:send -- <NQ address> [valueLuna]"
  );
}

const valueLuna = parsePositiveLuna(
  argumentsWithoutFlags[1] ?? process.env.PODS_PREFLIGHT_VALUE_LUNA ?? "1000"
);
const simulateUnknown = process.argv.includes("--simulate-unknown");
const configuration = await readTreasuryConfiguration(treasuryConfigurationPath);
const rpc = new NimiqRpcClient(configuration.rpcUrl);
const networkName = await rpc.getNetworkName();
if (networkName !== "TestAlbatross") {
  throw new Error(`Testnet only: RPC returned network ${networkName}`);
}

const repository = new FileTransferRepository(transferLedgerDirectory);
const signer = new NimiqTransferSigner({
  privateKeyHex: configuration.privateKeyHex,
  getBlockNumber: () => rpc.getBlockNumber()
});
const prepared = await prepareTransfer(
  { recipient, valueLuna, network: "testnet" },
  signer,
  repository
);

const broadcastRpc: TransferRpc = simulateUnknown
  ? {
      async sendRawTransaction(rawTransactionHex) {
        const acceptedHash = await rpc.sendRawTransaction(rawTransactionHex);
        throw new SimulatedUnknownBroadcastError(acceptedHash);
      },
      getTransactionByHash: (hash) => rpc.getTransactionByHash(hash)
    }
  : rpc;

try {
  await broadcastPersistedTransfer(prepared.hash, repository, broadcastRpc);
  printResult("broadcast", prepared);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await repository.markUnknown(prepared.hash, message);
  printResult("unknown", prepared);
  if (!(error instanceof SimulatedUnknownBroadcastError)) {
    throw new Error(
      `Broadcast outcome unknown for ${prepared.hash}. Reconcile by hash before any retry.`,
      { cause: error }
    );
  }
}

function parsePositiveLuna(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new Error("valueLuna must be a positive integer");
  }
  const parsed = BigInt(value);
  if (parsed <= 0n) {
    throw new Error("valueLuna must be greater than zero");
  }
  return parsed;
}

function printResult(
  state: "broadcast" | "unknown",
  transfer: {
    hash: string;
    recipient: string;
    valueLuna: bigint;
    validityStartHeight: number;
  }
) {
  console.log(
    JSON.stringify(
      {
        state,
        hash: transfer.hash,
        sender: signer.address,
        recipient: transfer.recipient,
        valueLuna: transfer.valueLuna.toString(),
        validityStartHeight: transfer.validityStartHeight,
        persistedBeforeBroadcast: true,
        next: `Run preflight:reconcile with hash ${transfer.hash}. Do not broadcast again.`
      },
      null,
      2
    )
  );
}
