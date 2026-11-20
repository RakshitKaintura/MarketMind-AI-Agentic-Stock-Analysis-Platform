import { TechnicalReportSchema, validateAgentOutput } from "../schemas";
import type { TechnicalIndicators, TechnicalReport, MarketData, BaseLLM } from "../types";

function fmt(n: number | null | undefined, decimals = 2): string {
  return n != null ? n.toFixed(decimals) : "N/A";
}

export async function analyzeTechnicals(
  llm: BaseLLM | null,
  market: MarketData,
  indicators: TechnicalIndicators,
  indicatorList: string[]
): Promise<TechnicalReport> {
  if (!llm) {
    return buildFallbackTechnical(market, indicators);
  }

  const prompt = `You are a Senior Technical Analysis Specialist for Indian Equities (NSE/BSE).
Focus purely on price action, momentum, trend, volatility, and volume signals. Never invent numbers.

STOCK: ${market.symbol} | Current Price: ₹${market.currentPrice} | Change: ${market.changePercent > 0 ? "+" : ""}${market.changePercent.toFixed(2)}%
52W Range: ₹${market.fiftyTwoWeekLow} – ₹${market.fiftyTwoWeekHigh}
50D Moving Avg: ₹${market.fiftyDayAvg} | 200D Moving Avg: ₹${market.twoHundredDayAvg}

INDICATORS (${indicatorList.length} computed):
- Trend: SMA20=${fmt(indicators.sma20)}, SMA50=${fmt(indicators.sma50)}, SMA200=${fmt(indicators.sma200)}
- EMA: EMA12=${fmt(indicators.ema12)}, EMA26=${fmt(indicators.ema26)}
- ADX: ${fmt(indicators.adx)} (>25 = strong trend)
- Supertrend: ${indicators.supertrend ? `${fmt(indicators.supertrend.value)} (${indicators.supertrend.signal})` : "N/A"}
- Momentum: RSI(14)=${fmt(indicators.rsi14)}, MACD Line=${fmt(indicators.macd?.line)}, Signal=${fmt(indicators.macd?.signal)}, Hist=${fmt(indicators.macd?.histogram)}
- Stochastic: %K=${fmt(indicators.stochastic?.k)}, %D=${fmt(indicators.stochastic?.d)} (${indicators.stochastic?.signal ?? "N/A"})
- Williams %R: ${fmt(indicators.williamsR)}
- Volatility: ATR(14)=${fmt(indicators.atr14)} | Bollinger Upper=${fmt(indicators.bollingerBands?.upper)}, Lower=${fmt(indicators.bollingerBands?.lower)}, %B=${fmt(indicators.bollingerBands?.percentB)}
- Keltner Channel: Upper=${fmt(indicators.keltnerChannel?.upper)}, Lower=${fmt(indicators.keltnerChannel?.lower)}
- Annualized Volatility: ${fmt(indicators.annualizedVolatility)}%
- Volume: OBV Trend=${indicators.obv?.trend ?? "N/A"}, VWAP=${fmt(indicators.vwap)}, MFI=${fmt(indicators.mfi)}
- Volume Trend: ${indicators.volumeTrend ? `${indicators.volumeTrend.trend} (${indicators.volumeTrend.changePercent > 0 ? "+" : ""}${fmt(indicators.volumeTrend.changePercent)}%)` : "N/A"}

REQUIRED OUTPUT:
Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "regime": "TRENDING_UP" | "TRENDING_DOWN" | "RANGING" | "VOLATILE",
  "score": <0-100 technical conviction score>,
  "signals": ["signal 1", "signal 2", "signal 3"],
  "supportLevel": <numeric support level>,
  "resistanceLevel": <numeric resistance level>,
  "trendStrength": "STRONG" | "MODERATE" | "WEAK",
  "keyObservation": "<2-3 concise analytical sentences on technical setup>"
}`;

  try {
    const response = await llm.invoke(prompt);
    const text = typeof response.content === "string" ? response.content : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validation = validateAgentOutput(TechnicalReportSchema, parsed, "TechnicalAnalyst");
    if (validation.ok) return validation.data;
    return buildFallbackTechnical(market, indicators);
  } catch (error) {
    console.error("[TechnicalAnalyst] Error:", error);
    return buildFallbackTechnical(market, indicators);
  }
}

function buildFallbackTechnical(market: MarketData, indicators: TechnicalIndicators): TechnicalReport {
  const rsiVal = indicators.rsi14 ?? 50;
  const price = market.currentPrice;
  const regime =
    rsiVal > 65
      ? "TRENDING_UP"
      : rsiVal < 35
      ? "TRENDING_DOWN"
      : indicators.annualizedVolatility && indicators.annualizedVolatility > 35
      ? "VOLATILE"
      : "RANGING";

  let score = 50;
  if (indicators.sma50 && price >= indicators.sma50) score += 10;
  if (indicators.sma200 && price >= indicators.sma200) score += 10;
  if (rsiVal >= 40 && rsiVal <= 60) score += 10;
  else if (rsiVal > 70) score -= 15;
  else if (rsiVal < 30) score += 15;

  return {
    regime,
    score: Math.max(0, Math.min(100, Math.round(score))),
    signals: [
      `RSI(14) at ${rsiVal.toFixed(1)} indicates ${rsiVal > 70 ? "overbought" : rsiVal < 30 ? "oversold" : "balanced"} momentum`,
      `Price ₹${price.toFixed(2)} relative to 50D average (₹${market.fiftyDayAvg})`,
      `52-week price range: ₹${market.fiftyTwoWeekLow} - ₹${market.fiftyTwoWeekHigh}`,
    ],
    supportLevel: market.fiftyTwoWeekLow || price * 0.92,
    resistanceLevel: market.fiftyTwoWeekHigh || price * 1.08,
    trendStrength: Math.abs(market.changePercent) > 2 ? "STRONG" : "MODERATE",
    keyObservation: `Technical setup reflects a ${regime.toLowerCase().replace("_", " ")} regime. Momentum sits at RSI ${rsiVal.toFixed(1)} with key support around ₹${(market.fiftyTwoWeekLow || price * 0.92).toFixed(2)}.`,
  };
}
