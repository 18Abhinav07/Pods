import { KeyPair, PrivateKey } from "@nimiq/core";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const DEFAULT_TESTNET_RPC_URL = "https://rpc.testnet.nimiqwatch.com";

export interface TreasuryConfiguration {
  address: string;
  privateKeyHex: string;
  network: "testnet";
  rpcUrl: string;
}

export async function createTreasuryConfiguration(
  filePath: string,
  fixedPrivateKeyHex?: string
): Promise<TreasuryConfiguration> {
  const privateKey = fixedPrivateKeyHex
    ? PrivateKey.fromHex(fixedPrivateKeyHex)
    : PrivateKey.generate();
  const keyPair = KeyPair.derive(privateKey);
  const configuration: TreasuryConfiguration = {
    address: keyPair.toAddress().toUserFriendlyAddress(),
    privateKeyHex: privateKey.toHex(),
    network: "testnet",
    rpcUrl: DEFAULT_TESTNET_RPC_URL
  };

  await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
  await chmod(dirname(filePath), 0o700);
  await writeFile(
    filePath,
    [
      `PODS_TREASURY_ADDRESS=${configuration.address}`,
      `PODS_TREASURY_PRIVATE_KEY_HEX=${configuration.privateKeyHex}`,
      "NIMIQ_NETWORK=testnet",
      `NIMIQ_RPC_URL=${configuration.rpcUrl}`,
      ""
    ].join("\n"),
    { mode: 0o600, flag: "wx" }
  );
  await chmod(filePath, 0o600);
  return configuration;
}

export async function readTreasuryConfiguration(
  filePath: string
): Promise<TreasuryConfiguration> {
  const values = parseEnvironmentFile(await readFile(filePath, "utf8"));
  const privateKeyHex = required(values, "PODS_TREASURY_PRIVATE_KEY_HEX");
  const configuredAddress = required(values, "PODS_TREASURY_ADDRESS");
  const network = required(values, "NIMIQ_NETWORK");
  if (network !== "testnet") {
    throw new Error("Testnet only: invalid NIMIQ_NETWORK in treasury configuration");
  }

  const derivedAddress = KeyPair.derive(PrivateKey.fromHex(privateKeyHex))
    .toAddress()
    .toUserFriendlyAddress();
  if (derivedAddress !== configuredAddress) {
    throw new Error("Treasury address does not match the configured private key");
  }

  return {
    address: configuredAddress,
    privateKeyHex,
    network,
    rpcUrl: required(values, "NIMIQ_RPC_URL")
  };
}

function parseEnvironmentFile(source: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      throw new Error("Invalid treasury environment file");
    }
    values.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
  }
  return values;
}

function required(values: Map<string, string>, name: string): string {
  const value = values.get(name);
  if (!value) {
    throw new Error(`Missing ${name} in treasury configuration`);
  }
  return value;
}
