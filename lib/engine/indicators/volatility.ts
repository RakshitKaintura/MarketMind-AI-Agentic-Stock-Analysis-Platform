// ═══════════════════════════════════════════════════════════
// VOLATILITY INDICATORS — How much is the price swinging?
// ═══════════════════════════════════════════════════════════

import { ema } from "./trend";

/** ATR — Average True Range */
export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number | null {
  if (highs.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    trs.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
  }
  let atrVal = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atrVal = (atrVal * (period - 1) + trs[i]) / period;
  }
  return atrVal;
}

/** Bollinger Bands */
export function bollingerBands(closes: number[], period = 20, multiplier = 2) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(
    slice.reduce((sum, v) => sum + (v - middle) ** 2, 0) / period
  );
  const upper = middle + multiplier * stdDev;
  const lower = middle - multiplier * stdDev;
  const current = closes[closes.length - 1];
  return {
    upper,
    middle,
    lower,
    percentB: stdDev === 0 ? 50 : ((current - lower) / (upper - lower)) * 100,
  };
}

/** Keltner Channel — ATR-based bands (less noisy than Bollinger) */
export function keltnerChannel(
  highs: number[],
  lows: number[],
  closes: number[],
  emaPeriod = 20,
  atrPeriod = 14,
  multiplier = 1.5
) {
  const middle = ema(closes, emaPeriod);
  const atrVal = atr(highs, lows, closes, atrPeriod);
  if (middle === null || atrVal === null) return null;
  return {
    upper: middle + multiplier * atrVal,
    middle,
    lower: middle - multiplier * atrVal,
  };
}

/** Annualized Volatility */
export function annualizedVolatility(closes: number[]): number | null {
  if (closes.length < 21) return null;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] === 0) continue;
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (returns.length === 0) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}
