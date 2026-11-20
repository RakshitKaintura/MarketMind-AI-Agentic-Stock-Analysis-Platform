import { FinalAnalysisSchema, validateAgentOutput } from "../schemas";
import type {
  MarketData,
  TechnicalReport,
  FundamentalReport,
  SentimentReport,
  RiskReport,
  PeerReport,
  BaseLLM,
} from "../types";

export async function synthesize(
  llm: BaseLLM | null,
  market: MarketData,
  technical: TechnicalReport,
  fundamental: FundamentalReport,
  sentiment: SentimentReport,
  risk: RiskReport,
  peers: PeerReport,
  timeframe: string,
  riskProfile: string
): Promise<string> {
  if (!llm) {
    return buildFallbackSynthesis(market, technical, fundamental, risk, timeframe);
  }

  const prompt = `You are the Chief Investment Strategist at an institutional research firm.
You have received reports from 5 specialist analysts (Technical, Fundamental, Sentiment, Risk, Peer Comparison).
Synthesize them into a decisive, professional investment report for ${market.symbol} (${market.company}).

SPECIALIST ANALYST INPUTS:
- Technical Setup (Score: ${technical.score}/100, Regime: ${technical.regime}, Strength: ${technical.trendStrength}):
  Signals: ${technical.signals.join("; ")}
  Support: ₹${technical.supportLevel} | Resistance: ₹${technical.resistanceLevel}
  Observation: ${technical.keyObservation}

- Fundamental Assessment (Score: ${fundamental.score}/100, Valuation: ${fundamental.valuationVerdict}, Quality: ${fundamental.profitabilityGrade}):
  Growth: ${fundamental.growthOutlook}
  Balance Sheet: ${fundamental.balanceSheetHealth}
  Observation: ${fundamental.keyObservation}

- Sentiment Pulse (Score: ${sentiment.score}/100, Mood: ${sentiment.overallMood}):
  Drivers: ${sentiment.keyDrivers.join("; ")}
  Observation: ${sentiment.keyObservation}

- Risk Evaluation (Score: ${risk.score}/100, Overall: ${risk.overallRisk}):
  Business: ${risk.businessRisk.level} | Valuation: ${risk.valuationRisk.level} | Macro: ${risk.macroRisk.level}
  Observation: ${risk.keyObservation}

- Peer Context:
  Valuation: ${peers.relativeValuation} | Strength: ${peers.relativeStrength}
  Observation: ${peers.keyObservation}

INVESTOR PROFILE:
- Horizon: ${timeframe}
- Risk Appetite: ${riskProfile}
- Current Market Price: ₹${market.currentPrice}

TASK:
1. Synthesize all perspectives into an Executive Summary (3-4 sentences with clear BULLISH, BEARISH, or NEUTRAL conviction).
2. Detail a concise Bull Case and Bear Case.
3. Identify 2-3 specific near-term Catalysts.
4. Formulate an actionable 3-step execution plan aligned with the ${timeframe} horizon and ${riskProfile} risk profile.
5. List 3 specific quantifiable monitoring triggers (e.g. "Review if RSI closes below 40 or quarterly revenue drops below 8%").
6. Set realistic price targets (INR ₹) for shortTerm (1-3m), mediumTerm (3-6m), and longTerm (6-12m) from ₹${market.currentPrice}.

REQUIRED OUTPUT:
Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "executiveSummary": "<concise high-conviction 3-4 sentence synthesis>",
  "bullCase": "<catalysts & upside upside thesis>",
  "bearCase": "<key risks & downside vulnerabilities>",
  "catalysts": ["catalyst 1", "catalyst 2"],
  "actionPlan": ["step 1", "step 2", "step 3"],
  "monitoringTriggers": ["trigger 1", "trigger 2", "trigger 3"],
  "priceTargets": {
    "shortTerm": { "price": <number>, "timeframe": "1-3 Months" },
    "mediumTerm": { "price": <number>, "timeframe": "3-6 Months" },
    "longTerm": { "price": <number>, "timeframe": "6-12 Months" }
  }
}`;

  try {
    const response = await llm.invoke(prompt);
    const text = typeof response.content === "string" ? response.content : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validation = validateAgentOutput(FinalAnalysisSchema, parsed, "ChiefAnalyst");
    if (validation.ok) return JSON.stringify(validation.data, null, 2);
    return buildFallbackSynthesis(market, technical, fundamental, risk, timeframe);
  } catch (error) {
    console.error("[ChiefAnalyst] Error:", error);
    return buildFallbackSynthesis(market, technical, fundamental, risk, timeframe);
  }
}

