import type {
  MarketData,
  TechnicalReport,
  FundamentalReport,
  SentimentReport,
  RiskReport,
  PeerReport,
  FinalAnalysis,
  Confidence,
} from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

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

export function computeFinalScore(
  market: MarketData,
  technical: TechnicalReport,
  fundamental: FundamentalReport,
  sentiment: SentimentReport,
  risk: RiskReport,
  peers: PeerReport,
  timeframe: string,
  riskProfile: string
): {
  overallScore: number;
  decision: FinalAnalysis["decision"];
  confidence: Confidence;
} {
  // Timeframe-adjusted weights
  const weights =
    timeframe === "short"
      ? { tech: 0.35, fund: 0.15, sent: 0.25, risk: 0.15, peer: 0.1 }
      : timeframe === "long"
      ? { tech: 0.1, fund: 0.35, sent: 0.1, risk: 0.25, peer: 0.2 }
      : { tech: 0.25, fund: 0.25, sent: 0.15, risk: 0.2, peer: 0.15 };

  const peerScore =
    peers.relativeValuation === "CHEAPER"
      ? 72
      : peers.relativeValuation === "IN_LINE"
      ? 50
      : 28;

  let score =
    technical.score * weights.tech +
    fundamental.score * weights.fund +
    sentiment.score * weights.sent +
    risk.score * weights.risk +
    peerScore * weights.peer;

  // Risk profile adjustment
  if (riskProfile === "conservative") {
    if (risk.overallRisk === "VERY_HIGH") score -= 12;
    if (risk.overallRisk === "HIGH") score -= 6;
    if (market.beta !== null && market.beta > 1.3) score -= 5;
  }
  if (riskProfile === "aggressive") {
    if (technical.regime === "TRENDING_UP" && technical.trendStrength === "STRONG") {
      score += 5;
    }
  }

  // Beta adjustment
  if (market.beta !== null) {
    if (market.beta > 1.5) score -= 4;
    if (market.beta < 0.7) score += 3;
  }

  // Valuation guardrail — very expensive stocks get disciplined penalty
  const benchmark = SECTOR_PE[market.sector] || SECTOR_PE["default"];
  if (market.peRatio !== null && market.peRatio > benchmark.high + 20) {
    score -= 8;
  }

  score = clamp(score);

  // Dynamic buy thresholds
  const buyThreshold =
    riskProfile === "conservative" ? 72 : riskProfile === "aggressive" ? 62 : 67;

  const decision: FinalAnalysis["decision"] =
    score >= buyThreshold + 8
      ? "STRONG_BUY"
      : score >= buyThreshold
      ? "BUY"
      : score >= buyThreshold - 8
      ? "ACCUMULATE"
      : score >= 40
      ? "HOLD"
      : score >= 30
      ? "REDUCE"
      : "SELL";

  // Confidence = inter-agent agreement (variance calculation)
  const agentScores = [
    technical.score,
    fundamental.score,
    sentiment.score,
    risk.score,
  ];
  const mean = agentScores.reduce((a, b) => a + b, 0) / agentScores.length;
  const variance =
    agentScores.reduce((s, v) => s + (v - mean) ** 2, 0) / agentScores.length;

  const confidence: Confidence =
    variance < 100 ? "HIGH" : variance < 300 ? "MEDIUM" : "LOW";

  return { overallScore: score, decision, confidence };
}
