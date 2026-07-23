const publicSafetyPath = "/ops/public-safety";

export function safeOpsReturnTarget(value: unknown) {
  return value === publicSafetyPath ? value : publicSafetyPath;
}
