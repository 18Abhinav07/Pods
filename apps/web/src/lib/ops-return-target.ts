const operationsPaths = new Set([
  "/ops/public-safety",
  "/ops/transfers"
]);

export function safeOpsReturnTarget(value: unknown) {
  return typeof value === "string" && operationsPaths.has(value)
    ? value
    : "/ops/public-safety";
}
