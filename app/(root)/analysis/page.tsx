"use client";

import { useState, FormEvent, useEffect } from "react";
import { saveAnalysisToHistory, getAnalysisHistory } from "@/lib/actions/analysis.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { History, LayoutPanelLeft, TrendingUp, ShieldAlert, BarChart3, FileText, Crosshair, Users, Activity, ChevronRight, Target } from "lucide-react";

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
};

const defaultResult: AnalysisResponse | null = null;

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

const getSectionPriority = (title: string) => {
  const normalized = title.toLowerCase();
  if (normalized.includes("risk") || normalized.includes("action") || normalized.includes("bear") || normalized.includes("bull")) {
    return { label: "High Priority", className: "text-[#FF8A4C] bg-[#FF8A4C]/10 border-[#FF8A4C]/20" };
  }
  if (normalized.includes("executive") || normalized.includes("confidence")) {
    return { label: "Core", className: "text-[#0FEDBE] bg-[#0FEDBE]/10 border-[#0FEDBE]/20" };
  }
  return { label: "Context", className: "text-[#FDD458] bg-[#FDD458]/10 border-[#FDD458]/20" };
};

const getValueColorClass = (value: string) => {
  if (/(^|\s)\+\d|\+\d|\+\s*\d/.test(value) || /\bup\b/i.test(value)) {
    return "text-[#0FEDBE]";
  }
  if (/(^|\s)-\d|-\d/.test(value) || /\bdown\b/i.test(value)) {
    return "text-[#FF495B]";
  }
  return "text-white/90";
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
    if (fixedStr.endsWith(',')) fixedStr = fixedStr.slice(0, -1);
    
    let openBraces = 0, openBrackets = 0, inString = false;
    for (let i = 0; i < fixedStr.length; i++) {
      if (fixedStr[i] === '"' && fixedStr[i-1] !== '\\') inString = !inString;
      if (!inString) {
        if (fixedStr[i] === '{') openBraces++;
        if (fixedStr[i] === '}') openBraces--;
        if (fixedStr[i] === '[') openBrackets++;
        if (fixedStr[i] === ']') openBrackets--;
      }
    }
    if (inString) fixedStr += '"';
    while (openBrackets > 0) { fixedStr += ']'; openBrackets--; }
    while (openBraces > 0) { fixedStr += '}'; openBraces--; }
    
    try {
      return JSON.parse(fixedStr);
    } catch {
      return null;
    }
  }
};

