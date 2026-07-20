import { pathToFileURL } from "node:url";

import { createPodsRepository } from "@pods/db";

type ClockRepository = Pick<
  ReturnType<typeof createPodsRepository>,
  "getEffectiveTime" | "advanceClock"
>;

type ClockEnvironment = Record<string, string | undefined>;

function readOption(argv: string[], option: string) {
  const index = argv.indexOf(option);
  return index === -1 ? undefined : argv[index + 1];
}

export async function runClockAdvanceCommand(input: {
  argv: string[];
  env: ClockEnvironment;
  repository: ClockRepository;
  actor: string;
  realNow?: () => Date;
}) {
  if (input.env.APP_ENV !== "local" || input.env.NIMIQ_NETWORK !== "testnet") {
    throw new Error("Clock overrides require APP_ENV=local and NIMIQ_NETWORK=testnet");
  }

  const targetText = readOption(input.argv, "--to");
  const target = new Date(targetText ?? "");
  if (!targetText || !Number.isFinite(target.getTime())) {
    throw new Error("Clock advance requires a valid --to timestamp");
  }
  const reason = readOption(input.argv, "--reason")?.trim();
  if (!reason) throw new Error("Clock advance requires a non-empty --reason");

  const realNow = (input.realNow ?? (() => new Date()))();
  const current = await input.repository.getEffectiveTime(realNow);
  if (target.getTime() <= current.getTime()) {
    throw new Error("Clock can only advance beyond the current effective time");
  }

  return input.repository.advanceClock({
    effectiveTime: target,
    reason,
    actor: input.actor,
    realNow
  });
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
  const repository = createPodsRepository(databaseUrl);
  try {
    const event = await runClockAdvanceCommand({
      argv: process.argv.slice(2),
      env: process.env,
      repository,
      actor: process.env.PODS_CLOCK_ACTOR ?? "local:cli"
    });
    process.stdout.write(
      `${JSON.stringify({
        id: event.id,
        previousTime: event.previousTime.toISOString(),
        effectiveTime: event.effectiveTime.toISOString(),
        reason: event.reason,
        actor: event.actor
      })}\n`
    );
  } finally {
    await repository.close();
  }
}

const executedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === executedPath) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Clock command failed";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