function buildFallbackSynthesis(
  market: MarketData,
  technical: TechnicalReport,
  fundamental: FundamentalReport,
  risk: RiskReport,
  timeframe: string
): string {
  const currentPrice = market.currentPrice;
  const isPositive = technical.score >= 50 && fundamental.score >= 45;

  const shortTarget = Number(
    (technical.resistanceLevel > currentPrice
      ? Math.min(technical.resistanceLevel, currentPrice * 1.08)
      : isPositive ? currentPrice * 1.05 : currentPrice * 0.96
    ).toFixed(2)
  );
  const medTarget = Number(
    (isPositive
      ? Math.max(shortTarget * 1.05, currentPrice * 1.12)
      : currentPrice * 0.92
    ).toFixed(2)
  );
  const longTarget = Number(
    (isPositive
      ? Math.max(medTarget * 1.08, currentPrice * 1.25)
      : currentPrice * 0.88
    ).toFixed(2)
  );

  return JSON.stringify(
    {
      executiveSummary: `${market.company} (${market.symbol}) exhibits a ${
        isPositive ? "constructive accumulation" : "defensive consolidation"
      } profile in the ${market.sector || "Equity"} sector. Technical momentum is currently evaluated at ${
        technical.score
      }/100 in a ${technical.regime.toLowerCase().replace(/_/g, " ")} regime, while fundamental quality reflects a ${
        fundamental.valuationVerdict.toLowerCase().replace(/_/g, " ")
      } stance (${fundamental.score}/100). Institutional positioning is calibrated for the ${timeframe} horizon with an overall ${
        risk.overallRisk.toLowerCase()
      } risk posture.`,
      bullCase: `Sustained top-line expansion in ${market.sector || "core market"}, margin resilience (${
        market.netMargin ? (market.netMargin * 100).toFixed(1) + "% net margin" : "sound operational leverage"
      }), and upside technical expansion toward the resistance zone at ₹${technical.resistanceLevel.toFixed(2)}.`,
      bearCase: `Downside invalidation below key institutional support at ₹${technical.supportLevel.toFixed(
        2
      )}, valuation multiple compression from current ${
        market.peRatio ? market.peRatio.toFixed(1) + "x P/E" : "extended levels"
      }, or sector-wide demand contraction.`,
      catalysts: [
        `Upcoming quarterly earnings filing and management commentary for ${market.company}`,
        `${market.sector || "Sector"} institutional institutional flow and regulatory policy catalysts`,
        `Confirmation of trading volume breakout above the 50-day average of ₹${
          market.fiftyDayAvg ? market.fiftyDayAvg.toFixed(2) : currentPrice.toFixed(2)
        }`,
      ],
      actionPlan: [
        `Execute staggered accumulation between ₹${(currentPrice * 0.98).toFixed(2)} and ₹${currentPrice.toFixed(
          2
        )} to optimize cost basis.`,
        `Anchor systematic invalidation stop-loss just below support at ₹${technical.supportLevel.toFixed(2)}.`,
        `Scale out or lock partial gains as quote approaches the target resistance hurdle near ₹${technical.resistanceLevel.toFixed(
          2
        )}.`,
      ],
      monitoringTriggers: [
        `Trigger review if weekly closing price breaches support level at ₹${technical.supportLevel.toFixed(2)}`,
        `Monitor RSI(14) for momentum divergence or exhaustion signals outside the 40-65 neutral band`,
        `Audit quarterly earnings releases for any deceleration in revenue or margin trajectory`,
      ],
      priceTargets: {
        shortTerm: { price: shortTarget, timeframe: "1-3 Months" },
        mediumTerm: { price: medTarget, timeframe: "3-6 Months" },
        longTerm: { price: longTarget, timeframe: "6-12 Months" },
      },
    },
    null,
    2
  );
}
