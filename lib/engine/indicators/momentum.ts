// ═══════════════════════════════════════════════════════════
// MOMENTUM INDICATORS — How fast and strong is the price move?
// ═══════════════════════════════════════════════════════════

import { emaSeries } from "./trend";

/** RSI with proper Wilder smoothing */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss =
      (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

/** MACD with proper signal line and histogram */
export function macd(closes: number[]): {
  line: number;
  signal: number;
  histogram: number;
} | null {
  const ema12Series = emaSeries(closes, 12);
  const ema26Series = emaSeries(closes, 26);
  if (ema12Series.length === 0 || ema26Series.length === 0) return null;
  const offset = ema12Series.length - ema26Series.length;
  const macdLine: number[] = [];
  for (let i = 0; i < ema26Series.length; i++) {
    macdLine.push(ema12Series[i + offset] - ema26Series[i]);
  }
  if (macdLine.length < 9) return null;
  const signalSeries = emaSeries(macdLine, 9);
  if (signalSeries.length === 0) return null;
  const latestMACD = macdLine[macdLine.length - 1];
  const latestSignal = signalSeries[signalSeries.length - 1];
  return {
    line: latestMACD,
    signal: latestSignal,
    histogram: latestMACD - latestSignal,
  };
}

/** Stochastic Oscillator (%K and %D) */
export function stochastic(
  closes: number[],
  highs: number[],
  lows: number[],
  kPeriod = 14,
  dPeriod = 3
): { k: number; d: number; signal: string } | null {
  if (closes.length < kPeriod + dPeriod) return null;
  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const windowHighs = highs.slice(i - kPeriod + 1, i + 1);
    const windowLows = lows.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...windowHighs);
    const ll = Math.min(...windowLows);
    kValues.push(hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100);
  }
  const dSlice = kValues.slice(-dPeriod);
  const d = dSlice.reduce((a, b) => a + b, 0) / dPeriod;
  const k = kValues[kValues.length - 1];
  return {
    k: Number(k.toFixed(2)),
    d: Number(d.toFixed(2)),
    signal:
      k > 80
        ? "OVERBOUGHT"
        : k < 20
        ? "OVERSOLD"
        : k > d
        ? "BULLISH_CROSSOVER"
        : "BEARISH_CROSSOVER",
  };
}

/** Williams %R */
export function williamsR(
  closes: number[],
  highs: number[],
  lows: number[],
  period = 14
): number | null {
  if (closes.length < period) return null;
  const h = Math.max(...highs.slice(-period));
  const l = Math.min(...lows.slice(-period));
  if (h === l) return -50;
  return ((h - closes[closes.length - 1]) / (h - l)) * -100;
}
