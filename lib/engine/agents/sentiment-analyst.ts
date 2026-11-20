import { SentimentReportSchema, validateAgentOutput } from "../schemas";
import type { SentimentReport, MarketData, TechnicalIndicators, BaseLLM } from "../types";

export async function analyzeSentiment(
  llm: BaseLLM | null,
  market: MarketData,
  indicators?: TechnicalIndicators
): Promise<SentimentReport> {
  const mfi = indicators?.mfi ?? 50;
  const obvTrend = indicators?.obv?.trend ?? "NEUTRAL";
  const volTrend = indicators?.volumeTrend?.trend ?? "FLAT";
  const volChange = indicators?.volumeTrend?.changePercent ?? 0;

  const rangeSpan = market.fiftyTwoWeekHigh - market.fiftyTwoWeekLow;
  const range52Pct =
    rangeSpan > 0
      ? ((market.currentPrice - market.fiftyTwoWeekLow) / rangeSpan) * 100
      : 50;

  if (!llm) {
    return buildFallbackFlowSentiment(market, indicators);
  }

  const prompt = `You are an Institutional Market Flow & Sentiment Analyst for the Indian Stock Market.
Analyze market positioning, volume accumulation, and participant sentiment for ${market.symbol} (${market.company}).
Do NOT use news or media speculation; evaluate purely from mathematical flow, volume behavior, and positioning metrics.

MARKET FLOW DATA:
- Current Price: ₹${market.currentPrice} (${market.changePercent > 0 ? "+" : ""}${market.changePercent.toFixed(2)}% today)
- 52-Week Range: ₹${market.fiftyTwoWeekLow} - ₹${market.fiftyTwoWeekHigh} (Current Position: ${range52Pct.toFixed(1)}% of range)
- Money Flow Index (MFI): ${mfi.toFixed(1)} (Above 50 = institutional accumulation, below 50 = distribution)
- On-Balance Volume (OBV): ${obvTrend}
- Volume Trend: ${volTrend} (${volChange > 0 ? "+" : ""}${volChange.toFixed(1)}% volume shift)
- 50-Day Moving Average: ₹${market.fiftyDayAvg}
- 200-Day Moving Average: ₹${market.twoHundredDayAvg}

TASK:
1. Determine overall market participant sentiment: "BULLISH", "BEARISH", or "NEUTRAL".
2. Synthesize 2-3 key quantitative flow drivers (e.g. institutional accumulation via MFI, high relative volume, secular range positioning).
3. Compute an overall flow sentiment score (0-100, 50 = neutral baseline).

REQUIRED OUTPUT:
Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "score": <0-100 flow score>,
  "overallMood": "BULLISH" | "BEARISH" | "NEUTRAL",
  "headlines": [],
  "keyDrivers": ["flow driver 1", "flow driver 2"],
  "keyObservation": "<2-3 sentence market flow synthesis>"
}`;

  try {
    const response = await llm.invoke(prompt);
    const text = typeof response.content === "string" ? response.content : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validation = validateAgentOutput(SentimentReportSchema, parsed, "SentimentAnalyst");
    if (validation.ok) return validation.data;
    return buildFallbackFlowSentiment(market, indicators);
  } catch (error) {
    console.error("[SentimentAnalyst] Error:", error);
    return buildFallbackFlowSentiment(market, indicators);
  }
}

function buildFallbackFlowSentiment(
  market: MarketData,
  indicators?: TechnicalIndicators
): SentimentReport {
  const mfi = indicators?.mfi ?? 50;
  const obvTrend = indicators?.obv?.trend ?? "NEUTRAL";
  const volChange = indicators?.volumeTrend?.changePercent ?? 0;

  let score = 50;
  if (mfi > 60) score += 12;
  else if (mfi < 40) score -= 12;

  if (obvTrend === "BULLISH") score += 10;
  else if (obvTrend === "BEARISH") score -= 10;

  if (market.changePercent > 1) score += 8;
  else if (market.changePercent < -1) score -= 8;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const mood = score >= 60 ? "BULLISH" : score <= 40 ? "BEARISH" : "NEUTRAL";

  return {
    score,
    overallMood: mood,
    headlines: [],
    keyDrivers: [
      `Money Flow Index at ${mfi.toFixed(1)} indicates ${mfi >= 50 ? "net institutional accumulation" : "controlled distribution"}.`,
      `On-Balance Volume structure remains ${obvTrend.toLowerCase()} with volume variation of ${volChange > 0 ? "+" : ""}${volChange.toFixed(1)}%.`,
    ],
    keyObservation: `Participant flow and volume distribution indicate a ${mood.toLowerCase()} posture for ${market.symbol}, with price trading at ₹${market.currentPrice}.`,
  };
}
