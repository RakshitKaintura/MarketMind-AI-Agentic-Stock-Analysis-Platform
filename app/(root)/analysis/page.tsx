"use client";

import { useState, FormEvent, useEffect } from "react";
import { saveAnalysisToHistory, getAnalysisHistory } from "@/lib/actions/analysis.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import TradingViewWidget from "@/components/TradingViewWidget";
import {
  CANDLE_CHART_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import {
  ConvictionGauge,
  PriceTargetHorizon,
  SpecialistConsensus,
  RsiMeter,
  MovingAverageRibbon,
  BollingerRangeMeter,
  TrendStrengthMeter,
  ValuationBenchmarkBar,
  RiskMatrix,
  BullBearScenarios,
  FactorRadarChart,
  MovingAverageExtensionChart,
  RechartsTargetTrajectory,
} from "./AnalysisVisuals";
import { AgentSwarmFlowchart } from "./AgentSwarmFlowchart";
import {
  History,
  LayoutPanelLeft,
  TrendingUp,
  ShieldAlert,
  BarChart3,
  FileText,
  Crosshair,
  Users,
  Activity,
  ChevronRight,
  Target,
  LineChart,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  Sparkles,
  Copy,
  Printer,
  Search,
  ExternalLink,
  ShieldCheck,
  Scale,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

type AnalysisResponse = {
  symbol: string;
  timeframe: string;
  riskProfile: string;
  stockData: string;
  analysis: string;
  error?: string;
};

type AnalysisData = {
  executiveSummary?: string;
  fundamentalAnalysis?: {
    valuation?: string;
    profitability?: string;
    growth?: string;
    leverage?: string;
    cashFlow?: string;
  };
  technicalAnalysis?: {
    trend?: string;
    momentum?: string;
    volatility?: string;
  };
  industryContext?: string;
  riskAssessment?: {
    businessRisk?: string;
    valuationRisk?: string;
    macroRisk?: string;
  };
  actionPlan?: string[];
  monitoringChecklist?: string[];
  confidence?: string;
  bullCase?: string;
  bearCase?: string;
  fallbackReason?: string;
  priceTargets?: {
    shortTerm?: { price: number; timeframe?: string };
    mediumTerm?: { price: number; timeframe?: string };
    longTerm?: { price: number; timeframe?: string };
  };
  catalysts?: string[];
  engineV2?: {
    version?: string;
    specialistReports?: {
      technical?: any;
      fundamental?: any;
      sentiment?: any;
      risk?: any;
      peerComparison?: any;
    };
    deterministicScoring?: any;
    computedIndicatorCount?: number;
    indicatorsComputed?: string[];
  };
};

const defaultResult: AnalysisResponse | null = null;
const scriptUrl = "https://s3.tradingview.com/external-embedding/embed-widget-";

const POPULAR_TICKERS = [
  "RELIANCE.NS",
  "TCS.NS",
  "HDFCBANK.NS",
  "INFY.NS",
  "ICICIBANK.NS",
  "LT.NS",
  "BHARTIARTL.NS",
];

const parseSnapshot = (snapshot: string) => {
  return snapshot
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes(":"))
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return {
        label: label.trim(),
        value: rest.join(":").trim() || "-",
      };
    });
};

const getValueColorClass = (value: string) => {
  if (/(^|\s)\+\d|\+\d|\+\s*\d/.test(value) || /\bup\b/i.test(value)) {
    return "text-[#0FEDBE]";
  }
  if (/(^|\s)-\d|-\d/.test(value) || /\bdown\b/i.test(value)) {
    return "text-[#FF495B]";
  }
  return "text-zinc-200";
};

const parseNumericValue = (value?: string) => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9+-.]/g, "");
  if (!cleaned || cleaned === "+" || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildMetricMap = (rows: Array<{ label: string; value: string }>) => {
  return Object.fromEntries(rows.map((row) => [row.label.toLowerCase(), row.value]));
};

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

const parsePartialJson = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    let fixedStr = str.trim();
    if (fixedStr.endsWith(",")) fixedStr = fixedStr.slice(0, -1);

    let openBraces = 0,
      openBrackets = 0,
      inString = false;
    for (let i = 0; i < fixedStr.length; i++) {
      if (fixedStr[i] === '"' && fixedStr[i - 1] !== "\\") inString = !inString;
      if (!inString) {
        if (fixedStr[i] === "{") openBraces++;
        if (fixedStr[i] === "}") openBraces--;
        if (fixedStr[i] === "[") openBrackets++;
        if (fixedStr[i] === "]") openBrackets--;
      }
    }
    if (inString) fixedStr += '"';
    while (openBrackets > 0) {
      fixedStr += "]";
      openBrackets--;
    }
    while (openBraces > 0) {
      fixedStr += "}";
      openBraces--;
    }

    try {
      return JSON.parse(fixedStr);
    } catch {
      return null;
    }
  }
};

