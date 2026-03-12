import { BN } from "@coral-xyz/anchor";

export function BNToUSDRepresentation(
  value: BN,
  exponent: number = 8,
  displayDecimals: number = 2,
): string {
  const quotient = value.divn(Math.pow(10, exponent - displayDecimals));
  const usd = Number(quotient) / Math.pow(10, displayDecimals);

  return usd.toLocaleString("en-US", {
    maximumFractionDigits: displayDecimals,
    minimumFractionDigits: displayDecimals,
    useGrouping: false,
  });
}

export const divCeil = (a: BN, b: BN) => {
  var dm = a.divmod(b);
  if (dm.mod.isZero()) return dm.div;
  return dm.div.ltn(0) ? dm.div.isubn(1) : dm.div.iaddn(1);
};
