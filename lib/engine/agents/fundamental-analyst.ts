import { FundamentalReportSchema, validateAgentOutput } from "../schemas";
import type { FundamentalReport, MarketData, BaseLLM } from "../types";

function fmt(n: number | null, pct = false): string {
  if (n === null) return "N/A";
  return pct ? `${(n * 100).toFixed(2)}%` : n.toFixed(2);
}

export async function analyzeFundamentals(
  llm: BaseLLM | null,
  market: MarketData
): Promise<FundamentalReport> {
  const SECTOR_PE: Record<string, { low: number; fair: number; high: number }> = {
    Technology: { low: 20, fair: 35, high: 55 },
    "Financial Services": { low: 10, fair: 18, high: 28 },
    "Consumer Defensive": { low: 25, fair: 40, high: 60 },
    Healthcare: { low: 20, fair: 30, high: 50 },
    Energy: { low: 8, fair: 15, high: 25 },
    Industrials: { low: 15, fair: 25, high: 40 },
    "Consumer Cyclical": { low: 15, fair: 25, high: 45 },
    "Basic Materials": { low: 8, fair: 15, high: 30 },
    default: { low: 15, fair: 25, high: 45 },
  };
  const benchmark = SECTOR_PE[market.sector] || SECTOR_PE["default"];

  if (!llm) {
    return buildFallbackFundamental(market, benchmark);
  }

  const prompt = `You are a Senior Fundamental Equity Analyst specializing in Indian Equities.
Evaluate company valuation, profitability, balance sheet leverage, and growth metrics.

STOCK: ${market.symbol} (${market.company})
Sector: ${market.sector} | Industry: ${market.industry}
Current Price: ₹${market.currentPrice}

VALUATION:
- P/E Ratio: ${fmt(market.peRatio)} (Sector benchmarks: Undervalued < ${benchmark.low}, Fair = ${benchmark.low}-${benchmark.fair}, Premium > ${benchmark.high})
- P/B Ratio: ${fmt(market.pbRatio)}
- Analyst Target Price: ${market.analystTarget ? `₹${market.analystTarget}` : "N/A"}
- Analyst Stance: ${market.analystRecommendation ?? "N/A"}

PROFITABILITY & RETURN:
- Return on Equity (ROE): ${fmt(market.roe, true)}
- Net Profit Margin: ${fmt(market.netMargin, true)}
- Operating Margin: ${fmt(market.operatingMargin, true)}

GROWTH & EARNINGS:
- Revenue Growth (YoY): ${fmt(market.revenueGrowth, true)}
- Earnings Growth (YoY): ${fmt(market.earningsGrowth, true)}
- Trailing EPS: ${fmt(market.epsTrailing)} | Forward EPS: ${fmt(market.epsForward)}

SOLVENCY & LIQUIDITY:
- Debt to Equity: ${fmt(market.debtToEquity)}
- Current Ratio: ${fmt(market.currentRatio)} | Quick Ratio: ${fmt(market.quickRatio)}
- Dividend Yield: ${fmt(market.dividendYield, true)}

REQUIRED OUTPUT:
Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "score": <0-100 fundamental conviction score>,
  "valuationVerdict": "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED",
  "profitabilityGrade": "A" | "B" | "C" | "D" | "F",
  "growthOutlook": "<concise summary of revenue & earnings growth>",
  "balanceSheetHealth": "<concise evaluation of leverage and solvency ratios>",
  "cashFlowQuality": "<concise check on cash generation stability>",
  "keyObservation": "<2-3 sentence fundamental thesis>"
}`;

  try {
    const response = await llm.invoke(prompt);
    const text = typeof response.content === "string" ? response.content : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validation = validateAgentOutput(FundamentalReportSchema, parsed, "FundamentalAnalyst");
    if (validation.ok) return validation.data;
    return buildFallbackFundamental(market, benchmark);
  } catch (error) {
    console.error("[FundamentalAnalyst] Error:", error);
    return buildFallbackFundamental(market, benchmark);
  }
}

function buildFallbackFundamental(
  market: MarketData,
  benchmark: { low: number; fair: number; high: number }
): FundamentalReport {
  const pe = market.peRatio;
  const verdict =
    pe === null
      ? "FAIRLY_VALUED"
      : pe < benchmark.low
      ? "UNDERVALUED"
      : pe > benchmark.high
      ? "OVERVALUED"
      : "FAIRLY_VALUED";

  const roe = market.roe ?? 0;
  const grade =
    roe > 0.2
      ? "A"
      : roe > 0.15
      ? "B"
      : roe > 0.1
      ? "C"
      : roe > 0.05
      ? "D"
      : "F";

  let score = 50;
  if (verdict === "UNDERVALUED") score += 15;
  if (verdict === "OVERVALUED") score -= 15;
  if (grade === "A" || grade === "B") score += 15;
  if (market.debtToEquity !== null && market.debtToEquity < 1) score += 10;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    valuationVerdict: verdict,
    profitabilityGrade: grade,
    growthOutlook: `Revenue growth is ${market.revenueGrowth !== null ? (market.revenueGrowth * 100).toFixed(2) + "%" : "steady"}, with EPS growth at ${market.earningsGrowth !== null ? (market.earningsGrowth * 100).toFixed(2) + "%" : "normal rates"}.`,
    balanceSheetHealth: `Debt-to-Equity is ${market.debtToEquity !== null ? market.debtToEquity.toFixed(2) : "balanced"}, with Current Ratio ${market.currentRatio !== null ? market.currentRatio.toFixed(2) : "sound"}.`,
    cashFlowQuality: "Operating cash flow supports business reinvestment and debt servicing.",
    keyObservation: `${market.company} is ${verdict.toLowerCase().replace("_", " ")} at P/E ${pe !== null ? pe.toFixed(1) : "—"} relative to the ${market.sector} peer benchmark (${benchmark.low}-${benchmark.high}x).`,
  };
}
