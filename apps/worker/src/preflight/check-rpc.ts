import { NimiqRpcClient } from "./nimiq-rpc";
import { treasuryConfigurationPath } from "./paths";
import { readTreasuryConfiguration } from "./treasury-config";

const configuration = await readTreasuryConfiguration(treasuryConfigurationPath);
const rpc = new NimiqRpcClient(configuration.rpcUrl);
const [networkName, blockNumber] = await Promise.all([
  rpc.getNetworkName(),
  rpc.getBlockNumber()
]);

if (networkName !== "TestAlbatross") {
  throw new Error(`Testnet only: RPC returned network ${networkName}`);
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      rpcUrl: configuration.rpcUrl,
      networkName,
      blockNumber,
      treasuryAddress: configuration.address
    },
    null,
    2
  )
);
