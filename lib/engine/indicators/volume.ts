// ═══════════════════════════════════════════════════════════
// VOLUME INDICATORS — Is money flowing in or out?
// ═══════════════════════════════════════════════════════════

/** OBV — On-Balance Volume */
export function obv(closes: number[], volumes: number[]) {
  if (closes.length < 2) return null;
  let obvValue = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obvValue += volumes[i];
    else if (closes[i] < closes[i - 1]) obvValue -= volumes[i];
  }
  let obv10ago = 0;
  const startIdx = Math.max(1, closes.length - 10);
  for (let i = 1; i < startIdx; i++) {
    if (closes[i] > closes[i - 1]) obv10ago += volumes[i];
    else if (closes[i] < closes[i - 1]) obv10ago -= volumes[i];
  }
  return {
    current: obvValue,
    trend: obvValue > obv10ago ? "ACCUMULATION" : "DISTRIBUTION",
  };
}

/** VWAP — Volume Weighted Average Price */
export function vwap(
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[]
): number | null {
  if (closes.length < 2) return null;
  let cumTPV = 0;
  let cumVol = 0;
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    cumTPV += tp * volumes[i];
    cumVol += volumes[i];
  }
  return cumVol > 0 ? cumTPV / cumVol : null;
}

/** MFI — Money Flow Index (volume-weighted RSI) */
export function mfi(
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[],
  period = 14
): number | null {
  if (closes.length < period + 1) return null;

  let posFlow = 0;
  let negFlow = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    const prevTp = (highs[i - 1] + lows[i - 1] + closes[i - 1]) / 3;
    const rawFlow = tp * volumes[i];
    if (tp > prevTp) posFlow += rawFlow;
    else negFlow += rawFlow;
  }

  if (negFlow === 0) return 100;
  return 100 - 100 / (1 + posFlow / negFlow);
}

/** Volume Trend — 10-day vs prior 10-day */
export function volumeTrend(volumes: number[]) {
  if (volumes.length < 20) return null;
  const recent10 = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const previous10 = volumes.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
  if (previous10 === 0) return null;
  return {
    trend: recent10 > previous10 ? "INCREASING" : "DECREASING",
    changePercent: ((recent10 - previous10) / previous10) * 100,
  };
}
