import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { getStocksDetails } from "@/lib/actions/finnhub.actions";
import { connectToDatabase } from "@/database/mongoose";
import { AnalysisCacheModel } from "@/database/models/analysis-cache.model";

export const runtime = "nodejs";

type AnalysisRequest = {
  symbol: string;
  timeframe?: "short" | "medium" | "long";
  riskProfile?: "conservative" | "balanced" | "aggressive";
};

const parseModelText = (response: unknown): string => {
  const maybeMessage = response as {
    content?: unknown;
    text?: string | (() => string);
  };

  if (typeof maybeMessage?.text === "function") {
    const value = maybeMessage.text();
    if (value?.trim()) return value;
  }

  if (typeof maybeMessage?.text === "string" && maybeMessage.text.trim()) {
    return maybeMessage.text;
  }

  const content = maybeMessage?.content;
  if (typeof content === "string" && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    const merged = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          const textValue = (item as { text?: unknown }).text;
          return typeof textValue === "string" ? textValue : "";
        }
        return "";
      })
      .join("\n")
      .trim();

    if (merged) return merged;
  }

  return "";
};

const buildFallbackAnalysis = (
  stockDataText: string,
  timeframe: string,
  riskProfile: string,
  reason?: string
) => {
  const metricMap = Object.fromEntries(
    stockDataText
      .split("\n")
      .map((line) => line.split(":"))
      .filter((parts) => parts.length >= 2)
      .map(([label, ...value]) => [
        label.trim().toLowerCase(),
        value.join(":").trim(),
      ])
  );

  const changeLine = metricMap["change"];
  const pctMatch = changeLine?.match(/([+-]?\d+(?:\.\d+)?)%/);
  const changePercent = pctMatch ? Number(pctMatch[1]) : 0;

  const trend =
    changePercent > 0 ? "Bullish bias" : changePercent < 0 ? "Bearish bias" : "Sideways";
  const confidence =
    Math.abs(changePercent) > 2 ? "High" : Math.abs(changePercent) > 0.7 ? "Medium" : "Low";
  const pe = metricMap["p/e ratio"] || "—";
  const roe = metricMap["roe"] || "—";
  const debtToEquity = metricMap["debt to equity"] || "—";
  const rsi = metricMap["rsi (14)"] || "—";
  const volatility = metricMap["annualized volatility"] || "—";
  const sector = metricMap["sector"] || "—";
  const industry = metricMap["industry"] || "—";

  const riskNote =
    riskProfile === "conservative"
      ? "Prefer staggered entries, tighter stops, and avoid high-beta names."
      : riskProfile === "aggressive"
      ? "Higher volatility may be acceptable, but position sizing and exit rules are essential."
      : "Use balanced allocation with predefined stop-loss and review milestones.";

  const horizonPlan =
    timeframe === "short"
      ? "Focus on momentum, RSI regime shifts, and strict invalidation levels."
      : timeframe === "long"
      ? "Prioritize business quality, valuation discipline, and earnings consistency over price noise."
      : "Blend technical trend confirmation with valuation and financial quality checks.";

  return JSON.stringify({
    executiveSummary: `Current market tone is ${trend} (${changePercent.toFixed(2)}%). The stock sits in ${sector} / ${industry} with ${confidence.toLowerCase()} conviction based on available data.`,
    fundamentalAnalysis: {
      valuation: `Valuation signal: P/E ${pe}`,
      profitability: `Profitability signal: ROE ${roe}`,
      growth: "Growth data unavailable",
      leverage: `Leverage check: Debt-to-Equity ${debtToEquity}`,
      cashFlow: "Cash flow data unavailable"
    },
    technicalAnalysis: {
      trend: "Track support and resistance behavior before fresh entries.",
      momentum: `Momentum check: RSI(14) ${rsi}`,
      volatility: `Volatility profile: ${volatility}`
    },
    industryContext: "Compare valuation and growth against direct sector peers before finalizing conviction.",
    riskAssessment: {
      businessRisk: riskNote,
      valuationRisk: "Ensure valuation aligns with historical averages.",
      macroRisk: "Monitor sector-specific macroeconomic headwinds."
    },
    actionPlan: [horizonPlan],
    monitoringChecklist: ["Review revenue/EPS trend", "Check margin direction", "Monitor debt trajectory", "Track shareholding trend", "Follow major company news each quarter"],
    confidence: confidence,
    bullCase: "Market sentiment improves, supported by strong fundamentals.",
    bearCase: "Market downturn affects sector valuation and growth.",
    fallbackReason: reason || "Unknown error"
  }, null, 2);
};

