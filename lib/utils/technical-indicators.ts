export const calculateSMA = (values: number[], period: number) => {
  if (values.length < period) return null;
  const window = values.slice(-period);
  const total = window.reduce((sum, value) => sum + value, 0);
  return total / period;
};

export const calculateRSI = (values: number[], period = 14) => {
  if (values.length <= period) return null;

  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const change = curr - prev;

    if (change > 0) gains += change;
    if (change < 0) losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
};

export const calculateVolatility = (values: number[]) => {
  if (values.length < 21) return null;

  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    if (!prev) continue;
    returns.push((values[i] - prev) / prev);
  }

  if (returns.length === 0) return null;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;

  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

export const calculateEMA = (values: number[], period: number) => {
  if (values.length < period) return null;
  const multiplier = 2 / (period + 1);
  
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
  }
  return ema;
};

export const calculateMACD = (values: number[]) => {
  const ema12 = calculateEMA(values, 12);
  const ema26 = calculateEMA(values, 26);
  
  if (ema12 === null || ema26 === null) return null;
  
  const macdLine = ema12 - ema26;
  return {
    macdLine,
    signal: macdLine > 0 ? "Bullish" : "Bearish",
  };
};

export const calculateBollingerBands = (values: number[], period = 20) => {
  if (values.length < period) return null;
  
  const slice = values.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(
    slice.reduce((sum, v) => sum + (v - sma) ** 2, 0) / period
  );
  
  const currentPrice = values[values.length - 1];
  return {
    upper: sma + 2 * stdDev,
    middle: sma,
    lower: sma - 2 * stdDev,
    percentB: ((currentPrice - (sma - 2 * stdDev)) / (4 * stdDev)) * 100,
  };
};

export const calculateVolumeTrend = (volumes: number[]) => {
  if (volumes.length < 20) return null;
  const recent10 = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const previous10 = volumes.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
  return {
    avgVolume10d: recent10,
    volumeChange: ((recent10 - previous10) / previous10) * 100,
    trend: recent10 > previous10 ? "Increasing" : "Decreasing",
  };
};
