export function TestnetMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`testnet-mark${inverse ? " testnet-mark-inverse" : ""}`}>
      <i aria-hidden="true" />
      Testnet beta
    </span>
  );
}