const normalizeSymbol = (raw: string) => {
  const input = raw.trim().toUpperCase().replace(/\s+/g, "");

  if (input.includes(".")) {
    return input;
  }

  return `${input}.NS`;
};

const AnalysisState = Annotation.Root({
  symbol: Annotation<string>,
  timeframe: Annotation<string>,
  riskProfile: Annotation<string>,
  stockDataText: Annotation<string>,
  newsText: Annotation<string>,
  peersText: Annotation<string>,
  analysis: Annotation<string>,
});

export async function POST(request: Request) {
  try {
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

    // 1. Check cache first
    await connectToDatabase();
    const cached = await AnalysisCacheModel.findOne({
      symbol: normalizedSymbol,
      timeframe,
      riskProfile,
    }).lean();

    if (cached) {
      return NextResponse.json({
        symbol: cached.symbol,
        timeframe: cached.timeframe,
        riskProfile: cached.riskProfile,
        stockData: cached.stockData,
        analysis: cached.analysis,
        cached: true,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const llm = apiKey
      ? new ChatGoogleGenerativeAI({
          model: "gemini-3.6-flash",
          apiKey,
          temperature: 0.2,
        })
      : null;

    const fetchStockNode = async (state: typeof AnalysisState.State) => {
      const normalized = normalizeSymbol(state.symbol);
      const primaryData = await getStocksDetails(normalized);
      const fallbackData = primaryData ?? (await getStocksDetails(state.symbol));

      if (!fallbackData) {
        return {
          stockDataText:
            "No live stock details found for the requested symbol.",
        };
      }

      const details = [
        `Symbol: ${fallbackData.symbol}`,
        `Company: ${fallbackData.company}`,
        `Sector: ${fallbackData.sector}`,
        `Industry: ${fallbackData.industry}`,
        `Current Price: ${fallbackData.priceFormatted}`,
        `Change: ${fallbackData.changeFormatted}`,
        `52W Range: ${fallbackData.fiftyTwoWeekLow} - ${fallbackData.fiftyTwoWeekHigh}`,
        `50D Avg: ${fallbackData.fiftyDayAverage}`,
        `200D Avg: ${fallbackData.twoHundredDayAverage}`,
        `RSI (14): ${fallbackData.technical?.rsi14 ?? "—"}`,
        `SMA 20: ${fallbackData.technical?.sma20 ?? "—"}`,
        `SMA 50: ${fallbackData.technical?.sma50 ?? "—"}`,
        `Annualized Volatility: ${fallbackData.technical?.annualizedVolatility ?? "—"}`,
        `EMA 12: ${fallbackData.technical?.ema12 ?? "—"}`,
        `EMA 26: ${fallbackData.technical?.ema26 ?? "—"}`,
        `MACD Signal: ${fallbackData.technical?.macdSignal ?? "—"}`,
        `Bollinger Bands: Upper ${fallbackData.technical?.bollingerUpper ?? "—"}, Lower ${fallbackData.technical?.bollingerLower ?? "—"}, PercentB ${fallbackData.technical?.bollingerPercentB ?? "—"}`,
        `Volume Trend: ${fallbackData.technical?.volumeTrend ?? "—"}`,
        `P/E Ratio: ${fallbackData.peRatio}`,
        `P/B Ratio: ${fallbackData.pbRatio}`,
        `ROE: ${fallbackData.roe}`,
        `Debt to Equity: ${fallbackData.debtToEquity}`,
        `Net Margin: ${fallbackData.netMargin}`,
        `Operating Margin: ${fallbackData.operatingMargin}`,
        `Revenue Growth: ${fallbackData.revenueGrowth}`,
        `Earnings Growth: ${fallbackData.earningsGrowth}`,
        `EPS (TTM): ${fallbackData.epsTrailing}`,
        `EPS (Forward): ${fallbackData.epsForward}`,
        `Current Ratio: ${fallbackData.currentRatio}`,
        `Quick Ratio: ${fallbackData.quickRatio}`,
        `Dividend Yield: ${fallbackData.dividendYield}`,
        `Beta: ${fallbackData.beta}`,
        `Free Cash Flow: ${fallbackData.freeCashflow}`,
        `Operating Cash Flow: ${fallbackData.operatingCashflow}`,
        `Analyst Target Price: ${fallbackData.targetMeanPrice}`,
        `Analyst Recommendation: ${fallbackData.recommendationKey}`,
        `Market Cap: ${fallbackData.marketCapFormatted}`,
      ].join("\n");

      return { stockDataText: details };
    };

    const fetchNewsNode = async (state: typeof AnalysisState.State) => {
      const { getNews } = await import("@/lib/actions/finnhub.actions");
      const companyName = state.stockDataText
        ? state.stockDataText
            .split("\n")
            .find(l => l.startsWith("Company:"))
            ?.split(":")[1]?.trim() || state.symbol
        : state.symbol;
      
      const articles = await getNews([companyName]);
      
      if (!articles || articles.length === 0) {
        return { newsText: "No recent news available for this stock." };
      }
      
      const newsText = articles.slice(0, 5).map((a, i) => 
        `${i + 1}. [${a.source}] ${a.headline} (${new Date(a.datetime).toLocaleDateString()})`
      ).join("\n");
      
      return { newsText };
    };

    const fetchPeersNode = async (state: typeof AnalysisState.State) => {
      const sectorLine = state.stockDataText.split("\n").find(l => l.startsWith("Sector:"));
      const sector = sectorLine?.split(":")[1]?.trim();
      
      if (!sector || sector === "—") {
        return { peersText: "No sector peers available for comparison." };
      }
      
      const SECTOR_PEERS: Record<string, string[]> = {
        "Technology": ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS"],
        "Financial Services": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS"],
        "Consumer Defensive": ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS"],
        "Energy": ["RELIANCE.NS", "ONGC.NS", "BPCL.NS", "IOC.NS"],
        "Healthcare": ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS"],
      };
      
      const peers = SECTOR_PEERS[sector]
        ?.filter(s => s !== state.symbol)
        ?.slice(0, 3) || [];
      
      if (peers.length === 0) {
        return { peersText: "No pre-configured peers for this sector." };
      }
      
      const peerData = await Promise.all(
        peers.map(async (sym) => {
          const data = await getStocksDetails(sym);
          if (!data) return null;
          return `${data.company} (${data.symbol}): P/E ${data.peRatio}, ROE ${data.roe}, Growth ${data.earningsGrowth}, Price ${data.changeFormatted}`;
        })
      );
      
      return {
        peersText: "Sector Peers:\n" + peerData.filter(Boolean).join("\n"),
      };
    };

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const analyzeNode = async (state: typeof AnalysisState.State) => {
      if (!llm) {
        return {
          analysis: buildFallbackAnalysis(
            state.stockDataText,
            state.timeframe,
            state.riskProfile,
            "GEMINI_API_KEY missing"
          ),
        };
      }

      const prompt = [
        "You are a SEBI-registered investment analyst specializing in Indian equities (NSE/BSE).",
        "Your analysis is used by retail investors in India.",
        "Use ONLY the provided data snapshot and recent news. Never invent numbers.",
        "If a metric shows '—', explicitly state it is unavailable.",
        "All price references must use INR (₹).",
        `Investor risk profile: ${state.riskProfile}`,
        `Time horizon: ${state.timeframe}`,
        `Current Indian market context: Include any observations about Nifty 50 positioning relative to the stock's beta.`,
        "",
        "Return your analysis as a valid JSON object with exactly this structure. Do not use markdown backticks around the JSON string. Do not return anything other than the JSON object.",
        JSON.stringify({
          executiveSummary: "2-3 sentences. Include a clear BULLISH/BEARISH/NEUTRAL stance.",
          fundamentalAnalysis: {
            valuation: "P/E vs sector avg, P/B",
            profitability: "ROE, margins", 
            growth: "revenue + earnings",
            leverage: "D/E, current ratio",
            cashFlow: "cash flow quality"
          },
          technicalAnalysis: {
            trend: "price vs SMA20/50, 52W range position",
            momentum: "RSI zone",
            volatility: "volatility regime"
          },
          industryContext: "Compare this stock's valuation and growth against 2-3 named sector peers.",
          riskAssessment: {
            businessRisk: "observation (Low/Medium/High severity)",
            valuationRisk: "observation (Low/Medium/High severity)",
            macroRisk: "observation (Low/Medium/High severity)"
          },
          actionPlan: ["specific step tailored to timeframe/risk profile", "specific step...", "specific step..."],
          monitoringChecklist: ["specific trigger for review", "specific trigger...", "specific trigger..."],
          confidence: "Low | Medium | High with a one-line justification",
          bullCase: "best case scenario",
          bearCase: "worst case scenario"
        }, null, 2),
        "",
        "IMPORTANT: Be specific. Replace generic phrases like 'monitor the stock' with specific metrics like 'Review if RSI crosses above 70 or if quarterly EPS growth drops below 10%.'",
        "",
        "Recent News Headlines:",
        state.newsText,
        "",
        "Sector Peers for Comparison:",
        state.peersText,
        "",
        "Factor these news items into your Risk Assessment and Executive Summary.",
        "",
        "Stock snapshot:",
        state.stockDataText,
      ].join("\n");

      try {
        const stream = await llm.stream(prompt);
        let analysisText = "";
        
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: "stockData", data: state.stockDataText })}\n\n`)
        );

        for await (const chunk of stream) {
          const text = parseModelText(chunk);
          if (text) {
            analysisText += text;
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: "token", data: text })}\n\n`)
            );
          }
        }
        
        // Remove markdown backticks if the model added them
        analysisText = analysisText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

        if (!analysisText) {
          return {
            analysis: buildFallbackAnalysis(
              state.stockDataText,
              state.timeframe,
              state.riskProfile,
              "Empty model response"
            ),
          };
        }

        return { analysis: analysisText };
      } catch (error) {
        console.error("LLM analysis failed, falling back:", error);
        return {
          analysis: buildFallbackAnalysis(
            state.stockDataText,
            state.timeframe,
            state.riskProfile,
            "Provider error"
          ),
        };
      }
    };

    const graph = new StateGraph(AnalysisState)
      .addNode("fetch_stock", fetchStockNode)
      .addNode("fetch_news", fetchNewsNode)
      .addNode("fetch_peers", fetchPeersNode)
      .addNode("analyze", analyzeNode)
      .addEdge(START, "fetch_stock")
      .addEdge(START, "fetch_news")
      .addEdge(START, "fetch_peers")
      .addEdge("fetch_stock", "analyze")
      .addEdge("fetch_news", "analyze")
      .addEdge("fetch_peers", "analyze")
      .addEdge("analyze", END)
      .compile();

    // Run graph without awaiting here, since we return the stream immediately
    graph.invoke({
      symbol: normalizedSymbol,
      timeframe: timeframe,
      riskProfile: riskProfile,
      stockDataText: "",
      newsText: "",
      peersText: "",
      analysis: "",
    }).then(async (result) => {
      // Save result to cache
      if (result.analysis) {
        await AnalysisCacheModel.create({
          symbol: normalizedSymbol,
          timeframe,
          riskProfile,
          stockData: result.stockDataText,
          analysis: result.analysis,
        }).catch(console.error);
      }
      
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      await writer.close();
    }).catch(async (error) => {
      console.error("Graph execution failed:", error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Failed to generate analysis" })}\n\n`));
      await writer.close();
    });

    return new Response(readable, {
      headers: { 
        "Content-Type": "text/event-stream", 
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });
  } catch (error) {
    console.error("Stock analysis route error:", error);
    return NextResponse.json(
      { error: "Unable to generate stock analysis" },
      { status: 500 }
    );
  }
}