function AnalysisResultView({
  result,
  error,
  loading,
  symbol,
}: {
  result: AnalysisResponse | null;
  error: string;
  loading: boolean;
  symbol: string;
}) {
  const [copied, setCopied] = useState(false);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300 shadow-xl backdrop-blur-md animate-in fade-in">
        <div className="flex items-center gap-2 mb-2 font-bold text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <span>Institutional Pipeline Exception</span>
        </div>
        <p className="leading-relaxed">{error}</p>
      </div>
    );
  }

  if (loading) {
    return <AgentSwarmFlowchart symbol={symbol} />;
  }

  if (!result) {
    return (
      <div className="min-h-[640px] flex flex-col items-center justify-center rounded-xl border border-[#27272A] bg-[#0A0A0A] p-8 text-center shadow-xl">
        <div className="p-4 rounded-full bg-[#111111] border border-[#27272A] mb-4">
          <Crosshair className="w-8 h-8 text-[#71717A]" />
        </div>
        <h4 className="text-sm font-bold text-white tracking-wide">Terminal Ready</h4>
        <p className="text-xs text-[#71717A] tracking-wide mt-1 max-w-sm">
          Select an asset ticker and execution horizon on the command console above to deploy the AI agentic analysis swarm.
        </p>
      </div>
    );
  }

  const snapshotRows = result.stockData ? parseSnapshot(result.stockData) : [];
  let analysisData: AnalysisData | null = null;
  if (result.analysis) {
    analysisData = parsePartialJson(result.analysis);
  }

  const metricMap = buildMetricMap(snapshotRows);
  const currentPrice = parseNumericValue(metricMap["current price"]);
  const avg50 = parseNumericValue(metricMap["50d avg"] || metricMap["sma 50"]);
  const avg200 = parseNumericValue(metricMap["200d avg"] || metricMap["sma 200"]);
  const sma20 = parseNumericValue(metricMap["sma 20"]);
  const peRatio = parseNumericValue(metricMap["p/e ratio"]);
  const pbRatio = parseNumericValue(metricMap["p/b ratio"]);
  const roe = parseNumericValue(metricMap["roe"]);
  const rsi = parseNumericValue(metricMap["rsi (14)"]);
  const adx = parseNumericValue(metricMap["adx"]);
  const revenueGrowth = parseNumericValue(metricMap["revenue growth"]);
  const earningsGrowth = parseNumericValue(metricMap["earnings growth"]);
  const debtToEquity = parseNumericValue(metricMap["debt to equity"]);
  const change = parseNumericValue(metricMap["change"]);
  const analystTarget = parseNumericValue(metricMap["analyst target price"]);
  const supertrend = metricMap["supertrend"];
  const macdSignal = metricMap["macd signal"];
  const bollingerBandsRaw = metricMap["bollinger bands"];

  const range52Match = metricMap["52w range"]?.match(/₹?([0-9.]+)\s*-\s*₹?([0-9.]+)/);
  const fiftyTwoWeekLow = range52Match ? parseFloat(range52Match[1]) : null;
  const fiftyTwoWeekHigh = range52Match ? parseFloat(range52Match[2]) : null;

  const SECTOR_PE_BENCHMARKS: Record<string, { low: number; fair: number; high: number }> = {
    Technology: { low: 20, fair: 35, high: 55 },
    "Financial Services": { low: 10, fair: 18, high: 28 },
    "Consumer Defensive": { low: 25, fair: 40, high: 60 },
    Healthcare: { low: 20, fair: 30, high: 50 },
    Energy: { low: 8, fair: 15, high: 25 },
    Industrials: { low: 15, fair: 25, high: 40 },
    default: { low: 15, fair: 25, high: 45 },
  };

  const sector = metricMap["sector"] || "default";
  const benchmark = SECTOR_PE_BENCHMARKS[sector] || SECTOR_PE_BENCHMARKS["default"];

  let valuationScore = 50;
  if (peRatio !== null) {
    if (peRatio <= benchmark.low) valuationScore += 28;
    else if (peRatio <= benchmark.fair) valuationScore += 16;
    else if (peRatio <= benchmark.high) valuationScore += 0;
    else valuationScore -= 24;

    if (peRatio > benchmark.high && earningsGrowth !== null) {
      if (earningsGrowth >= 25) valuationScore += 14;
      else if (earningsGrowth >= 15) valuationScore += 8;
      else if (earningsGrowth >= 8) valuationScore += 4;
    }
  }

  let momentumScore = 50;
  if (rsi !== null) {
    if (rsi >= 40 && rsi <= 60) momentumScore += 20;
    else if (rsi > 30 && rsi < 40) momentumScore += 12;
    else if (rsi > 70) momentumScore -= 22;
    else if (rsi > 60) momentumScore -= 10;
  }
  if (change !== null) {
    if (change > 2.5) momentumScore -= 8;
    if (change < -2.5) momentumScore += 6;
  }

  let trendScore = 50;
  if (currentPrice !== null && avg50 !== null) {
    trendScore += currentPrice >= avg50 ? 12 : -6;
  }
  if (currentPrice !== null && avg200 !== null) {
    trendScore += currentPrice >= avg200 ? 10 : -8;
  }

  let fundamentalsScore = 50;
  if (revenueGrowth !== null) {
    if (revenueGrowth >= 12) fundamentalsScore += 14;
    else if (revenueGrowth > 0) fundamentalsScore += 8;
    else if (revenueGrowth <= -5) fundamentalsScore -= 14;
    else fundamentalsScore -= 8;
  }
  if (earningsGrowth !== null) {
    if (earningsGrowth >= 25) fundamentalsScore += 24;
    else if (earningsGrowth >= 15) fundamentalsScore += 18;
    else if (earningsGrowth >= 8) fundamentalsScore += 12;
    else if (earningsGrowth > 0) fundamentalsScore += 6;
    else if (earningsGrowth <= -10) fundamentalsScore -= 20;
    else fundamentalsScore -= 8;
  }
  if (debtToEquity !== null) {
    if (debtToEquity <= 1) fundamentalsScore += 12;
    else if (debtToEquity <= 2) fundamentalsScore += 4;
    else if (debtToEquity > 3) fundamentalsScore -= 12;
  }

  valuationScore = clampScore(valuationScore);
  momentumScore = clampScore(momentumScore);
  trendScore = clampScore(trendScore);
  fundamentalsScore = clampScore(fundamentalsScore);

  const serverScore = analysisData?.engineV2?.deterministicScoring?.overallScore;
  const overallConfidence =
    serverScore !== undefined
      ? serverScore
      : clampScore(
          valuationScore * 0.25 +
            momentumScore * 0.25 +
            trendScore * 0.2 +
            fundamentalsScore * 0.3
        );

  let buyThreshold = 70;
  let accumulateThreshold = 55;

  if (peRatio !== null) {
    if (peRatio > benchmark.high + 5) {
      buyThreshold += 5;
      accumulateThreshold += 3;
    }
    if (peRatio > benchmark.high + 20) {
      buyThreshold += 5;
      accumulateThreshold += 4;
    }
  }
  if (earningsGrowth !== null) {
    if (earningsGrowth >= 15) {
      buyThreshold -= 4;
      accumulateThreshold -= 3;
    }
    if (earningsGrowth >= 25) {
      buyThreshold -= 3;
      accumulateThreshold -= 2;
    }
  }

  buyThreshold = Math.max(62, buyThreshold);
  accumulateThreshold = Math.max(50, Math.min(buyThreshold - 8, accumulateThreshold));

  const serverDecision = analysisData?.engineV2?.deterministicScoring?.decision;
  const decision =
    serverDecision ||
    (overallConfidence >= buyThreshold
      ? "Buy Now (Staggered Entries)"
      : overallConfidence >= accumulateThreshold
      ? "Accumulate Slowly"
      : "Wait For Better Price");

  const thresholdAdjustments: string[] = [];
  if (peRatio !== null && peRatio > benchmark.high + 5)
    thresholdAdjustments.push("Higher valuation multiple raised entry threshold");
  if (peRatio !== null && peRatio > benchmark.high + 20)
    thresholdAdjustments.push("Elevated P/E demands wider margin of safety");
  if (earningsGrowth !== null && earningsGrowth >= 15)
    thresholdAdjustments.push("Strong earnings momentum lowered timing hurdle");
  if (earningsGrowth !== null && earningsGrowth >= 25)
    thresholdAdjustments.push("Exceptional earnings expansion added DCA flexibility");

  const supportLevel =
    analysisData?.engineV2?.specialistReports?.technical?.supportLevel ||
    (currentPrice ? currentPrice * 0.94 : null);

  const copyBrief = () => {
    const text = `MarketMind Institutional Brief: ${result.symbol}
Conviction Score: ${overallConfidence}/100 | Stance: ${decision}
Current Price: ₹${currentPrice?.toFixed(2) || "N/A"}
Support Floor: ₹${supportLevel?.toFixed(2) || "N/A"}
Summary: ${analysisData?.executiveSummary || "N/A"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Institutional brief copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-6 w-full animate-in fade-in duration-500">
      {/* 1. INSTITUTIONAL ASSET HEADER BAR */}
      <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-lg bg-[#111111] border border-[#27272A] flex items-center justify-center font-black text-lg text-white font-mono shadow-inner">
            {result.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-mono tracking-tight">{result.symbol}</h2>
              <Badge variant="outline" className="text-[10px] font-mono border-[#27272A] text-[#71717A]">
                {metricMap["exchange"] || "NSE/BSE"}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {metricMap["sector"] || "Equity"}
              </Badge>
            </div>
            <p className="text-xs text-[#71717A] mt-0.5 font-medium">
              {metricMap["company"] || result.symbol} • {metricMap["industry"] || "Large Cap"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {currentPrice && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#71717A] block">
                Last Traded Price
              </span>
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-2xl font-bold font-mono text-white">
                  ₹{currentPrice.toFixed(2)}
                </span>
                {change !== null && (
                  <span
                    className={`text-xs font-mono font-bold flex items-center ${
                      change >= 0 ? "text-[#0FEDBE]" : "text-[#FF495B]"
                    }`}
                  >
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pl-4 border-l border-[#27272A]">
            <button
              onClick={copyBrief}
              title="Copy Institutional Brief"
              className="p-2 rounded-lg border border-[#27272A] bg-[#111111] text-[#71717A] hover:text-white hover:border-[#3F3F46] transition-all"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TABBED INSTITUTIONAL WORKSPACE */}
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl p-1 shadow-lg">
          <TabsTrigger
            value="overview"
            className="rounded-lg py-2 text-xs font-semibold transition-all data-[state=active]:bg-[#161616] data-[state=active]:text-white text-[#71717A]"
          >
            <Activity className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#0FEDBE]" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="technicals"
            className="rounded-lg py-2 text-xs font-semibold transition-all data-[state=active]:bg-[#161616] data-[state=active]:text-white text-[#71717A]"
          >
            <LineChart className="w-3.5 h-3.5 mr-1.5 shrink-0 text-white" />
            Technicals & Chart
          </TabsTrigger>
          <TabsTrigger
            value="fundamentals"
            className="rounded-lg py-2 text-xs font-semibold transition-all data-[state=active]:bg-[#161616] data-[state=active]:text-white text-[#71717A]"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1.5 shrink-0 text-white" />
            Fundamentals
          </TabsTrigger>
          <TabsTrigger
            value="risk"
            className="rounded-lg py-2 text-xs font-semibold transition-all data-[state=active]:bg-[#161616] data-[state=active]:text-white text-[#71717A]"
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#FF495B]" />
            Risk & Catalysts
          </TabsTrigger>
          <TabsTrigger
            value="snapshot"
            className="rounded-lg py-2 text-xs font-semibold transition-all data-[state=active]:bg-[#161616] data-[state=active]:text-white text-[#71717A]"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5 shrink-0 text-white" />
            20+ Indicators Ledger
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {/* ======================================================== */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* Institutional Conviction Gauge */}
          <ConvictionGauge
            score={overallConfidence}
            decision={decision}
            buyThreshold={buyThreshold}
            accumulateThreshold={accumulateThreshold}
            symbol={result.symbol}
            thresholdAdjustments={thresholdAdjustments}
          />

          {/* Recharts Quant Radar & Target Ladder side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FactorRadarChart
              symbol={result.symbol}
              valuationScore={valuationScore}
              momentumScore={momentumScore}
              trendScore={trendScore}
              fundamentalsScore={fundamentalsScore}
              debtToEquity={debtToEquity}
              sentimentScore={analysisData?.engineV2?.specialistReports?.sentiment?.score ?? 65}
            />
            <RechartsTargetTrajectory
              currentPrice={currentPrice || 100}
              supportLevel={supportLevel}
              shortTermPrice={analysisData?.priceTargets?.shortTerm?.price}
              mediumTermPrice={analysisData?.priceTargets?.mediumTerm?.price || analystTarget || undefined}
              longTermPrice={analysisData?.priceTargets?.longTerm?.price}
            />
          </div>

          {/* Price Target Horizon Roadmap */}
          <PriceTargetHorizon
            currentPrice={currentPrice}
            supportLevel={supportLevel}
            analystTarget={analystTarget}
            targets={analysisData?.priceTargets}
          />

          {/* Voting Committee Consensus Roster */}
          <SpecialistConsensus
            engineV2={analysisData?.engineV2}
            valuationScore={valuationScore}
            momentumScore={momentumScore}
            trendScore={trendScore}
            fundamentalsScore={fundamentalsScore}
          />

          {/* Executive Summary Narrative */}
          {analysisData?.executiveSummary && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur-xl shadow-xl space-y-2.5">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
                <Target className="w-3.5 h-3.5 text-[#0FEDBE]" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                  Investment Committee Executive Synthesis
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-300 font-sans">{analysisData.executiveSummary}</p>
            </div>
          )}

          {/* Bull vs Bear Scenario Asymmetry */}
          <BullBearScenarios
            bullCase={analysisData?.bullCase}
            bearCase={analysisData?.bearCase}
          />

          {/* Actionable Directives & Invalidation */}
          {(analysisData?.actionPlan || analysisData?.monitoringChecklist) && (
            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
                <Crosshair className="w-3.5 h-3.5 text-white" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Execution Directives & Invalidation Triggers
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analysisData?.actionPlan && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                      Order Execution Guidance
                    </p>
                    <div className="space-y-2">
                      {analysisData.actionPlan.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#161616] border border-[#27272A] text-[9px] font-bold text-white mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs leading-relaxed text-[#A1A1AA]">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisData?.monitoringChecklist && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF495B]">
                      Core Invalidation Criteria
                    </p>
                    <div className="space-y-2">
                      {analysisData.monitoringChecklist.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#FF495B] mt-0.5" />
                          <p className="text-xs leading-relaxed text-zinc-400 italic">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: TECHNICALS & LIVE CHART */}
        {/* ======================================================== */}
        <TabsContent value="technicals" className="space-y-6 outline-none">
          {/* Recharts Moving Average Extension Bar Chart */}
          <MovingAverageExtensionChart
            currentPrice={currentPrice}
            sma20={sma20}
            sma50={avg50}
            sma200={avg200}
            fiftyTwoWeekHigh={fiftyTwoWeekHigh}
            fiftyTwoWeekLow={fiftyTwoWeekLow}
          />

          {/* Technical Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RsiMeter rsi={rsi} />
            <TrendStrengthMeter
              adx={adx}
              supertrend={supertrend}
              macdSignal={macdSignal}
            />
          </div>

          <MovingAverageRibbon
            currentPrice={currentPrice}
            sma20={sma20}
            sma50={avg50}
            sma200={avg200}
          />

          <BollingerRangeMeter
            currentPrice={currentPrice}
            rawString={bollingerBandsRaw}
          />

          {/* Interactive TradingView Candlestick Chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <LineChart className="w-3.5 h-3.5 text-[#0FEDBE]" />
                  Live Candlestick Telemetry & Drawing Terminal
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Real-time ticks, volume distribution, oscillators, and trend overlays
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] text-zinc-400 border-zinc-700">
                TradingView
              </Badge>
            </div>

            <div className="rounded-lg overflow-hidden border border-zinc-800 bg-black">
              <TradingViewWidget
                key={`${result.symbol}-candle-chart`}
                scriptUrl={`${scriptUrl}advanced-chart.js`}
                config={CANDLE_CHART_WIDGET_CONFIG(result.symbol)}
                height={540}
              />
            </div>
          </div>

          {/* TradingView Technical Analysis Speedometer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-white" />
                Oscillator & Moving Average Gauge
              </h3>
              <div className="rounded-lg overflow-hidden border border-[#27272A] bg-black/40">
                <TradingViewWidget
                  key={`${result.symbol}-tv-gauge`}
                  scriptUrl={`${scriptUrl}technical-analysis.js`}
                  config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(result.symbol)}
                  height={380}
                />
              </div>
            </div>

            {analysisData?.technicalAnalysis && (
              <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                    Quantitative Technical Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {Object.entries(analysisData.technicalAnalysis).map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#A1A1AA] block mb-1">
                          {k}
                        </span>
                        <p className="text-xs text-[#A1A1AA] leading-relaxed">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: FUNDAMENTALS & VALUATION */}
        {/* ======================================================== */}
        <TabsContent value="fundamentals" className="space-y-6 outline-none">
          {/* Sector Valuation Scorecard */}
          <ValuationBenchmarkBar peRatio={peRatio} sector={sector} />

          {/* Financial Health Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-1 hover:border-[#3F3F46] transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                Return on Equity (ROE)
              </span>
              <p className="text-xl font-bold font-mono text-white">
                {roe !== null ? `${roe.toFixed(2)}%` : "—"}
              </p>
              <span className="text-[10px] text-[#A1A1AA]">Capital Efficiency</span>
            </div>

            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-1 hover:border-[#3F3F46] transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                Debt to Equity
              </span>
              <p className="text-xl font-bold font-mono text-white">
                {debtToEquity !== null ? debtToEquity.toFixed(2) : "—"}
              </p>
              <span className="text-[10px] text-[#A1A1AA]">
                {debtToEquity && debtToEquity <= 1 ? "Conservative Solvency" : "Moderate Leverage"}
              </span>
            </div>

            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-1 hover:border-[#3F3F46] transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                Revenue Growth YoY
              </span>
              <p className="text-xl font-bold font-mono text-white">
                {revenueGrowth !== null ? `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%` : "—"}
              </p>
              <span className="text-[10px] text-[#A1A1AA]">Top-Line Expansion</span>
            </div>

            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-1 hover:border-[#3F3F46] transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                Earnings Growth YoY
              </span>
              <p className="text-xl font-bold font-mono text-white">
                {earningsGrowth !== null ? `${earningsGrowth > 0 ? "+" : ""}${earningsGrowth.toFixed(1)}%` : "—"}
              </p>
              <span className="text-[10px] text-[#A1A1AA]">Net Margin Velocity</span>
            </div>
          </div>

          {/* Interactive TradingView Profile & Financials */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-white" />
                Corporate Structure & Executive Roster
              </h3>
              <div className="rounded-lg overflow-hidden border border-[#27272A] bg-black/40">
                <TradingViewWidget
                  key={`${result.symbol}-profile`}
                  scriptUrl={`${scriptUrl}symbol-profile.js`}
                  config={COMPANY_PROFILE_WIDGET_CONFIG(result.symbol)}
                  height={440}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
                Audited Financial Statements
              </h3>
              <div className="rounded-lg overflow-hidden border border-[#27272A] bg-black/40">
                <TradingViewWidget
                  key={`${result.symbol}-financials`}
                  scriptUrl={`${scriptUrl}financials.js`}
                  config={COMPANY_FINANCIALS_WIDGET_CONFIG(result.symbol)}
                  height={440}
                />
              </div>
            </div>
          </div>

          {analysisData?.fundamentalAnalysis && (
            <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-white" />
                Fundamental Equity Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(analysisData.fundamentalAnalysis).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white block mb-1">
                      {k}
                    </span>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: RISK ASSESSMENT & CATALYSTS */}
        {/* ======================================================== */}
        <TabsContent value="risk" className="space-y-6 outline-none">
          <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              Institutional 3-Pillar Risk Audit
            </h3>
            <RiskMatrix
              businessRisk={analysisData?.riskAssessment?.businessRisk}
              valuationRisk={analysisData?.riskAssessment?.valuationRisk}
              macroRisk={analysisData?.riskAssessment?.macroRisk}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysisData?.catalysts && (
              <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-white" />
                  Upcoming Catalysts & Forward Drivers
                </h3>
                <div className="space-y-2">
                  {analysisData.catalysts.map((cat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0A0A0A] border border-[#27272A]">
                      <Sparkles className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                      <p className="text-xs text-[#A1A1AA] leading-relaxed">{cat}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisData?.industryContext && (
              <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-white" />
                  Sector Competitive Positioning
                </h3>
                <div className="p-4 rounded-lg bg-[#0A0A0A] border border-[#27272A]">
                  <p className="text-xs leading-relaxed text-[#A1A1AA]">{analysisData.industryContext}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 5: 20+ QUANTITATIVE INDICATOR LEDGER */}
        {/* ======================================================== */}
        <TabsContent value="snapshot" className="space-y-6 outline-none">
          <div className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-white" />
                  Engine V2 Indicator & Market Snapshot Ledger
                </h3>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Over 20 computed mathematical metrics ingested and evaluated by our agent swarm
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-white border-[#27272A] bg-[#161616]">
                {snapshotRows.length} Points Verified
              </Badge>
            </div>

            {snapshotRows.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {snapshotRows.map((row) => (
                  <div
                    key={row.label}
                    className="group rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3 hover:bg-zinc-900/80 transition-colors"
                  >
                    <p className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1 truncate" title={row.label}>
                      {row.label}
                    </p>
                    <p
                      className={`text-sm font-mono font-bold truncate ${getValueColorClass(row.value)}`}
                      title={row.value}
                    >
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-mono flex items-center justify-center min-h-[100px]">
                No snapshot data loaded.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default function AnalysisPage() {
  const [isCompare, setIsCompare] = useState(false);
  const [symbol1, setSymbol1] = useState("RELIANCE.NS");
  const [symbol2, setSymbol2] = useState("TCS.NS");
  const [timeframe, setTimeframe] = useState("medium");
  const [riskProfile, setRiskProfile] = useState("balanced");

  const [loading, setLoading] = useState(false);
  const [result1, setResult1] = useState<AnalysisResponse | null>(defaultResult);
  const [result2, setResult2] = useState<AnalysisResponse | null>(defaultResult);
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  useEffect(() => {
    if (historyOpen) {
      getAnalysisHistory().then((res) => {
        if (res.success) setHistoryList(res.data);
      });
    }
  }, [historyOpen]);

  const saveToHistory = async (result: AnalysisResponse) => {
    if (!result || !result.analysis) return;
    const analysisData = parsePartialJson(result.analysis);
    if (!analysisData) return;

    const snapshotRows = parseSnapshot(result.stockData);
    let score = analysisData?.engineV2?.deterministicScoring?.overallScore || 50;

    await saveAnalysisToHistory({
      symbol: result.symbol,
      timeframe: result.timeframe,
      riskProfile: result.riskProfile,
      analysis: result.analysis,
      confidenceScore: score,
      decision: analysisData?.engineV2?.deterministicScoring?.decision || "Institutional Record",
    });
  };

  const processStream = async (
    symbol: string,
    setResult: React.Dispatch<React.SetStateAction<AnalysisResponse | null>>,
    setError: React.Dispatch<React.SetStateAction<string>>
  ) => {
    try {
      const response = await fetch("/api/stock-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe, riskProfile, forceRefresh: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate analysis");
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as AnalysisResponse;
        setResult(data);
        saveToHistory(data);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader stream available");
      const decoder = new TextDecoder();

      let analysisText = "";
      let stockDataText = "";

      setResult({
        symbol: symbol.toUpperCase(),
        timeframe,
        riskProfile,
        stockData: "",
        analysis: "",
      });

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "stockData") {
                stockDataText = data.data;
                setResult((prev) => (prev ? { ...prev, stockData: stockDataText } : prev));
              } else if (data.type === "token") {
                analysisText += data.data;
                setResult((prev) => (prev ? { ...prev, analysis: analysisText } : prev));
              } else if (data.type === "error") {
                setError(data.error);
                break;
              } else if (data.type === "done") {
                break;
              }
            } catch (e) {}
          }
        }
      }

      saveToHistory({
        symbol: symbol.toUpperCase(),
        timeframe,
        riskProfile,
        stockData: stockDataText,
        analysis: analysisText,
      });
    } catch (e) {
      setError("Unable to contact analysis server");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult1(null);
    setResult2(null);
    setError1("");
    setError2("");

    const promises = [processStream(symbol1, setResult1, setError1)];
    if (isCompare && symbol2) {
      promises.push(processStream(symbol2, setResult2, setError2));
    }

    await Promise.all(promises);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#27272A] selection:text-white relative overflow-hidden pb-12">
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-8 relative z-10">
        {/* Top Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272A] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-white px-2 py-0.5 rounded bg-[#161616] border border-[#27272A]">
                Institutional Swarm V2
              </span>
              <span className="text-[10px] text-[#71717A] font-mono">• 7 Specialized Agent Nodes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Market Intelligence Terminal
            </h1>
            <p className="text-[#71717A] text-xs mt-1 font-medium tracking-wide">
              Quantitative multi-factor synthesis, econometric valuation models & real-time telemetry
            </p>
          </div>

          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#111111] px-4 py-2 text-xs font-semibold text-white transition-all hover:border-[#3F3F46] hover:bg-[#161616]">
                <History className="w-3.5 h-3.5 text-white" />
                Historical Ledger
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-[#111111] border-[#27272A] text-white shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold font-mono">Institutional Ledger</DialogTitle>
                <DialogDescription className="text-xs text-[#71717A]">
                  Audit trail of historically synthesized market calls and confidence scores.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {historyList.length === 0 ? (
                  <div className="text-xs text-[#71717A] italic flex items-center justify-center p-8 border border-[#27272A] rounded-lg bg-[#0A0A0A]">
                    No historical calls recorded.
                  </div>
                ) : (
                  historyList.map((h, i) => (
                    <div key={i} className="group rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3.5 transition-all hover:bg-[#161616] hover:border-[#3F3F46]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-base font-mono">{h.symbol}</h4>
                        <span className="text-[10px] font-mono text-[#71717A] px-2 py-0.5 bg-[#111111] rounded border border-[#27272A]">
                          {new Date(h.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded bg-[#111111] border border-[#27272A] flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-[#0FEDBE]" />
                          <span className="text-xs font-bold font-mono text-white">{h.confidenceScore}/100</span>
                        </div>
                        <p className="text-xs font-medium text-[#A1A1AA] line-clamp-1 flex-1">
                          {h.decision}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* TOP COMMAND CONSOLE (FORM AS FULL-WIDTH HEADER) */}
        <div className="mb-8 rounded-xl border border-[#27272A] bg-[#0A0A0A] p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <SlidersHorizontal className="w-4 h-4 text-[#A1A1AA]" />
                <span>Command & Execution Console</span>
              </div>
              <span className="hidden sm:inline text-[#27272A]">•</span>
              {/* Quick Liquid Tickers */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#71717A] uppercase">Quick Tickers:</span>
                {POPULAR_TICKERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSymbol1(t)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      symbol1.toUpperCase() === t
                        ? "bg-white text-black font-bold border-white"
                        : "bg-[#111111] border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#3F3F46]"
                    }`}
                  >
                    {t.replace(".NS", "")}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCompare(!isCompare)}
              className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-all flex items-center gap-1.5 font-bold shrink-0 ${
                isCompare
                  ? "bg-white text-black shadow-sm"
                  : "bg-[#111111] text-[#A1A1AA] hover:bg-[#161616] hover:text-white border border-[#27272A] hover:border-[#3F3F46]"
              }`}
            >
              <LayoutPanelLeft className="w-3 h-3" />
              {isCompare ? "Peer Comparison: Active" : "Compare Peer: Off"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                Primary Asset Ticker
              </label>
              <input
                value={symbol1}
                onChange={(event) => setSymbol1(event.target.value)}
                placeholder="e.g. RELIANCE.NS"
                className="w-full rounded-lg border border-[#27272A] bg-[#111111] px-3.5 py-2.5 text-xs font-mono font-medium text-white placeholder-[#71717A] outline-none transition-all focus:border-[#3F3F46]"
              />
            </div>

            {isCompare && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                  Secondary Peer Ticker
                </label>
                <input
                  value={symbol2}
                  onChange={(event) => setSymbol2(event.target.value)}
                  placeholder="e.g. TCS.NS"
                  className="w-full rounded-lg border border-[#27272A] bg-[#111111] px-3.5 py-2.5 text-xs font-mono font-medium text-white placeholder-[#71717A] outline-none transition-all focus:border-[#3F3F46]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                Execution Horizon
              </label>
              <select
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
                className="w-full rounded-lg border border-[#27272A] bg-[#111111] px-3.5 py-2.5 text-xs font-medium text-white outline-none transition-all focus:border-[#3F3F46] appearance-none cursor-pointer"
              >
                <option value="short">Tactical (1-3 months)</option>
                <option value="medium">Intermediate (3-12 months)</option>
                <option value="long">Secular (1-5 years)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                Risk Tolerance Profile
              </label>
              <select
                value={riskProfile}
                onChange={(event) => setRiskProfile(event.target.value)}
                className="w-full rounded-lg border border-[#27272A] bg-[#111111] px-3.5 py-2.5 text-xs font-medium text-white outline-none transition-all focus:border-[#3F3F46] appearance-none cursor-pointer"
              >
                <option value="conservative">Capital Preservation (Low Beta)</option>
                <option value="balanced">Balanced (Core Growth)</option>
                <option value="aggressive">Alpha Expansion (High Beta)</option>
              </select>
            </div>

            <div className={`${!isCompare ? "xl:col-span-1" : ""}`}>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-white hover:bg-[#E5E5E5] px-5 py-2.5 text-xs font-bold text-black transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 font-mono">
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Executing Swarm...
                    </>
                  ) : (
                    <>{isCompare ? "Launch Comparison" : "AI Analysis"}</>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* ALL ANALYSIS BELOW IT (FULL WIDTH) */}
        <div className={isCompare ? "grid xl:grid-cols-2 gap-8 w-full" : "w-full"}>
          <AnalysisResultView result={result1} error={error1} loading={loading} symbol={symbol1} />
          {isCompare && <AnalysisResultView result={result2} error={error2} loading={loading} symbol={symbol2} />}
        </div>
      </div>
    </div>
  );
}
