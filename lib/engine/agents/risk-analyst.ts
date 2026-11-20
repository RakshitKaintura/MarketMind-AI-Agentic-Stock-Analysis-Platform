import { RiskReportSchema, validateAgentOutput } from "../schemas";
import type { RiskReport, RiskLevel, MarketData, TechnicalIndicators, BaseLLM } from "../types";

function fmt(n: number | null | undefined, pct = false): string {
  if (n === null || n === undefined) return "N/A";
  return pct ? `${(n * 100).toFixed(2)}%` : n.toFixed(2);
}

export async function assessRisk(
  llm: BaseLLM | null,
  market: MarketData,
  indicators: TechnicalIndicators
): Promise<RiskReport> {
  if (!llm) {
    return buildFallbackRisk(market, indicators);
  }

  const prompt = `You are a Senior Risk Officer assessing equity investment exposure in Indian equities.
Evaluate 4 key risk dimensions: Business Risk, Valuation Risk, Macro Risk, and Liquidity Risk.

STOCK METRICS:
- Symbol: ${market.symbol} (${market.company}) | Sector: ${market.sector}
- Price: ₹${market.currentPrice} | Beta: ${fmt(market.beta)} (>1.3 indicates elevated systemic sensitivity)
- Volatility: Annualized ${fmt(indicators.annualizedVolatility)}% (Indian benchmark avg is 20-25%)
- Growth: Revenue ${fmt(market.revenueGrowth, true)}, Earnings ${fmt(market.earningsGrowth, true)}
- Leverage: Debt-to-Equity ${fmt(market.debtToEquity)} (>2.0 warrants caution)
- Valuation: P/E ${fmt(market.peRatio)}, P/B ${fmt(market.pbRatio)}
- Technical Overextension: RSI ${fmt(indicators.rsi14)}, Bollinger %B ${fmt(indicators.bollingerBands?.percentB)}%
- Volume Flow: ${indicators.volumeTrend ? `${indicators.volumeTrend.trend} (${indicators.volumeTrend.changePercent.toFixed(1)}%)` : "Steady"}

REQUIRED OUTPUT:
Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "overallRisk": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
  "score": <0-100 where 100 means lowest risk/highest safety>,
  "businessRisk": {
    "level": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
    "detail": "<concise risk assessment of business model & competition>"
  },
  "valuationRisk": {
    "level": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
    "detail": "<concise risk assessment of price-to-earnings or asset multiple>"
  },
  "macroRisk": {
    "level": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
    "detail": "<concise risk assessment of interest rates, inflation, beta>"
  },
  "liquidityRisk": {
    "level": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
    "detail": "<concise risk assessment of market depth & volatility>"
  },
  "keyObservation": "<2-3 sentence summary of primary downside vulnerabilities>"
}`;

  try {
    const response = await llm.invoke(prompt);
    const text = typeof response.content === "string" ? response.content : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validation = validateAgentOutput(RiskReportSchema, parsed, "RiskAnalyst");
    if (validation.ok) return validation.data;
    return buildFallbackRisk(market, indicators);
  } catch (error) {
    console.error("[RiskAnalyst] Error:", error);
    return buildFallbackRisk(market, indicators);
  }
}

function buildFallbackRisk(market: MarketData, indicators: TechnicalIndicators): RiskReport {
  const beta = market.beta ?? 1.0;
  const vol = indicators.annualizedVolatility ?? 25;
  const de = market.debtToEquity ?? 1.0;

  const overall: RiskLevel =
    beta > 1.4 || vol > 40 || de > 2.5
      ? "HIGH"
      : beta > 1.1 || vol > 28 || de > 1.5
      ? "MEDIUM"
      : "LOW";

  const score = overall === "LOW" ? 75 : overall === "MEDIUM" ? 55 : 35;

  return {
    overallRisk: overall,
    score,
    businessRisk: {
      level: market.earningsGrowth !== null && market.earningsGrowth < 0 ? "HIGH" : "MEDIUM",
      detail: `Operating leverage and earnings growth rate at ${market.earningsGrowth !== null ? (market.earningsGrowth * 100).toFixed(1) + "%" : "historical norms"}.`,
    },
    valuationRisk: {
      level: market.peRatio !== null && market.peRatio > 45 ? "HIGH" : "MEDIUM",
      detail: `P/E multiple is ${market.peRatio !== null ? market.peRatio.toFixed(1) : "—"} requiring continued earnings execution to justify multiples.`,
    },
    macroRisk: {
      level: beta > 1.2 ? "HIGH" : "MEDIUM",
      detail: `Beta of ${beta.toFixed(2)} with annual price volatility of ${vol.toFixed(1)}%.`,
    },
    liquidityRisk: {
      level: "LOW",
      detail: "NSE/BSE exchange depth provides healthy trading liquidity for retail allocation.",
    },
    keyObservation: `Overall risk is assessed at ${overall} risk. Primary sensitivities include a market beta of ${beta.toFixed(2)} and debt-to-equity of ${de.toFixed(2)}.`,
  };
}
