// ═══════════════════════════════════════════════════════════
// Engine V2 — All TypeScript types (single source of truth)
// ═══════════════════════════════════════════════════════════

export type Timeframe = "short" | "medium" | "long";
export type RiskProfile = "conservative" | "balanced" | "aggressive";
export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface BaseLLM {
  invoke(prompt: string): Promise<{ content: string | unknown }>;
}

export interface MarketData {
  symbol: string;
  company: string;
  sector: string;
  industry: string;
  currentPrice: number;
  changePercent: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAvg: number;
  twoHundredDayAvg: number;
  marketCap: number;
  volume: number;
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  debtToEquity: number | null;
  netMargin: number | null;
  operatingMargin: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  epsTrailing: number | null;
  epsForward: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  dividendYield: number | null;
  beta: number | null;
  freeCashflow: number | null;
  operatingCashflow: number | null;
  analystTarget: number | null;
  analystRecommendation: string | null;
}

export interface TechnicalIndicators {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  adx: number | null;
  supertrend: { value: number; signal: "BUY" | "SELL" } | null;
  rsi14: number | null;
  macd: { line: number; signal: number; histogram: number } | null;
  stochastic: { k: number; d: number; signal: string } | null;
  williamsR: number | null;
  atr14: number | null;
  bollingerBands: { upper: number; middle: number; lower: number; percentB: number } | null;
  keltnerChannel: { upper: number; middle: number; lower: number } | null;
  annualizedVolatility: number | null;
  obv: { current: number; trend: string } | null;
  vwap: number | null;
  mfi: number | null;
  volumeTrend: { trend: string; changePercent: number } | null;
}

export interface NewsItem {
  headline: string;
  source: string;
  datetime: string;
  sentiment?: Direction;
  sentimentScore?: number;
}

export interface TechnicalReport {
  regime: "TRENDING_UP" | "TRENDING_DOWN" | "RANGING" | "VOLATILE";
  score: number;
  signals: string[];
  supportLevel: number;
  resistanceLevel: number;
  trendStrength: "STRONG" | "MODERATE" | "WEAK";
  keyObservation: string;
}

export interface FundamentalReport {
  score: number;
  valuationVerdict: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED";
  profitabilityGrade: "A" | "B" | "C" | "D" | "F";
  growthOutlook: string;
  balanceSheetHealth: string;
  cashFlowQuality: string;
  keyObservation: string;
}

export interface SentimentReport {
  score: number;
  overallMood: Direction;
  headlines: Array<{ text: string; sentiment: Direction; confidence: number }>;
  keyDrivers: string[];
  keyObservation: string;
}

export interface RiskReport {
  overallRisk: RiskLevel;
  score: number;
  businessRisk: { level: RiskLevel; detail: string };
  valuationRisk: { level: RiskLevel; detail: string };
  macroRisk: { level: RiskLevel; detail: string };
  liquidityRisk: { level: RiskLevel; detail: string };
  keyObservation: string;
}

export interface PeerReport {
  peers: Array<{
    symbol: string;
    company: string;
    pe: number | null;
    roe: number | null;
    growth: number | null;
    priceChange: number;
  }>;
  relativeValuation: "CHEAPER" | "IN_LINE" | "EXPENSIVE";
  relativeStrength: "OUTPERFORMING" | "IN_LINE" | "UNDERPERFORMING";
  keyObservation: string;
}

export interface FinalAnalysis {
  symbol: string;
  company: string;
  sector: string;
  analyzedAt: string;
  overallScore: number;
  direction: Direction;
  decision: "STRONG_BUY" | "BUY" | "ACCUMULATE" | "HOLD" | "REDUCE" | "SELL";
  confidence: Confidence;
  technical: TechnicalReport;
  fundamental: FundamentalReport;
  sentiment: SentimentReport;
  risk: RiskReport;
  peerComparison: PeerReport;
  executiveSummary: string;
  bullCase: string;
  bearCase: string;
  catalysts: string[];
  actionPlan: string[];
  monitoringTriggers: string[];
  priceTargets: {
    shortTerm: { price: number; timeframe: string };
    mediumTerm: { price: number; timeframe: string };
    longTerm: { price: number; timeframe: string };
  };
  dataQuality: "FULL" | "PARTIAL" | "LIMITED";
  indicatorsUsed: string[];
}

export interface CollectedData {
  market: MarketData;
  indicators: TechnicalIndicators;
  news: NewsItem[];
  closes: number[];
  indicatorList: string[];
}

export interface EngineInput {
  symbol: string;
  timeframe: Timeframe;
  riskProfile: RiskProfile;
}
