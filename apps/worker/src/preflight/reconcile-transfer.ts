import { FileTransferRepository } from "./file-transfer-repository.js";
import { NimiqRpcClient } from "./nimiq-rpc.js";
import {
  transferLedgerDirectory,
  treasuryConfigurationPath
} from "./paths.js";
import { readTreasuryConfiguration } from "./treasury-config.js";
import { reconcileUnknownTransfer } from "./transfer-service.js";

const hash = process.argv[2];
if (!hash) {
  throw new Error(
    "Transaction hash required: pnpm --filter @pods/worker preflight:reconcile -- <hash>"
  );
}

const configuration = await readTreasuryConfiguration(treasuryConfigurationPath);
const rpc = new NimiqRpcClient(configuration.rpcUrl);
const networkName = await rpc.getNetworkName();
if (networkName !== "TestAlbatross") {
  throw new Error(`Testnet only: RPC returned network ${networkName}`);
}

const repository = new FileTransferRepository(transferLedgerDirectory);
const result = await reconcileUnknownTransfer(hash, repository, rpc);
console.log(
  JSON.stringify(
    {
      hash,
      result,
      rebroadcast: false,
      final: result === "confirmed" || result === "failed"
    },
    null,
    2
  )
);