function AnalysisResultView({ result, error, loading }: { result: AnalysisResponse | null; error: string; loading: boolean }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300 shadow-2xl backdrop-blur-md animate-in fade-in">
        {error}
      </div>
    );
  }
  
  if (!result) {
    if (loading) {
      return (
        <div className="min-h-[600px] flex flex-col items-center justify-center rounded-2xl border border-[#d4a017]/20 bg-[#d4a017]/5 p-8 text-center backdrop-blur-md animate-in fade-in shadow-2xl">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-[#d4a017]/30 animate-pulse" />
            <Activity className="w-12 h-12 text-[#d4a017] relative z-10 animate-bounce" />
          </div>
          <h3 className="mt-6 text-lg font-bold text-white tracking-wide">Synthesizing Market Intelligence</h3>
          <p className="mt-2 text-sm text-white/50 animate-pulse max-w-sm">
            Fetching live quotes, calculating technical indicators, parsing recent news, and analyzing peer context...
          </p>
        </div>
      );
    }
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-8 text-center backdrop-blur-md shadow-2xl">
        <div className="p-4 rounded-full bg-white/5 mb-4">
          <Crosshair className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-sm font-medium text-white/40 tracking-wide">
          Ready to deploy AI analysis. Adjust parameters and initialize.
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
  const avg50 = parseNumericValue(metricMap["50d avg"]);
  const avg200 = parseNumericValue(metricMap["200d avg"]);
  const peRatio = parseNumericValue(metricMap["p/e ratio"]);
  const rsi = parseNumericValue(metricMap["rsi (14)"]);
  const revenueGrowth = parseNumericValue(metricMap["revenue growth"]);
  const earningsGrowth = parseNumericValue(metricMap["earnings growth"]);
  const debtToEquity = parseNumericValue(metricMap["debt to equity"]);
  const change = parseNumericValue(metricMap["change"]);

  const SECTOR_PE_BENCHMARKS: Record<string, { low: number; fair: number; high: number }> = {
    "Technology":          { low: 20, fair: 35, high: 55 },
    "Financial Services":  { low: 10, fair: 18, high: 28 },
    "Consumer Defensive":  { low: 25, fair: 40, high: 60 },
    "Healthcare":          { low: 20, fair: 30, high: 50 },
    "Energy":              { low: 8,  fair: 15, high: 25 },
    "Industrials":         { low: 15, fair: 25, high: 40 },
    "default":             { low: 15, fair: 25, high: 45 },
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
    else fundamentalsScore -= 12;
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

  const overallConfidence = clampScore(
    valuationScore * 0.25 + momentumScore * 0.25 + trendScore * 0.2 + fundamentalsScore * 0.3
  );

  let buyThreshold = 70;
  let accumulateThreshold = 55;

  if (peRatio !== null) {
    if (peRatio > benchmark.high + 5) { buyThreshold += 5; accumulateThreshold += 3; }
    if (peRatio > benchmark.high + 20) { buyThreshold += 5; accumulateThreshold += 4; }
  }
  if (earningsGrowth !== null) {
    if (earningsGrowth >= 15) { buyThreshold -= 4; accumulateThreshold -= 3; }
    if (earningsGrowth >= 25) { buyThreshold -= 3; accumulateThreshold -= 2; }
  }

  buyThreshold = Math.max(62, buyThreshold);
  accumulateThreshold = Math.max(50, Math.min(buyThreshold - 8, accumulateThreshold));

  const decision =
    overallConfidence >= buyThreshold
      ? "Buy Now (Staggered Entries)"
      : overallConfidence >= accumulateThreshold
      ? "Accumulate Slowly"
      : "Wait For Better Price";

  const decisionClass =
    overallConfidence >= buyThreshold ? "text-[#0FEDBE]"
      : overallConfidence >= accumulateThreshold ? "text-[#FDD458]"
      : "text-[#FF495B]";

  const thresholdAdjustments: string[] = [];
  if (peRatio !== null && peRatio > benchmark.high + 5) thresholdAdjustments.push("Higher valuation raised entry thresholds");
  if (peRatio !== null && peRatio > benchmark.high + 20) thresholdAdjustments.push("Very high P/E requires extra caution");
  if (earningsGrowth !== null && earningsGrowth >= 15) thresholdAdjustments.push("Strong earnings momentum lowered timing thresholds");
  if (earningsGrowth !== null && earningsGrowth >= 25) thresholdAdjustments.push("Very strong earnings growth added extra flexibility");

  const scorePillClass = (score: number) =>
    score >= 70 ? "text-[#0FEDBE] bg-[#0FEDBE]/10 border-[#0FEDBE]/20"
      : score >= 55 ? "text-[#FDD458] bg-[#FDD458]/10 border-[#FDD458]/20"
      : "text-[#FF495B] bg-[#FF495B]/10 border-[#FF495B]/20";

  return (
    <section className="space-y-6 w-full animate-in fade-in duration-500">
      {/* Confidence Score Panel */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#d4a017]" />
            Confidence Metrics
          </h3>
          <span className="text-xs font-mono text-white/50">{result.symbol}</span>
        </div>
        <div className="p-6">
          {snapshotRows.length > 0 ? (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-xl border border-[#d4a017]/20 bg-gradient-to-br from-[#d4a017]/10 to-transparent p-6">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs uppercase tracking-widest text-[#d4a017]/80 font-semibold mb-2">AI Conviction Score</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-black tracking-tighter text-white drop-shadow-md">{overallConfidence}</p>
                    <p className="text-xl text-white/40">/100</p>
                  </div>
                  <p className={`mt-3 text-sm font-bold tracking-wide uppercase ${decisionClass}`}>{decision}</p>
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">Buy Trigger</p>
                      <p className="text-sm font-mono text-white">{buyThreshold}+</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">Accumulate</p>
                      <p className="text-sm font-mono text-white">{accumulateThreshold}+</p>
                    </div>
                  </div>
                  
                  {thresholdAdjustments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
                      {thresholdAdjustments.map((item, idx) => (
                        <p key={idx} className="text-[11px] text-white/60 flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-[#d4a017]" />
                          {item}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`rounded-xl border px-4 py-3 flex flex-col justify-between h-20 transition-all hover:-translate-y-1 hover:shadow-lg ${scorePillClass(valuationScore)}`}>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Valuation</p>
                  <p className="text-2xl font-bold tracking-tight">{valuationScore}</p>
                </div>
                <div className={`rounded-xl border px-4 py-3 flex flex-col justify-between h-20 transition-all hover:-translate-y-1 hover:shadow-lg ${scorePillClass(momentumScore)}`}>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Momentum</p>
                  <p className="text-2xl font-bold tracking-tight">{momentumScore}</p>
                </div>
                <div className={`rounded-xl border px-4 py-3 flex flex-col justify-between h-20 transition-all hover:-translate-y-1 hover:shadow-lg ${scorePillClass(trendScore)}`}>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Trend</p>
                  <p className="text-2xl font-bold tracking-tight">{trendScore}</p>
                </div>
                <div className={`rounded-xl border px-4 py-3 flex flex-col justify-between h-20 transition-all hover:-translate-y-1 hover:shadow-lg ${scorePillClass(fundamentalsScore)}`}>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Fundamentals</p>
                  <p className="text-2xl font-bold tracking-tight">{fundamentalsScore}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-white/50 flex items-center justify-center min-h-[100px]">
              Waiting for snapshot data...
            </div>
          )}
        </div>
      </div>

      {/* Main Analysis Blocks */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#d4a017]" />
            AI Intelligence Report
          </h3>
        </div>
        <div className="p-6">
          {analysisData ? (
            <div className="space-y-4">
              <div className="columns-1 lg:columns-2 gap-4 space-y-4">
                
                {/* Executive Summary */}
                {analysisData.executiveSummary && (
                  <article className="break-inside-avoid rounded-xl border border-white/10 bg-black/20 p-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#0FEDBE]/10 rounded-lg">
                        <Target className="w-4 h-4 text-[#0FEDBE]" />
                      </div>
                      <h4 className="text-sm font-bold text-white/90">Executive Summary</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">{analysisData.executiveSummary}</p>
                  </article>
                )}

                {/* Fundamental Analysis */}
                {analysisData.fundamentalAnalysis && (
                  <article className="break-inside-avoid rounded-xl border border-white/10 bg-black/20 p-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#FDD458]/10 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-[#FDD458]" />
                      </div>
                      <h4 className="text-sm font-bold text-white/90">Fundamental Analysis</h4>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(analysisData.fundamentalAnalysis).map(([key, value]) => (
                        <div key={key} className="group">
                          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm leading-relaxed text-white/80 group-hover:text-white transition-colors">{value}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                {/* Technical Analysis */}
                {analysisData.technicalAnalysis && (
                  <article className="break-inside-avoid rounded-xl border border-white/10 bg-black/20 p-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#d4a017]/10 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-[#d4a017]" />
                      </div>
                      <h4 className="text-sm font-bold text-white/90">Technical Analysis</h4>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(analysisData.technicalAnalysis).map(([key, value]) => (
                        <div key={key} className="group">
                          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm leading-relaxed text-white/80 group-hover:text-white transition-colors">{value}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                {/* Risk Assessment */}
                {analysisData.riskAssessment && (
                  <article className="break-inside-avoid rounded-xl border border-white/10 bg-black/20 p-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#FF8A4C]/10 rounded-lg">
                        <ShieldAlert className="w-4 h-4 text-[#FF8A4C]" />
                      </div>
                      <h4 className="text-sm font-bold text-white/90">Risk Assessment</h4>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(analysisData.riskAssessment).map(([key, value]) => (
                        <div key={key} className="group">
                          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm leading-relaxed text-white/80 group-hover:text-white transition-colors">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                {/* Action Plan */}
                {(analysisData.actionPlan || analysisData.monitoringChecklist) && (
                  <article className="break-inside-avoid rounded-xl border border-[#d4a017]/30 bg-gradient-to-b from-[#d4a017]/10 to-transparent p-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#d4a017]/20 rounded-lg">
                        <Crosshair className="w-4 h-4 text-[#d4a017]" />
                      </div>
                      <h4 className="text-sm font-bold text-[#d4a017]">Strategic Plan</h4>
                    </div>
                    <div className="space-y-4">
                      {analysisData.actionPlan && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4a017]/70 mb-2">Action Items</p>
                          <div className="space-y-2">
                            {analysisData.actionPlan.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2.5">
                                <span className="flex items-center justify-center mt-0.5 h-4 w-4 rounded-full bg-[#d4a017]/20 text-[9px] font-bold text-[#d4a017] shrink-0">{idx + 1}</span>
                                <p className="text-sm leading-relaxed text-white/80">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisData.monitoringChecklist && (
                        <div className="pt-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4a017]/70 mb-2">Monitoring Triggers</p>
                          <div className="space-y-2">
                            {analysisData.monitoringChecklist.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2.5">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/30 shrink-0" />
                                <p className="text-sm leading-relaxed text-white/70 italic">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                )}

                {/* Industry Context */}
                {analysisData.industryContext && (
                  <article className="break-inside-avoid rounded-xl border border-white/10 bg-black/20 p-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Users className="w-4 h-4 text-white/70" />
                      </div>
                      <h4 className="text-sm font-bold text-white/90">Industry Context</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">{analysisData.industryContext}</p>
                  </article>
                )}

                {/* Bull & Bear Cases */}
                {(analysisData.bullCase || analysisData.bearCase) && (
                  <article className="break-inside-avoid rounded-xl border border-white/10 bg-black/20 p-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex -space-x-1">
                        <div className="p-1.5 bg-[#0FEDBE]/10 rounded-full z-10"><TrendingUp className="w-3 h-3 text-[#0FEDBE]" /></div>
                        <div className="p-1.5 bg-[#FF495B]/10 rounded-full"><TrendingUp className="w-3 h-3 text-[#FF495B] rotate-180" /></div>
                      </div>
                      <h4 className="text-sm font-bold text-white/90">Scenarios</h4>
                    </div>
                    <div className="space-y-4">
                      {analysisData.bullCase && (
                        <div className="rounded-lg bg-[#0FEDBE]/5 border border-[#0FEDBE]/10 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0FEDBE] mb-1">Bull Case</p>
                          <p className="text-sm leading-relaxed text-[#0FEDBE]/80">{analysisData.bullCase}</p>
                        </div>
                      )}
                      {analysisData.bearCase && (
                        <div className="rounded-lg bg-[#FF495B]/5 border border-[#FF495B]/10 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF495B] mb-1">Bear Case</p>
                          <p className="text-sm leading-relaxed text-[#FF495B]/80">{analysisData.bearCase}</p>
                        </div>
                      )}
                    </div>
                  </article>
                )}
              </div>

              {/* Meta/Fallback Lines */}
              {analysisData.fallbackReason && (
                <div className="mt-4 rounded-lg border border-[#FF8A4C]/30 bg-[#FF8A4C]/10 px-4 py-3 animate-in fade-in">
                  <p className="text-xs font-medium text-[#FFB089]">ℹ️ Fallback Note: {analysisData.fallbackReason}</p>
                </div>
              )}
            </div>
          ) : result.analysis && !analysisData ? (
            <div className="text-sm leading-relaxed text-[#FF495B] min-h-[300px] flex items-center p-4 border border-[#FF495B]/20 rounded-xl bg-[#FF495B]/5">
              Analysis response could not be parsed as structured data. Raw response: {result.analysis}
            </div>
          ) : (
            <div className="text-sm text-white/50 min-h-[300px] flex items-center justify-center">
              Waiting for AI stream...
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Grid */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#d4a017]" />
            Market Snapshot Data
          </h3>
        </div>
        <div className="p-6">
          {snapshotRows.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {snapshotRows.map((row) => (
                <div key={row.label} className="group rounded-xl border border-white/5 bg-black/20 p-3 hover:bg-white/5 transition-colors">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 truncate" title={row.label}>{row.label}</p>
                  <p className={`text-sm font-mono font-medium truncate ${getValueColorClass(row.value)}`} title={row.value}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white/50 flex items-center justify-center min-h-[100px]">
              No snapshot data loaded.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AnalysisPage() {
  const [isCompare, setIsCompare] = useState(false);
  const [symbol1, setSymbol1] = useState("ASIANPAINT");
  const [symbol2, setSymbol2] = useState("BERGERPAINT");
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
      getAnalysisHistory().then(res => {
        if (res.success) setHistoryList(res.data);
      });
    }
  }, [historyOpen]);

  const saveToHistory = async (result: AnalysisResponse) => {
    if (!result || !result.analysis) return;
    const analysisData = parsePartialJson(result.analysis);
    if (!analysisData) return;

    // Calculate score logic briefly again to save
    const snapshotRows = parseSnapshot(result.stockData);
    const metricMap = buildMetricMap(snapshotRows);
    const peRatio = parseNumericValue(metricMap["p/e ratio"]);
    const earningsGrowth = parseNumericValue(metricMap["earnings growth"]);
    const sector = metricMap["sector"] || "default";
    let score = 50; 
    
    await saveAnalysisToHistory({
      symbol: result.symbol,
      timeframe: result.timeframe,
      riskProfile: result.riskProfile,
      analysis: result.analysis,
      confidenceScore: score,
      decision: "History Record",
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
        body: JSON.stringify({ symbol, timeframe, riskProfile }),
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
                setResult(prev => prev ? { ...prev, stockData: stockDataText } : prev);
              } else if (data.type === "token") {
                analysisText += data.data;
                setResult(prev => prev ? { ...prev, analysis: analysisText } : prev);
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
    <div className="min-h-screen bg-[#050505] text-[#e2e4e9] font-sans selection:bg-[#d4a017]/30 selection:text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#d4a017]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#0FEDBE]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 relative z-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              AI Market Intelligence
            </h1>
            <p className="text-white/50 text-sm mt-2 font-medium tracking-wide">
              Advanced quantitative reasoning & technical analysis
            </p>
          </div>
          
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-2.5 text-sm font-semibold text-white/90 transition-all hover:bg-white/10 hover:shadow-lg hover:-translate-y-0.5">
                <History className="w-4 h-4 text-[#d4a017]" />
                View History
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Analysis Ledger</DialogTitle>
                <DialogDescription className="text-white/50">
                  Your historically generated reports and market calls.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {historyList.length === 0 ? (
                  <div className="text-sm text-white/40 italic flex items-center justify-center p-8 border border-white/5 rounded-xl bg-white/5">
                    No historical records found.
                  </div>
                ) : (
                  historyList.map((h, i) => (
                    <div key={i} className="group rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-[#d4a017] text-lg">{h.symbol}</h4>
                        <span className="text-xs font-mono text-white/40 px-2 py-1 bg-black/40 rounded-md">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                          <Activity className="w-3 h-3 text-white/50" />
                          <span className="text-xs font-bold text-white/80">{h.confidenceScore}/100</span>
                        </div>
                        <p className="text-sm font-medium text-white/70 line-clamp-1 flex-1">
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

        <div className={`grid gap-8 ${isCompare ? 'xl:grid-cols-1' : 'xl:grid-cols-[340px_1fr]'}`}>
          
          <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 h-fit shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#d4a017]">
                Parameters
              </h2>
              <button 
                type="button"
                onClick={() => setIsCompare(!isCompare)}
                className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-bold ${isCompare ? 'bg-[#d4a017] text-black shadow-[0_0_10px_rgba(212,160,23,0.4)]' : 'bg-black/40 text-white/50 hover:bg-black/60 hover:text-white'}`}
              >
                <LayoutPanelLeft className="w-3 h-3" />
                {isCompare ? "Compare: ON" : "Compare: OFF"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className={`grid gap-5 ${isCompare ? 'md:grid-cols-4' : ''}`}>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 pl-1">
                  Primary Asset
                </label>
                <div className="relative group">
                  <input
                    value={symbol1}
                    onChange={(event) => setSymbol1(event.target.value)}
                    placeholder="e.g. RELIANCE.NS"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium text-white placeholder-white/20 outline-none transition-all focus:border-[#d4a017] focus:bg-black/60 focus:ring-1 focus:ring-[#d4a017]/50"
                  />
                </div>
              </div>

              {isCompare && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 pl-1">
                    Secondary Asset
                  </label>
                  <div className="relative group">
                    <input
                      value={symbol2}
                      onChange={(event) => setSymbol2(event.target.value)}
                      placeholder="e.g. TCS.NS"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium text-white placeholder-white/20 outline-none transition-all focus:border-[#d4a017] focus:bg-black/60 focus:ring-1 focus:ring-[#d4a017]/50"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 pl-1">
                  Time Horizon
                </label>
                <select
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium text-white outline-none transition-all focus:border-[#d4a017] focus:bg-black/60 appearance-none cursor-pointer"
                >
                  <option value="short">Short Term (1-3 months)</option>
                  <option value="medium">Medium Term (3-12 months)</option>
                  <option value="long">Long Term (1-5 years)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 pl-1">
                  Risk Profile
                </label>
                <select
                  value={riskProfile}
                  onChange={(event) => setRiskProfile(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium text-white outline-none transition-all focus:border-[#d4a017] focus:bg-black/60 appearance-none cursor-pointer"
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div className={`${isCompare ? 'md:col-span-4 flex items-end justify-end' : 'mt-2'}`}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-[#d4a017] to-[#f3c642] px-6 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none ${isCompare ? 'w-auto min-w-[200px]' : 'w-full'}`}
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isCompare ? "Launch Comparison" : "Initialize Analysis"}
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </aside>

          <div className={isCompare ? "grid xl:grid-cols-2 gap-8" : "w-full"}>
            <AnalysisResultView result={result1} error={error1} loading={loading} />
            {isCompare && <AnalysisResultView result={result2} error={error2} loading={loading} />}
          </div>
          
        </div>
      </div>
    </div>
  );
}
