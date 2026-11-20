import { z } from "zod";

export const TechnicalReportSchema = z.object({
  regime: z.enum(["TRENDING_UP", "TRENDING_DOWN", "RANGING", "VOLATILE"]),
  score: z.number().min(0).max(100),
  signals: z.array(z.string()).min(1),
  supportLevel: z.number(),
  resistanceLevel: z.number(),
  trendStrength: z.enum(["STRONG", "MODERATE", "WEAK"]),
  keyObservation: z.string().min(10),
});

export const FundamentalReportSchema = z.object({
  score: z.number().min(0).max(100),
  valuationVerdict: z.enum(["UNDERVALUED", "FAIRLY_VALUED", "OVERVALUED"]),
  profitabilityGrade: z.enum(["A", "B", "C", "D", "F"]),
  growthOutlook: z.string().min(10),
  balanceSheetHealth: z.string().min(10),
  cashFlowQuality: z.string().min(10),
  keyObservation: z.string().min(10),
});

export const SentimentReportSchema = z.object({
  score: z.number().min(0).max(100),
  overallMood: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
  headlines: z.array(
    z.object({
      text: z.string(),
      sentiment: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
      confidence: z.number().min(0).max(100),
    })
  ),
  keyDrivers: z.array(z.string()),
  keyObservation: z.string().min(10),
});

export const RiskReportSchema = z.object({
  overallRisk: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  score: z.number().min(0).max(100),
  businessRisk: z.object({
    level: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
    detail: z.string(),
  }),
  valuationRisk: z.object({
    level: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
    detail: z.string(),
  }),
  macroRisk: z.object({
    level: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
    detail: z.string(),
  }),
  liquidityRisk: z.object({
    level: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
    detail: z.string(),
  }),
  keyObservation: z.string().min(10),
});

export const PeerReportSchema = z.object({
  peers: z.array(
    z.object({
      symbol: z.string(),
      company: z.string(),
      pe: z.number().nullable(),
      roe: z.number().nullable(),
      growth: z.number().nullable(),
      priceChange: z.number(),
    })
  ),
  relativeValuation: z.enum(["CHEAPER", "IN_LINE", "EXPENSIVE"]),
  relativeStrength: z.enum(["OUTPERFORMING", "IN_LINE", "UNDERPERFORMING"]),
  keyObservation: z.string().min(10),
});

export const FinalAnalysisSchema = z.object({
  executiveSummary: z.string().min(15),
  bullCase: z.string().min(5),
  bearCase: z.string().min(5),
  catalysts: z.array(z.string()).min(1),
  actionPlan: z.array(z.string()).min(1),
  monitoringTriggers: z.array(z.string()).min(1),
  priceTargets: z.object({
    shortTerm: z.object({ price: z.number(), timeframe: z.string() }),
    mediumTerm: z.object({ price: z.number(), timeframe: z.string() }),
    longTerm: z.object({ price: z.number(), timeframe: z.string() }),
  }),
});

export type ValidatedTechnical = z.infer<typeof TechnicalReportSchema>;
export type ValidatedFundamental = z.infer<typeof FundamentalReportSchema>;
export type ValidatedSentiment = z.infer<typeof SentimentReportSchema>;
export type ValidatedRisk = z.infer<typeof RiskReportSchema>;
export type ValidatedPeer = z.infer<typeof PeerReportSchema>;
export type ValidatedFinalAnalysis = z.infer<typeof FinalAnalysisSchema>;

export function validateAgentOutput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  agentName: string
): { ok: true; data: T } | { ok: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  console.warn(`[${agentName}] Validation failed:`, result.error.issues);
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
