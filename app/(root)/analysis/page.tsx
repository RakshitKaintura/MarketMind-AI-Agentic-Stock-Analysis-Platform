"use client";

import { FormEvent, useState } from "react";

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

const toBulletText = (line: string) => line.replace(/^[-*•]\s*/, "").trim();

const getValueColorClass = (value: string) => {
  if (/(^|\s)\+\d|\+\d|\+\s*\d/.test(value) || /\bup\b/i.test(value)) {
    return "text-[#0FEDBE]";
  }

  if (/(^|\s)-\d|-\d/.test(value) || /\bdown\b/i.test(value)) {
    return "text-[#FF495B]";
  }

  return "text-white";
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

export default function AnalysisPage() {
  const [symbol, setSymbol] = useState("ASIANPAINT");
  const [timeframe, setTimeframe] = useState("medium");
  const [riskProfile, setRiskProfile] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(defaultResult);
  const [error, setError] = useState("");

  const snapshotRows = result?.stockData ? parseSnapshot(result.stockData) : [];
  
  let analysisData: AnalysisData | null = null;
  if (result?.analysis) {
    try {
      analysisData = JSON.parse(result.analysis);
    } catch (e) {
      console.error("Failed to parse analysis JSON:", e);
    }
  }
  const snapshotSplitIndex = Math.ceil(snapshotRows.length / 2);
  const snapshotRowsLeft = snapshotRows.slice(0, snapshotSplitIndex);
  const snapshotRowsRight = snapshotRows.slice(snapshotSplitIndex);
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

    // Forgive premium valuation when earnings momentum is decisively strong.
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

  // Stricter entry thresholds for elevated valuation regimes.
  if (peRatio !== null) {
    if (peRatio > 50) {
      buyThreshold += 5;
      accumulateThreshold += 3;
    }
    if (peRatio > 65) {
      buyThreshold += 5;
      accumulateThreshold += 4;
    }
  }

  // More forgiving timing when earnings momentum is strong.
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

  const decision =
    overallConfidence >= buyThreshold
      ? "Buy Now (Staggered Entries)"
      : overallConfidence >= accumulateThreshold
      ? "Accumulate Slowly"
      : "Wait For Better Price";

  const decisionClass =
    overallConfidence >= buyThreshold
      ? "text-[#0FEDBE]"
      : overallConfidence >= accumulateThreshold
      ? "text-[#FDD458]"
      : "text-[#FF8A4C]";

  const thresholdAdjustments: string[] = [];
  if (peRatio !== null && peRatio > 50) {
    thresholdAdjustments.push("Higher valuation raised entry thresholds");
  }
  if (peRatio !== null && peRatio > 65) {
    thresholdAdjustments.push("Very high P/E requires extra caution");
  }
  if (earningsGrowth !== null && earningsGrowth >= 15) {
    thresholdAdjustments.push("Strong earnings momentum lowered timing thresholds");
  }
  if (earningsGrowth !== null && earningsGrowth >= 25) {
    thresholdAdjustments.push("Very strong earnings growth added extra flexibility");
  }

  const scorePillClass = (score: number) =>
    score >= 70
      ? "text-[#0FEDBE] bg-[#0FEDBE]/10 border-[#0FEDBE]/20"
      : score >= 55
      ? "text-[#FDD458] bg-[#FDD458]/10 border-[#FDD458]/20"
      : "text-[#FF8A4C] bg-[#FF8A4C]/10 border-[#FF8A4C]/20";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stock-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol, timeframe, riskProfile }),
      });

      const data = (await response.json()) as AnalysisResponse;

      if (!response.ok) {
        setResult(null);
        setError(data.error || "Failed to generate analysis");
        return;
      }

      setResult(data);
    } catch {
      setResult(null);
      setError("Unable to contact analysis server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e2e4e9] font-sans">
      <div className="max-w-350 mx-auto px-4 lg:px-8 py-7">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Stock Analysis</h1>
          <p className="text-[#7a7f8e] text-xs mt-1">
            LangGraph-powered insights for Indian stocks based on live snapshot data.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <aside className="bg-[#161922] border border-[#1e2128] rounded-xl p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4a017]">
                Analysis Inputs
              </h2>
              <span className="text-[11px] px-2 py-1 rounded bg-[#d4a017]/10 text-[#d4a017]">
                AI Ready
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7a7f8e]">
                  Stock Symbol
                </label>
                <input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  placeholder="ASIANPAINT"
                  className="w-full rounded-lg border border-[#2a2e39] bg-[#0f1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#d4a017]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7a7f8e]">
                  Timeframe
                </label>
                <select
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  className="w-full rounded-lg border border-[#2a2e39] bg-[#0f1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#d4a017]"
                >
                  <option value="short">Short Term</option>
                  <option value="medium">Medium Term</option>
                  <option value="long">Long Term</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7a7f8e]">
                  Risk Profile
                </label>
                <select
                  value={riskProfile}
                  onChange={(event) => setRiskProfile(event.target.value)}
                  className="w-full rounded-lg border border-[#2a2e39] bg-[#0f1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#d4a017]"
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#d4a017] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e2b63b] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "Run Analysis"}
              </button>
            </form>

            <div className="mt-4 text-[11px] text-[#7a7f8e] leading-relaxed border-t border-[#232730] pt-3">
              Tip: Use NSE style symbols for best results, like ASIANPAINT, INFY, or SBIN.
            </div>
          </aside>

          <section className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <div className="rounded-xl border border-[#1e2128] bg-[#161922] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#232730] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Confidence Metrics</h3>
                <span className="text-xs text-[#7a7f8e]">Model-Assisted Timing</span>
              </div>
              <div className="p-5">
                {snapshotRows.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                      <p className="text-xs uppercase tracking-wide text-[#7a7f8e]">Overall Confidence Score</p>
                      <p className="mt-1 text-3xl font-bold text-white">{overallConfidence}/100</p>
                      <p className={`mt-2 text-sm font-semibold ${decisionClass}`}>{decision}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md border border-[#2a2e39] bg-[#0f1117] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-[#7a7f8e]">Buy Threshold</p>
                          <p className="text-sm font-semibold text-white">{buyThreshold}+</p>
                        </div>
                        <div className="rounded-md border border-[#2a2e39] bg-[#0f1117] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-[#7a7f8e]">Accumulate Threshold</p>
                          <p className="text-sm font-semibold text-white">{accumulateThreshold}+ </p>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[#9ca3b2]">
                        Signal blends valuation, momentum, trend, and financial health. Use staggered entries and risk controls.
                      </p>
                      {thresholdAdjustments.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {thresholdAdjustments.map((item) => (
                            <p key={item} className="text-[11px] text-[#9ca3b2]">
                              • {item}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div className={`rounded-lg border px-3 py-2 ${scorePillClass(valuationScore)}`}>
                        <p className="text-[11px] uppercase tracking-wide">Valuation</p>
                        <p className="text-lg font-semibold">{valuationScore}</p>
                      </div>
                      <div className={`rounded-lg border px-3 py-2 ${scorePillClass(momentumScore)}`}>
                        <p className="text-[11px] uppercase tracking-wide">Momentum</p>
                        <p className="text-lg font-semibold">{momentumScore}</p>
                      </div>
                      <div className={`rounded-lg border px-3 py-2 ${scorePillClass(trendScore)}`}>
                        <p className="text-[11px] uppercase tracking-wide">Trend</p>
                        <p className="text-lg font-semibold">{trendScore}</p>
                      </div>
                      <div className={`rounded-lg border px-3 py-2 ${scorePillClass(fundamentalsScore)}`}>
                        <p className="text-[11px] uppercase tracking-wide">Financial Health</p>
                        <p className="text-lg font-semibold">{fundamentalsScore}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[#7a7f8e] min-h-30 flex items-center">
                    Run analysis to generate confidence metrics and timing signal.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#1e2128] bg-[#161922] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#232730]">
                <h3 className="text-sm font-semibold text-white">Main Analysis</h3>
              </div>
              <div className="p-5">
                {analysisData ? (
                  <div className="space-y-4 min-h-60">
                    <div className="grid gap-3 md:grid-cols-2">
                      {/* Executive Summary */}
                      {analysisData.executiveSummary && (
                        <article className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d4a017]">Executive Summary</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getSectionPriority("executive").className}`}>
                              {getSectionPriority("executive").label}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[#d6d8df]">{analysisData.executiveSummary}</p>
                        </article>
                      )}

                      {/* Fundamental Analysis */}
                      {analysisData.fundamentalAnalysis && (
                        <article className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d4a017]">Fundamental Analysis</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getSectionPriority("fundamentals").className}`}>
                              {getSectionPriority("fundamentals").label}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {Object.entries(analysisData.fundamentalAnalysis).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d4a017] shrink-0" />
                                <p className="text-sm leading-relaxed text-[#d6d8df] capitalize">{key}: {value}</p>
                              </div>
                            ))}
                          </div>
                        </article>
                      )}

                      {/* Technical Analysis */}
                      {analysisData.technicalAnalysis && (
                        <article className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d4a017]">Technical Analysis</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getSectionPriority("technical").className}`}>
                              {getSectionPriority("technical").label}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {Object.entries(analysisData.technicalAnalysis).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d4a017] shrink-0" />
                                <p className="text-sm leading-relaxed text-[#d6d8df] capitalize">{key}: {value}</p>
                              </div>
                            ))}
                          </div>
                        </article>
                      )}

                      {/* Risk Assessment */}
                      {analysisData.riskAssessment && (
                        <article className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d4a017]">Risk Assessment</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getSectionPriority("risk").className}`}>
                              {getSectionPriority("risk").label}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {Object.entries(analysisData.riskAssessment).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d4a017] shrink-0" />
                                <p className="text-sm leading-relaxed text-[#d6d8df] capitalize">{key.replace(/([A-Z])/g, ' $1')}: {value}</p>
                              </div>
                            ))}
                          </div>
                        </article>
                      )}

                      {/* Action Plan & Monitoring */}
                      {(analysisData.actionPlan || analysisData.monitoringChecklist) && (
                        <article className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d4a017]">Action & Monitoring</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getSectionPriority("action").className}`}>
                              {getSectionPriority("action").label}
                            </span>
                          </div>
                          <div className="mt-3 space-y-3">
                            {analysisData.actionPlan && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-[#7a7f8e] mb-1">Action Plan</p>
                                {analysisData.actionPlan.map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d4a017] shrink-0" />
                                    <p className="text-sm leading-relaxed text-[#d6d8df]">{step}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {analysisData.monitoringChecklist && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-[#7a7f8e] mb-1 mt-2">Monitoring Checklist</p>
                                {analysisData.monitoringChecklist.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d4a017] shrink-0" />
                                    <p className="text-sm leading-relaxed text-[#d6d8df]">{item}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </article>
                      )}

                      {/* Industry Context */}
                      {analysisData.industryContext && (
                        <article className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d4a017]">Industry & Peer Context</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getSectionPriority("industry").className}`}>
                              {getSectionPriority("industry").label}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[#d6d8df]">{analysisData.industryContext}</p>
                        </article>
                      )}

                      {/* Bull & Bear Cases */}
                      {(analysisData.bullCase || analysisData.bearCase) && (
                        <article className="rounded-lg border border-[#2a2e39] bg-[#11151e] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d4a017]">Bull & Bear Cases</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getSectionPriority("bull").className}`}>
                              {getSectionPriority("bull").label}
                            </span>
                          </div>
                          <div className="mt-3 space-y-3">
                            {analysisData.bullCase && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-[#0FEDBE] mb-1">Bull Case</p>
                                <p className="text-sm leading-relaxed text-[#d6d8df]">{analysisData.bullCase}</p>
                              </div>
                            )}
                            {analysisData.bearCase && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-[#FF495B] mb-1">Bear Case</p>
                                <p className="text-sm leading-relaxed text-[#d6d8df]">{analysisData.bearCase}</p>
                              </div>
                            )}
                          </div>
                        </article>
                      )}
                    </div>

                    {/* Meta/Fallback Lines */}
                    {analysisData.fallbackReason && (
                      <div className="rounded-lg border border-[#FF8A4C]/25 bg-[#FF8A4C]/10 px-4 py-3">
                        <p className="text-sm font-medium text-[#FFB089]">Note: AI model fallback used ({analysisData.fallbackReason}).</p>
                      </div>
                    )}
                    <div className="rounded-lg border border-[#6b7280]/30 bg-[#11151e] px-4 py-3">
                      <p className="text-sm text-[#b9c0cd]">Caution: This is informational analysis, not guaranteed investment advice. Model Confidence: {analysisData.confidence || "Unknown"}</p>
                    </div>

                  </div>
                ) : result?.analysis && !analysisData ? (
                  <div className="text-sm leading-relaxed text-[#FF495B] min-h-60 flex items-center">
                    Analysis response could not be parsed as structured data. Raw response: {result.analysis}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[#7a7f8e] min-h-60 flex items-center">
                    Your AI-generated analysis will appear here after submitting the form.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#1e2128] bg-[#161922] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#232730] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Stock Details</h3>
                <span className="text-xs text-[#7a7f8e]">
                  {result?.symbol || `${symbol.toUpperCase()} (pending)`}
                </span>
              </div>
              <div className="p-5">
                {snapshotRows.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="watchlist-table">
                      <table className="w-full text-sm">
                        <colgroup>
                          <col className="w-[40%]" />
                          <col className="w-[60%]" />
                        </colgroup>
                        <thead>
                          <tr className="table-header-row">
                            <th className="table-header text-left px-4 py-3">Metric</th>
                            <th className="table-header text-left px-4 py-3">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {snapshotRowsLeft.map((row) => (
                            <tr key={row.label} className="table-row">
                              <td className="table-cell px-4 py-3 text-[#c7cad2]">{row.label}</td>
                              <td className={`table-cell px-4 py-3 ${getValueColorClass(row.value)}`}>
                                {row.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {snapshotRowsRight.length > 0 ? (
                      <div className="watchlist-table">
                        <table className="w-full text-sm">
                          <colgroup>
                            <col className="w-[40%]" />
                            <col className="w-[60%]" />
                          </colgroup>
                          <thead>
                            <tr className="table-header-row">
                              <th className="table-header text-left px-4 py-3">Metric</th>
                              <th className="table-header text-left px-4 py-3">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {snapshotRowsRight.map((row) => (
                              <tr key={row.label} className="table-row">
                                <td className="table-cell px-4 py-3 text-[#c7cad2]">{row.label}</td>
                                <td className={`table-cell px-4 py-3 ${getValueColorClass(row.value)}`}>
                                  {row.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[#7a7f8e] min-h-30 flex items-center">
                    Run analysis to load the latest stock snapshot.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
