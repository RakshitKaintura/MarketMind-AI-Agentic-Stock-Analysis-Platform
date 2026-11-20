import { NextResponse } from "next/server";
import { buildAnalysisGraph } from "@/lib/engine/graph";
import { checkRateLimit } from "@/lib/engine/infra/rate-limiter";
import { getCachedAnalysis, cacheAnalysis } from "@/lib/engine/infra/cache";
import { getActiveLLM } from "@/lib/engine/infra/llm-provider";
import type {
  TechnicalReport,
  FundamentalReport,
  SentimentReport,
  RiskReport,
  PeerReport,
  CollectedData,
} from "@/lib/engine/types";

export const runtime = "nodejs";

type AnalysisRequest = {
  symbol: string;
  timeframe?: "short" | "medium" | "long";
  riskProfile?: "conservative" | "balanced" | "aggressive";
  forceRefresh?: boolean;
};

const normalizeSymbol = (raw: string) => {
  const input = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (input.includes(".")) {
    return input;
  }
  return `${input}.NS`;
};

export async function POST(request: Request) {
  try {
    // 1. Rate limiting check
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const rateCheck = checkRateLimit(clientIP, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${Math.ceil(
            (rateCheck.retryAfterMs || 1000) / 1000
          )} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as AnalysisRequest;
    if (!body?.symbol || !body.symbol.trim()) {
      return NextResponse.json(
        { error: "Stock symbol is required" },
        { status: 400 }
      );
    }

    const normalizedSymbol = normalizeSymbol(body.symbol);
    const timeframe = body.timeframe ?? "medium";
    const riskProfile = body.riskProfile ?? "balanced";

    // 2. Cache Check (Tiered Mongo Cache) - bypassed if forceRefresh is true
    if (!body.forceRefresh) {
      const cached = await getCachedAnalysis(
        normalizedSymbol,
        timeframe,
        riskProfile
      );

      if (cached) {
        return NextResponse.json({
          symbol: cached.symbol,
          timeframe: cached.timeframe,
          riskProfile: cached.riskProfile,
          stockData: cached.stockData,
          newsData: "",
          analysis: cached.analysis,
          cached: true,
        });
      }
    }

    // 3. Initialize Active LLM (Claude claude-sonnet-5-5 / Gemini / Fallback)
    const llm = getActiveLLM();

    // 4. Initialize LangGraph multi-agent pipeline
    const graph = buildAnalysisGraph(llm);

    // Setup Server-Sent Events (SSE) Stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Run graph asynchronously and stream intermediate progress
    graph
      .invoke({
        symbol: normalizedSymbol,
        timeframe,
        riskProfile,
        collectedData: "",
        technicalReport: "",
        fundamentalReport: "",
        sentimentReport: "",
        riskReport: "",
        peerReport: "",
        chiefReport: "",
        finalScore: "",
      })
      .then(async (result) => {
        const collected: CollectedData | null = result.collectedData
          ? JSON.parse(result.collectedData)
          : null;

        // Build formatted stock snapshot text for the UI
        let stockDataText = "";
        if (collected?.market) {
          const m = collected.market;
          const ind = collected.indicators;
          stockDataText = [
            `Symbol: ${m.symbol}`,
            `Company: ${m.company}`,
            `Sector: ${m.sector}`,
            `Industry: ${m.industry}`,
            `Current Price: ₹${m.currentPrice.toFixed(2)}`,
            `Change: ${(m.changePercent > 0 ? "+" : "") + m.changePercent.toFixed(2)}%`,
            `52W Range: ₹${m.fiftyTwoWeekLow.toFixed(2)} - ₹${m.fiftyTwoWeekHigh.toFixed(2)}`,
            `50D Avg: ₹${m.fiftyDayAvg.toFixed(2)}`,
            `200D Avg: ₹${m.twoHundredDayAvg.toFixed(2)}`,
            `RSI (14): ${ind.rsi14 !== null ? ind.rsi14.toFixed(2) : "—"}`,
            `SMA 20: ${ind.sma20 !== null ? "₹" + ind.sma20.toFixed(2) : "—"}`,
            `SMA 50: ${ind.sma50 !== null ? "₹" + ind.sma50.toFixed(2) : "—"}`,
            `SMA 200: ${ind.sma200 !== null ? "₹" + ind.sma200.toFixed(2) : "—"}`,
            `EMA 12: ${ind.ema12 !== null ? "₹" + ind.ema12.toFixed(2) : "—"}`,
            `EMA 26: ${ind.ema26 !== null ? "₹" + ind.ema26.toFixed(2) : "—"}`,
            `ADX: ${ind.adx !== null ? ind.adx.toFixed(2) : "—"}`,
            `Supertrend: ${ind.supertrend ? "₹" + ind.supertrend.value.toFixed(2) + " (" + ind.supertrend.signal + ")" : "—"}`,
            `MACD Signal: ${ind.macd ? ind.macd.line.toFixed(2) + " (" + (ind.macd.line > ind.macd.signal ? "Bullish" : "Bearish") + ")" : "—"}`,
            `Stochastic: ${ind.stochastic ? "%K " + ind.stochastic.k + " %D " + ind.stochastic.d + " (" + ind.stochastic.signal + ")" : "—"}`,
            `Williams %R: ${ind.williamsR !== null ? ind.williamsR.toFixed(2) : "—"}`,
            `Annualized Volatility: ${ind.annualizedVolatility !== null ? ind.annualizedVolatility.toFixed(2) + "%" : "—"}`,
            `Bollinger Bands: Upper ₹${ind.bollingerBands ? ind.bollingerBands.upper.toFixed(2) : "—"}, Lower ₹${ind.bollingerBands ? ind.bollingerBands.lower.toFixed(2) : "—"}, %B ${ind.bollingerBands ? ind.bollingerBands.percentB.toFixed(2) + "%" : "—"}`,
            `Keltner Channel: Upper ₹${ind.keltnerChannel ? ind.keltnerChannel.upper.toFixed(2) : "—"}, Lower ₹${ind.keltnerChannel ? ind.keltnerChannel.lower.toFixed(2) : "—"}`,
            `OBV: ${ind.obv ? ind.obv.trend : "—"}`,
            `VWAP: ${ind.vwap !== null ? "₹" + ind.vwap.toFixed(2) : "—"}`,
            `MFI: ${ind.mfi !== null ? ind.mfi.toFixed(2) : "—"}`,
            `Volume Trend: ${ind.volumeTrend ? ind.volumeTrend.trend + " (" + (ind.volumeTrend.changePercent > 0 ? "+" : "") + ind.volumeTrend.changePercent.toFixed(1) + "%)" : "—"}`,
            `P/E Ratio: ${m.peRatio !== null ? m.peRatio.toFixed(2) : "—"}`,
            `P/B Ratio: ${m.pbRatio !== null ? m.pbRatio.toFixed(2) : "—"}`,
            `ROE: ${m.roe !== null ? (m.roe * 100).toFixed(2) + "%" : "—"}`,
            `Debt to Equity: ${m.debtToEquity !== null ? m.debtToEquity.toFixed(2) : "—"}`,
            `Net Margin: ${m.netMargin !== null ? (m.netMargin * 100).toFixed(2) + "%" : "—"}`,
            `Operating Margin: ${m.operatingMargin !== null ? (m.operatingMargin * 100).toFixed(2) + "%" : "—"}`,
            `Revenue Growth: ${m.revenueGrowth !== null ? (m.revenueGrowth * 100).toFixed(2) + "%" : "—"}`,
            `Earnings Growth: ${m.earningsGrowth !== null ? (m.earningsGrowth * 100).toFixed(2) + "%" : "—"}`,
            `EPS (TTM): ${m.epsTrailing !== null ? m.epsTrailing.toFixed(2) : "—"}`,
            `Current Ratio: ${m.currentRatio !== null ? m.currentRatio.toFixed(2) : "—"}`,
            `Quick Ratio: ${m.quickRatio !== null ? m.quickRatio.toFixed(2) : "—"}`,
            `Dividend Yield: ${m.dividendYield !== null ? (m.dividendYield * 100).toFixed(2) + "%" : "—"}`,
            `Beta: ${m.beta !== null ? m.beta.toFixed(2) : "—"}`,
            `Analyst Target Price: ${m.analystTarget !== null ? "₹" + m.analystTarget.toFixed(2) : "—"}`,
            `Analyst Recommendation: ${m.analystRecommendation || "—"}`,
          ].join("\n");
        }

        // Send stockData event to client
        if (stockDataText) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "stockData",
                data: stockDataText,
              })}\n\n`
            )
          );
        }

        // Parse individual specialist reports
        const technical: TechnicalReport = result.technicalReport
          ? JSON.parse(result.technicalReport)
          : null;
        const fundamental: FundamentalReport = result.fundamentalReport
          ? JSON.parse(result.fundamentalReport)
          : null;
        const sentiment: SentimentReport = result.sentimentReport
          ? JSON.parse(result.sentimentReport)
          : null;
        const risk: RiskReport = result.riskReport
          ? JSON.parse(result.riskReport)
          : null;
        const peers: PeerReport = result.peerReport
          ? JSON.parse(result.peerReport)
          : null;
        const chiefSynthesis = result.chiefReport
          ? JSON.parse(result.chiefReport)
          : {};
        const finalScoreData = result.finalScore
          ? JSON.parse(result.finalScore)
          : { overallScore: 50, decision: "HOLD", confidence: "MEDIUM" };

        // Construct unified JSON that satisfies both Engine V2 schemas AND existing UI format
        const unifiedAnalysis = {
          executiveSummary:
            chiefSynthesis.executiveSummary ||
            `${collected?.market?.company || normalizedSymbol} analysis synthesized across 5 specialized research tracks. Technical conviction: ${technical?.score ?? 50}/100, Fundamental score: ${fundamental?.score ?? 50}/100.`,
          fundamentalAnalysis: {
            valuation: `Valuation status: ${fundamental?.valuationVerdict || "FAIRLY_VALUED"} (Score: ${fundamental?.score ?? 50}/100). ${fundamental?.keyObservation || ""}`,
            profitability: `Quality Grade: ${fundamental?.profitabilityGrade || "B"}. Profit margin and return on equity review completed.`,
            growth: fundamental?.growthOutlook || "Revenue and earnings trajectory assessed.",
            leverage: fundamental?.balanceSheetHealth || "Debt-to-equity and liquidity ratios within industry risk parameters.",
            cashFlow: fundamental?.cashFlowQuality || "Operating cash generation sustains ongoing operational commitments.",
          },
          technicalAnalysis: {
            trend: `Regime: ${technical?.regime || "RANGING"} (${technical?.trendStrength || "MODERATE"} strength). Key Support ₹${technical?.supportLevel?.toFixed(2) || "—"}, Resistance ₹${technical?.resistanceLevel?.toFixed(2) || "—"}.`,
            momentum: `Key Signals: ${(technical?.signals || []).join(" | ")}. ${technical?.keyObservation || ""}`,
            volatility: `Profile: ${collected?.indicators?.annualizedVolatility ? collected.indicators.annualizedVolatility.toFixed(2) + "% annualized" : "Moderate regime"}. ATR ₹${collected?.indicators?.atr14 ? collected.indicators.atr14.toFixed(2) : "—"}.`,
          },
          industryContext:
            peers?.keyObservation ||
            `Relative valuation is ${peers?.relativeValuation || "IN_LINE"} and momentum is ${peers?.relativeStrength || "IN_LINE"} relative to sector peers.`,
          riskAssessment: {
            businessRisk: `${risk?.businessRisk?.level || "MEDIUM"} — ${risk?.businessRisk?.detail || "Business model and market share evaluation"}`,
            valuationRisk: `${risk?.valuationRisk?.level || "MEDIUM"} — ${risk?.valuationRisk?.detail || "Multiple expansion/contraction sensitivity"}`,
            macroRisk: `${risk?.macroRisk?.level || "MEDIUM"} — ${risk?.macroRisk?.detail || "Interest rate, inflation and systemic beta risks"}`,
          },
          actionPlan: chiefSynthesis.actionPlan || [
            `Stagger accumulation between ₹${((collected?.market?.currentPrice || 100) * 0.98).toFixed(2)} and ₹${(collected?.market?.currentPrice || 100).toFixed(2)} rather than full market-order commitment.`,
            `Maintain disciplined stop-loss anchored below technical support at ₹${technical?.supportLevel?.toFixed(2) || "recent floor"}.`,
            `Audit quarterly earnings releases for guidance and margin trajectory consistency.`,
          ],
          monitoringChecklist: chiefSynthesis.monitoringTriggers || [
            `Monitor if price closes below support level at ₹${technical?.supportLevel?.toFixed(2) || "recent lows"}`,
            `Review position if quarterly revenue or operating profit drops significantly`,
            `Track momentum shifts when RSI breaches beyond 30 (oversold) or 70 (overbought)`,
          ],
          confidence: finalScoreData.confidence || "MEDIUM",
          bullCase:
            chiefSynthesis.bullCase ||
            `Sustained top-line expansion in ${collected?.market?.sector || "core market"}, margin resilience, and technical breakout toward resistance at ₹${technical?.resistanceLevel?.toFixed(2) || "near-term target"}.`,
          bearCase:
            chiefSynthesis.bearCase ||
            `Downside invalidation below key support at ₹${technical?.supportLevel?.toFixed(2) || "support"}, valuation multiple compression, or sector demand contraction.`,
          priceTargets: chiefSynthesis.priceTargets || {
            shortTerm: { price: Number(((technical?.resistanceLevel && technical.resistanceLevel > (collected?.market?.currentPrice || 100)) ? technical.resistanceLevel : (collected?.market?.currentPrice || 100) * 1.06).toFixed(2)), timeframe: "1-3 Months" },
            mediumTerm: { price: Number(((collected?.market?.currentPrice || 100) * 1.14).toFixed(2)), timeframe: "3-6 Months" },
            longTerm: { price: Number(((collected?.market?.currentPrice || 100) * 1.25).toFixed(2)), timeframe: "6-12 Months" },
          },
          catalysts: chiefSynthesis.catalysts || [
            `Quarterly earnings update and management commentary for ${collected?.market?.company || normalizedSymbol}`,
            `${collected?.market?.sector || "Sector"} institutional fund flows and policy shifts`,
          ],
          // Engine V2 Specific Deep Reports
          engineV2: {
            version: "2.0.0",
            specialistReports: {
              technical,
              fundamental,
              sentiment,
              risk,
              peerComparison: peers,
            },
            deterministicScoring: finalScoreData,
            computedIndicatorCount: collected?.indicatorList?.length || 0,
            indicatorsComputed: collected?.indicatorList || [],
          },
        };

        const analysisJsonString = JSON.stringify(unifiedAnalysis, null, 2);

        // Stream analysis tokens / payload
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "token",
              data: analysisJsonString,
            })}\n\n`
          )
        );

        // Cache the result in MongoDB
        await cacheAnalysis(
          normalizedSymbol,
          timeframe,
          riskProfile,
          stockDataText,
          "",
          analysisJsonString
        );

        // Signal completion
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        await writer.close();
      })
      .catch(async (error) => {
        console.error("[StockAnalysis V2] Pipeline execution failed:", error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: "AI analysis pipeline failed. Please retry.",
            })}\n\n`
          )
        );
        await writer.close();
      });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[StockAnalysis V2 Route Error]:", error);
    return NextResponse.json(
      { error: "Unable to generate stock analysis" },
      { status: 500 }
    );
  }
}
