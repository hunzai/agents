import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { JUPITER_PERPETUALS_PROGRAM, USDC_DECIMALS, BPS_POWER, RATE_POWER } from "../constants.js";
import { BNToUSDRepresentation } from "../utils.js";

const divCeil = (a: BN, b: BN) => {
  const dm = a.divmod(b);
  if (dm.mod.isZero()) return dm.div;
  return dm.div.ltn(0) ? dm.div.isubn(1) : dm.div.iaddn(1);
};

export async function getPositionPnl(positionPubkey: string, currentPrice: number) {
  try {
    const position = await JUPITER_PERPETUALS_PROGRAM.account.position.fetch(new PublicKey(positionPubkey));
    const collateralCustody = await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(position.collateralCustody);
    const custody = await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(position.custody);

    const tokenPrice = new BN(Math.floor(currentPrice * 1_000_000));
    const hasProfit = position.side.long ? tokenPrice.gt(position.price) : position.price.gt(tokenPrice);
    const tokenPriceDelta = tokenPrice.sub(position.price).abs();
    const pnl = position.sizeUsd.mul(tokenPriceDelta).div(position.price);

    const priceImpactFeeBps = divCeil(position.sizeUsd.mul(BPS_POWER), custody.pricing.tradeImpactFeeScalar);
    const closeFeeUsd = position.sizeUsd.mul(custody.decreasePositionBps.add(priceImpactFeeBps)).div(BPS_POWER);
    const borrowFeeUsd = collateralCustody.fundingRateState.cumulativeInterestRate
      .sub(position.cumulativeInterestSnapshot)
      .mul(position.sizeUsd)
      .div(RATE_POWER);
    const totalFeeUsd = closeFeeUsd.add(borrowFeeUsd);

    const maxLossUsd = position.sizeUsd.mul(BPS_POWER).div(custody.pricing.maxLeverage).add(totalFeeUsd);
    const marginUsd = position.collateralUsd;
    let maxPriceDiff = maxLossUsd.sub(marginUsd).abs().mul(position.price).div(position.sizeUsd);

    const liquidationPrice = position.side.long
      ? (maxLossUsd.gt(marginUsd) ? position.price.add(maxPriceDiff) : position.price.sub(maxPriceDiff))
      : (maxLossUsd.gt(marginUsd) ? position.price.sub(maxPriceDiff) : position.price.add(maxPriceDiff));

    const netPnl = hasProfit ? pnl.sub(totalFeeUsd) : pnl.add(totalFeeUsd).neg();
    const pnlPercent = netPnl.mul(new BN(10000)).div(position.collateralUsd).toNumber() / 100;

    return {
      success: true,
      pnl: BNToUSDRepresentation(netPnl, USDC_DECIMALS),
      pnlPercent,
      liquidationPrice: BNToUSDRepresentation(liquidationPrice, USDC_DECIMALS),
      entryPrice: BNToUSDRepresentation(position.price, USDC_DECIMALS),
      currentPrice,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
