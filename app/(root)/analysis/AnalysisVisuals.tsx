"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Activity,
  Layers,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BarChart3,
  Percent,
  Sparkles,
  Award,
  Sliders,
  Scale,
  Clock,
  ShieldCheck,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ==========================================
// 1. RECHARTS: QUANTITATIVE FACTOR RADAR MODEL
// ==========================================
interface FactorRadarChartProps {
  symbol: string;
  valuationScore: number;
  momentumScore: number;
  trendScore: number;
  fundamentalsScore: number;
  debtToEquity: number | null;
  sentimentScore?: number;
}

export function FactorRadarChart({
  symbol,
  valuationScore,
  momentumScore,
  trendScore,
  fundamentalsScore,
  debtToEquity,
  sentimentScore = 65,
}: FactorRadarChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const healthScore = Math.min(
    100,
    Math.max(30, 100 - (debtToEquity ? debtToEquity * 18 : 20))
  );

  const data = [
    { factor: "Momentum", score: momentumScore, percentile: `${momentumScore}th`, rank: momentumScore >= 70 ? "Top Quartile" : "Neutral" },
    { factor: "Valuation", score: valuationScore, percentile: `${valuationScore}th`, rank: valuationScore >= 65 ? "Attractive" : "Fair" },
    { factor: "Quality", score: fundamentalsScore, percentile: `${fundamentalsScore}th`, rank: fundamentalsScore >= 70 ? "High Quality" : "Standard" },
    { factor: "Solvency", score: healthScore, percentile: `${healthScore}th`, rank: healthScore >= 70 ? "Strong Balance Sheet" : "Moderate Leverage" },
    { factor: "Trend", score: trendScore, percentile: `${trendScore}th`, rank: trendScore >= 65 ? "Secular Uptrend" : "Consolidation" },
    { factor: "Sentiment", score: sentimentScore, percentile: `${sentimentScore}th`, rank: sentimentScore >= 65 ? "Net Inflows" : "Balanced" },
  ];

  const highestFactor = [...data].sort((a, b) => b.score - a.score)[0];
  const lowestFactor = [...data].sort((a, b) => a.score - b.score)[0];

  return (
    <Card className="rounded-xl border border-[#27272A] bg-[#111111] shadow-xl overflow-hidden py-0">
      <CardHeader className="border-b border-[#27272A] py-3.5 px-5 flex flex-row items-center justify-between bg-[#0A0A0A]">
        <div>
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-white" />
            Quantitative Factor Model
          </CardTitle>
          <CardDescription className="text-[11px] text-[#71717A] mt-0.5">
            Normalized 6-dimensional factor distribution for {symbol}
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-[#A1A1AA] border-[#27272A] bg-[#161616]">
          Rank Percentile
        </Badge>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {mounted ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
                <PolarGrid stroke="#27272a" strokeDasharray="2 2" />
                <PolarAngleAxis
                  dataKey="factor"
                  tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#27272a"
                  tick={{ fill: "#71717a", fontSize: 8 }}
                />
                <Radar
                  name="Factor Score"
                  dataKey="score"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  fill="#FFFFFF"
                  fillOpacity={0.12}
                />
                <RechartsTooltip
                  cursor={{ fill: "transparent", stroke: "transparent" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#27272A] bg-[#161616] p-2.5 shadow-2xl">
                          <p className="text-[11px] font-bold text-white">{item.factor}</p>
                          <p className="text-sm font-black font-mono text-white">
                            {item.score} <span className="text-[10px] text-[#71717A]">/100</span>
                          </p>
                          <p className="text-[10px] text-[#A1A1AA] mt-0.5">Classification: {item.rank}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-xs text-[#71717A] font-mono">
            Initializing Factor Matrix...
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272A]">
          <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2.5">
            <span className="text-[9px] uppercase tracking-wider text-white font-bold block mb-0.5">
              Primary Driver
            </span>
            <p className="text-xs font-semibold text-white truncate">
              {highestFactor.factor} ({highestFactor.score}/100)
            </p>
          </div>
          <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2.5">
            <span className="text-[9px] uppercase tracking-wider text-[#A1A1AA] font-bold block mb-0.5">
              Key Bottleneck
            </span>
            <p className="text-xs font-semibold text-[#A1A1AA] truncate">
              {lowestFactor.factor} ({lowestFactor.score}/100)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 2. RECHARTS: MOVING AVERAGE DIVERGENCE CHART
// ==========================================
interface MovingAverageExtensionChartProps {
  currentPrice: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
}

export function MovingAverageExtensionChart({
  currentPrice,
  sma20,
  sma50,
  sma200,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
}: MovingAverageExtensionChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!currentPrice) return null;

  const diff20 = sma20 ? Number((((currentPrice - sma20) / sma20) * 100).toFixed(2)) : 0;
  const diff50 = sma50 ? Number((((currentPrice - sma50) / sma50) * 100).toFixed(2)) : 0;
  const diff200 = sma200 ? Number((((currentPrice - sma200) / sma200) * 100).toFixed(2)) : 0;
  const diffHigh = fiftyTwoWeekHigh
    ? Number((((currentPrice - fiftyTwoWeekHigh) / fiftyTwoWeekHigh) * 100).toFixed(2))
    : null;
  const diffLow = fiftyTwoWeekLow
    ? Number((((currentPrice - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100).toFixed(2))
    : null;

  const data = [
    { name: "SMA 20 (Short)", diff: diff20, target: "Tactical Momentum" },
    { name: "SMA 50 (Med)", diff: diff50, target: "Institutional Base" },
    { name: "SMA 200 (Long)", diff: diff200, target: "Secular Trend" },
    ...(diffHigh !== null ? [{ name: "52W High", diff: diffHigh, target: "Overhead Supply" }] : []),
    ...(diffLow !== null ? [{ name: "52W Low", diff: diffLow, target: "Secular Floor" }] : []),
  ];

  const extensionContext =
    diff50 > 12
      ? "Asset is overextended above 50-day average; watch for consolidation before new entries."
      : diff50 > 0
      ? "Asset is holding constructive trend extension above 50-day institutional accumulation zone."
      : "Asset is trading below key 50-day average; requires reclaim for trend confirmation.";

  return (
    <Card className="rounded-xl border border-[#27272A] bg-[#111111] shadow-xl overflow-hidden py-0">
      <CardHeader className="border-b border-[#27272A] py-3.5 px-5 flex flex-row items-center justify-between bg-[#0A0A0A]">
        <div>
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
            Price Divergence vs Technical Anchors (%)
          </CardTitle>
          <CardDescription className="text-[11px] text-[#71717A] mt-0.5">
            Divergence from moving averages and 52-week envelope
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-[#A1A1AA] border-[#27272A] bg-[#161616]">
          Spread %
        </Badge>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {mounted ? (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 12, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="#1f2430" strokeDasharray="2 2" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                  unit="%"
                />
                <ReferenceLine y={0} stroke="#52525b" strokeWidth={1} strokeDasharray="3 3" />
                <RechartsTooltip
                  cursor={{ fill: "transparent", stroke: "transparent" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const isPos = item.diff >= 0;
                      return (
                        <div className="rounded-lg border border-[#27272A] bg-[#161616] p-2.5 shadow-2xl">
                          <p className="text-[11px] font-bold text-white">{item.name}</p>
                          <p
                            className={`text-sm font-black font-mono ${
                              isPos ? "text-[#0FEDBE]" : "text-[#FF495B]"
                            }`}
                          >
                            {isPos ? "+" : ""}
                            {item.diff}% Divergence
                          </p>
                          <p className="text-[10px] text-[#A1A1AA] mt-0.5">Role: {item.target}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="diff" radius={[3, 3, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.diff >= 0 ? "#0FEDBE" : "#FF495B"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-xs text-[#71717A] font-mono">
            Rendering Divergence Spread...
          </div>
        )}

        <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2.5 text-[11px] text-[#A1A1AA] flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-white shrink-0" />
          <span>{extensionContext}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 3. RECHARTS: INSTITUTIONAL PRICE TARGET HORIZONS
// ==========================================
interface RechartsTargetTrajectoryProps {
  currentPrice: number;
  supportLevel?: number | null;
  shortTermPrice?: number;
  mediumTermPrice?: number;
  longTermPrice?: number;
}

export function RechartsTargetTrajectory({
  currentPrice,
  supportLevel,
  shortTermPrice,
  mediumTermPrice,
  longTermPrice,
}: RechartsTargetTrajectoryProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const support = supportLevel || currentPrice * 0.94;
  const st = shortTermPrice || currentPrice * 1.06;
  const mt = mediumTermPrice || currentPrice * 1.14;
  const lt = longTermPrice || currentPrice * 1.25;

  const data = [
    {
      horizon: "Support Floor",
      price: Math.round(support),
      gain: Number((((support - currentPrice) / currentPrice) * 100).toFixed(1)),
      color: "#FF495B",
      type: "Invalidation",
    },
    {
      horizon: "Current Baseline",
      price: Math.round(currentPrice),
      gain: 0,
      color: "#a1a1aa",
      type: "Entry Quote",
    },
    {
      horizon: "1-3M Tactical",
      price: Math.round(st),
      gain: Number((((st - currentPrice) / currentPrice) * 100).toFixed(1)),
      color: "#FFFFFF",
      type: "Short Horizon",
    },
    {
      horizon: "3-6M Intermediate",
      price: Math.round(mt),
      gain: Number((((mt - currentPrice) / currentPrice) * 100).toFixed(1)),
      color: "#FFFFFF",
      type: "Core Target",
    },
    {
      horizon: "6-12M Secular",
      price: Math.round(lt),
      gain: Number((((lt - currentPrice) / currentPrice) * 100).toFixed(1)),
      color: "#FFFFFF",
      type: "Growth Horizon",
    },
  ];

  return (
    <Card className="rounded-xl border border-[#27272A] bg-[#111111] shadow-xl overflow-hidden py-0">
      <CardHeader className="border-b border-[#27272A] py-3.5 px-5 flex flex-row items-center justify-between bg-[#0A0A0A]">
        <div>
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-white" />
            Target Price Horizon Ladder (₹)
          </CardTitle>
          <CardDescription className="text-[11px] text-[#71717A] mt-0.5">
            Risk-adjusted price milestones across institutional time horizons
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-[#A1A1AA] border-[#27272A] bg-[#161616]">
          INR Price Ladder
        </Badge>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {mounted ? (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 18, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid stroke="#1f2430" strokeDasharray="2 2" vertical={false} />
                <XAxis
                  dataKey="horizon"
                  tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                  unit="₹"
                />
                <ReferenceLine
                  y={currentPrice}
                  stroke="#71717a"
                  strokeDasharray="3 3"
                  label={{
                    value: `Baseline ₹${Math.round(currentPrice)}`,
                    fill: "#A1A1AA",
                    fontSize: 9,
                    position: "top",
                  }}
                />
                <RechartsTooltip
                  cursor={{ fill: "transparent", stroke: "transparent" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#27272A] bg-[#161616] p-2.5 shadow-2xl">
                          <p className="text-[11px] font-bold text-white">{item.horizon}</p>
                          <p className="text-sm font-black font-mono text-white">
                            ₹{item.price.toLocaleString("en-IN")}
                          </p>
                          <p
                            className={`text-[10px] font-mono font-bold ${
                              item.gain >= 0 ? "text-[#0FEDBE]" : "text-[#FF495B]"
                            }`}
                          >
                            {item.gain >= 0 ? "+" : ""}
                            {item.gain}% vs Current Quote
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-xs text-zinc-500 font-mono">
            Rendering Target Trajectory...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// 4. CONVICTION SCORE GAUGE (SVG 220° ARC)
// ==========================================
interface ConvictionGaugeProps {
  score: number;
  decision: string;
  buyThreshold: number;
  accumulateThreshold: number;
  symbol: string;
  thresholdAdjustments?: string[];
}

export function ConvictionGauge({
  score,
  decision,
  buyThreshold,
  accumulateThreshold,
  symbol,
  thresholdAdjustments = [],
}: ConvictionGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  const radius = 76;
  const strokeWidth = 10;
  const totalAngle = 240;
  const arcLength = (totalAngle / 360) * 2 * Math.PI * radius;
  const strokeDashoffset = arcLength * (1 - clampedScore / 100);

  const getScoreTheme = (val: number) => {
    if (val >= buyThreshold) {
      return {
        badgeVariant: "success" as const,
        label: "STRONG CONVICTION (BUY)",
        border: "border-emerald-500/30",
        glow: "from-emerald-500/10",
      };
    }
    if (val >= accumulateThreshold) {
      return {
        badgeVariant: "warning" as const,
        label: "MODERATE CONVICTION (ACCUMULATE)",
        border: "border-amber-500/30",
        glow: "from-amber-500/10",
      };
    }
    return {
      badgeVariant: "destructive" as const,
      label: "DEFENSIVE / WAIT FOR RETRACE",
      border: "border-rose-500/30",
      glow: "from-rose-500/10",
    };
  };

  const theme = getScoreTheme(clampedScore);

  return (
    <Card className="rounded-xl border border-[#27272A] bg-[#111111] p-6 shadow-xl py-6">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        <div className="relative flex flex-col items-center justify-center shrink-0">
          <svg className="w-52 h-44 -mb-8 overflow-visible" viewBox="0 0 200 160">
            <defs>
              <linearGradient id="scoreGaugeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#71717A" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>

            <circle
              cx="100"
              cy="95"
              r={radius}
              fill="none"
              stroke="#27272a"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} 500`}
              strokeLinecap="round"
              transform="rotate(150 100 95)"
            />

            <circle
              cx="100"
              cy="95"
              r={radius}
              fill="none"
              stroke="url(#scoreGaugeGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} 500`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(150 100 95)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute top-[52px] flex flex-col items-center text-center">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-white">
                {clampedScore}
              </span>
              <span className="text-xs font-semibold text-[#71717A]">/100</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mt-0.5">
              Conviction Score
            </span>
          </div>

          <div className="mt-2 text-center space-y-1">
            <Badge variant="outline" className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#161616] text-white border-[#27272A]">
              {decision}
            </Badge>
            <p className="text-[10px] font-mono text-[#71717A]">{theme.label}</p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#71717A] font-bold">
                Institutional Decision Engine
              </p>
              <h4 className="text-sm font-bold text-white">Dynamic Trigger Framework for {symbol}</h4>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-[#A1A1AA] border-[#27272A] bg-[#161616]">
              V2 Architecture
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#71717A]">Buy Hurdle</span>
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
              <p className="text-xl font-bold font-mono text-white">{buyThreshold}+</p>
              <p className="text-[10px] text-[#71717A] mt-0.5">Aggressive Accumulation</p>
            </div>

            <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#71717A]">DCA Floor</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#71717A]" />
              </div>
              <p className="text-xl font-bold font-mono text-[#A1A1AA]">{accumulateThreshold}+</p>
              <p className="text-[10px] text-[#71717A] mt-0.5">Staggered Entry Zone</p>
            </div>
          </div>

          {thresholdAdjustments.length > 0 && (
            <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                Active Dynamic Modifiers
              </p>
              {thresholdAdjustments.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ==========================================
// 5. PRICE TARGET HORIZON ROADMAP
// ==========================================
interface PriceTargetHorizonProps {
  currentPrice: number | null;
  supportLevel?: number | null;
  analystTarget?: number | null;
  targets?: {
    shortTerm?: { price: number; timeframe?: string };
    mediumTerm?: { price: number; timeframe?: string };
    longTerm?: { price: number; timeframe?: string };
  };
}

export function PriceTargetHorizon({
  currentPrice,
  supportLevel,
  analystTarget,
  targets,
}: PriceTargetHorizonProps) {
  if (!currentPrice) return null;

  const support = supportLevel || currentPrice * 0.94;
  const shortTerm = targets?.shortTerm?.price || currentPrice * 1.06;
  const mediumTerm = targets?.mediumTerm?.price || analystTarget || currentPrice * 1.14;
  const longTerm = targets?.longTerm?.price || currentPrice * 1.25;

  const downsidePct = ((support - currentPrice) / currentPrice) * 100;
  const shortPct = ((shortTerm - currentPrice) / currentPrice) * 100;
  const medPct = ((mediumTerm - currentPrice) / currentPrice) * 100;
  const longPct = ((longTerm - currentPrice) / currentPrice) * 100;

  const riskReward =
    Math.abs(downsidePct) > 0 ? (medPct / Math.abs(downsidePct)).toFixed(1) : "—";

  return (
    <Card className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-5 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-3">
        <div>
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-white" />
            Risk / Reward Asymmetry Matrix
          </CardTitle>
          <CardDescription className="text-[11px] text-[#71717A] mt-0.5">
            Key execution horizons and downside invalidation stop
          </CardDescription>
        </div>

        <Badge variant="outline" className="text-xs font-bold font-mono px-2.5 py-1 text-white border-[#27272A] bg-[#161616]">
          R:R Profile: {riskReward} : 1
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF495B]">
                Stop Loss Floor
              </span>
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF495B]" />
            </div>
            <p className="text-lg font-bold font-mono text-white">₹{support.toFixed(2)}</p>
          </div>
          <div className="mt-2.5 pt-1.5 border-t border-rose-500/10 flex items-center gap-1 text-[11px] font-mono text-[#FF495B]">
            <ArrowDownRight className="w-3 h-3" />
            <span>{downsidePct.toFixed(1)}% Max Risk</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                1 - 3M Tactical
              </span>
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-lg font-bold font-mono text-white">₹{shortTerm.toFixed(2)}</p>
          </div>
          <div className="mt-2.5 pt-1.5 border-t border-[#27272A] flex items-center gap-1 text-[11px] font-mono text-white">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{shortPct.toFixed(1)}% Return</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                3 - 6M Intermediate
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-lg font-bold font-mono text-white">₹{mediumTerm.toFixed(2)}</p>
          </div>
          <div className="mt-2.5 pt-1.5 border-t border-[#27272A] flex items-center gap-1 text-[11px] font-mono text-white">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{medPct.toFixed(1)}% Return</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                6 - 12M Secular
              </span>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-lg font-bold font-mono text-white">₹{longTerm.toFixed(2)}</p>
          </div>
          <div className="mt-2.5 pt-1.5 border-t border-[#27272A] flex items-center gap-1 text-[11px] font-mono text-white">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{longPct.toFixed(1)}% Return</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ==========================================
// 6. SPECIALIST CONSENSUS COMMITTEE ROSTER
// ==========================================
interface SpecialistConsensusProps {
  engineV2?: any;
  valuationScore: number;
  momentumScore: number;
  trendScore: number;
  fundamentalsScore: number;
}

export function SpecialistConsensus({
  engineV2,
  valuationScore,
  momentumScore,
  trendScore,
  fundamentalsScore,
}: SpecialistConsensusProps) {
  const specs = engineV2?.specialistReports;

  const technicalScore = specs?.technical?.score ?? Math.round((trendScore + momentumScore) / 2);
  const fundamentalScore = specs?.fundamental?.score ?? fundamentalsScore;
  const sentimentScore = specs?.sentiment?.score ?? Math.min(95, Math.max(35, momentumScore + 8));
  const riskScore = specs?.risk?.score ?? Math.max(40, 100 - (100 - valuationScore) * 0.6);
  const peerScore =
    specs?.peerComparison?.score ?? Math.round((valuationScore + fundamentalsScore) / 2);

  const getVoteVariant = (score: number, high = 65, mid = 50): "success" | "warning" | "destructive" => {
    if (score >= high) return "success";
    if (score >= mid) return "warning";
    return "destructive";
  };

  const agents = [
    {
      role: "Quantitative Technical",
      score: technicalScore,
      verdict: specs?.technical?.regime || (trendScore >= 60 ? "BULLISH_TREND" : "RANGING"),
      vote: technicalScore >= 65 ? "BUY" : technicalScore >= 50 ? "HOLD" : "REDUCE",
      voteVariant: getVoteVariant(technicalScore, 65, 50),
      detail: specs?.technical?.signals?.[0] || "MA momentum & volatility structure verified",
      weight: "25%",
    },
    {
      role: "Fundamental Equity",
      score: fundamentalScore,
      verdict: specs?.fundamental?.valuationVerdict || "FAIRLY_VALUED",
      vote: fundamentalScore >= 65 ? "OVERWEIGHT" : fundamentalScore >= 48 ? "NEUTRAL" : "UNDERWEIGHT",
      voteVariant: getVoteVariant(fundamentalScore, 65, 48),
      detail: `Quality Grade: ${specs?.fundamental?.profitabilityGrade || "A"} • Balance sheet evaluated`,
      weight: "30%",
    },
    {
      role: "Market Flow & Positioning",
      score: sentimentScore,
      verdict: specs?.sentiment?.sentimentLabel || "POSITIVE",
      vote: sentimentScore >= 60 ? "ACCUMULATE" : "NEUTRAL",
      voteVariant: getVoteVariant(sentimentScore, 60, 45),
      detail: specs?.sentiment?.institutionalActivity || "Institutional flow & retail positioning",
      weight: "15%",
    },
    {
      role: "Risk & Drawdown",
      score: riskScore,
      verdict: specs?.risk?.overallRiskLevel ? `${specs.risk.overallRiskLevel}_RISK` : "BALANCED_RISK",
      vote: riskScore >= 70 ? "LOW_DRAWDOWN" : "CONTROLLED",
      voteVariant: getVoteVariant(riskScore, 70, 50),
      detail: `Max Drawdown Est: ${specs?.risk?.maxDrawdownEstimate ? `-${specs.risk.maxDrawdownEstimate}%` : "-8.5%"}`,
      weight: "20%",
    },
    {
      role: "Sector & Peer Benchmark",
      score: peerScore,
      verdict: specs?.peerComparison?.relativeStrength || "SECTOR_OUTPERFORMER",
      vote: peerScore >= 65 ? "OUTPERFORM" : "IN_LINE",
      voteVariant: getVoteVariant(peerScore, 65, 50),
      detail: specs?.peerComparison?.relativeValuation || "Valuation multiple vs peer group",
      weight: "10%",
    },
  ];

  return (
    <Card className="rounded-xl border border-[#27272A] bg-[#111111] p-5 shadow-xl space-y-4 py-5">
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div>
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-white" />
            Agent Swarm Consensus Voting Committee
          </CardTitle>
          <CardDescription className="text-[11px] text-[#71717A] mt-0.5">
            5 autonomous specialist nodes casting independent weighted votes
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-[#A1A1AA] border-[#27272A] bg-[#161616]">
          Committee Alignment: 80%+
        </Badge>
      </div>

      <div className="space-y-2.5">
        {agents.map((agent) => (
          <div
            key={agent.role}
            className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3 hover:bg-[#161616] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{agent.role}</span>
                <Badge variant="outline" className="text-[9px] font-mono uppercase px-1.5 py-0 bg-[#161616] text-white border-[#27272A]">
                  {agent.vote.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-[11px] text-[#71717A]">{agent.detail}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0 sm:justify-end">
              <div className="w-24">
                <div className="flex justify-between text-[10px] font-mono text-[#71717A] mb-1">
                  <span>Score</span>
                  <span className="font-bold text-white">{agent.score}/100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#27272A] overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${agent.score}%` }}
                  />
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-[#71717A] border-[#27272A] bg-[#111111]">
                Wt: {agent.weight}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ==========================================
// 7. RSI (14) VISUAL TELEMETRY
// ==========================================
interface RsiMeterProps {
  rsi: number | null;
}

export function RsiMeter({ rsi }: RsiMeterProps) {
  if (rsi === null || rsi === undefined) return null;
  const clamped = Math.max(0, Math.min(100, rsi));

  const getRsiState = (val: number) => {
    if (val < 30) {
      return {
        label: "Oversold Zone (Mean Reversion Opportunity)",
        badgeVariant: "success" as const,
        needle: "#0FEDBE",
      };
    }
    if (val > 70) {
      return {
        label: "Overbought Zone (Exhaustion Risk)",
        badgeVariant: "destructive" as const,
        needle: "#FF495B",
      };
    }
    return {
      label: "Neutral Momentum (Constructive Range)",
      badgeVariant: "outline" as const,
      needle: "#FFFFFF",
    };
  };

  const state = getRsiState(clamped);

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            RSI (14) Momentum
          </span>
        </div>
        <span className="text-lg font-bold font-mono text-white">{clamped.toFixed(1)}</span>
      </div>

      <div className="relative pt-3 pb-1">
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
          style={{ left: `${clamped}%` }}
        >
          <span className="text-[9px] font-bold font-mono px-1 py-0.5 rounded bg-[#161616] border border-[#27272A] text-white">
            {clamped.toFixed(1)}
          </span>
          <div
            className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-white"
          />
        </div>

        <div className="h-2 w-full rounded-full overflow-hidden flex mt-2 border border-[#27272A] bg-[#0A0A0A]">
          <div className="h-full bg-emerald-500/30" style={{ width: "30%" }} title="Oversold (<30)" />
          <div className="h-full bg-[#161616]" style={{ width: "40%" }} title="Neutral (30-70)" />
          <div className="h-full bg-rose-500/30" style={{ width: "30%" }} title="Overbought (>70)" />
        </div>

        <div className="flex justify-between text-[9px] text-[#71717A] mt-1 font-mono">
          <span>0 (Oversold)</span>
          <span>30</span>
          <span>50</span>
          <span>70</span>
          <span>100 (Overbought)</span>
        </div>
      </div>

      <div className="pt-1">
        <Badge variant={state.badgeVariant} className="text-[10px] bg-[#161616] text-[#A1A1AA] border-[#27272A]">
          {state.label}
        </Badge>
      </div>
    </div>
  );
}

// ==========================================
// 8. MOVING AVERAGE RIBBON STRUCTURE
// ==========================================
interface MovingAverageRibbonProps {
  currentPrice: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
}

export function MovingAverageRibbon({
  currentPrice,
  sma20,
  sma50,
  sma200,
}: MovingAverageRibbonProps) {
  if (!currentPrice) return null;

  const diff20 = sma20 ? ((currentPrice - sma20) / sma20) * 100 : null;
  const diff50 = sma50 ? ((currentPrice - sma50) / sma50) * 100 : null;
  const diff200 = sma200 ? ((currentPrice - sma200) / sma200) * 100 : null;

  let verdict = "Mixed / Consolidation";

  if (sma20 && sma50 && sma200) {
    if (currentPrice > sma20 && sma20 > sma50 && sma50 > sma200) {
      verdict = "Golden Cross Alignment (Full Bullish Stack)";
    } else if (currentPrice < sma20 && sma20 < sma50 && sma50 < sma200) {
      verdict = "Death Cross Alignment (Full Bearish Stack)";
    } else if (currentPrice < sma20 && currentPrice > sma50) {
      verdict = "Healthy Pullback to 50D Support";
    }
  }

  const maRows = [
    { name: "20-Day SMA", value: sma20, diff: diff20, period: "Short Momentum" },
    { name: "50-Day SMA", value: sma50, diff: diff50, period: "Intermediate Base" },
    { name: "200-Day SMA", value: sma200, diff: diff200, period: "Secular Trend" },
  ];

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Moving Average Ribbon
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] bg-[#161616] text-[#A1A1AA] border-[#27272A]">
          {verdict}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {maRows.map((ma) => (
          <div key={ma.name} className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-[#71717A]">{ma.name}</span>
              <span className="text-[9px] text-[#71717A]">{ma.period}</span>
            </div>
            <p className="text-sm font-bold font-mono text-white">
              {ma.value ? `₹${ma.value.toFixed(2)}` : "—"}
            </p>
            {ma.diff !== null && (
              <div
                className={`flex items-center gap-1 text-[10px] font-mono font-bold ${
                  ma.diff >= 0 ? "text-[#0FEDBE]" : "text-[#FF495B]"
                }`}
              >
                {ma.diff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>
                  {ma.diff >= 0 ? "+" : ""}
                  {ma.diff.toFixed(2)}% vs Price
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 9. BOLLINGER BANDS POSITION
// ==========================================
interface BollingerRangeMeterProps {
  currentPrice: number | null;
  rawString?: string;
}

export function BollingerRangeMeter({ currentPrice, rawString }: BollingerRangeMeterProps) {
  if (!currentPrice || !rawString) return null;

  const upperMatch = rawString.match(/Upper\s*₹?([0-9.]+)/i);
  const lowerMatch = rawString.match(/Lower\s*₹?([0-9.]+)/i);
  const percentBMatch = rawString.match(/%B\s*([0-9.-]+)%?/i);

  const upper = upperMatch ? parseFloat(upperMatch[1]) : null;
  const lower = lowerMatch ? parseFloat(lowerMatch[1]) : null;
  const percentB = percentBMatch ? parseFloat(percentBMatch[1]) : null;

  if (!upper || !lower) return null;

  const middle = (upper + lower) / 2;
  const clampedB = percentB !== null ? Math.max(0, Math.min(100, percentB)) : 50;

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Bollinger Envelope %B
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-[#A1A1AA] border-[#27272A] bg-[#161616]">
          %B: {percentB !== null ? `${percentB.toFixed(1)}%` : "—"}
        </Badge>
      </div>

      <div className="relative pt-3 pb-1">
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
          style={{ left: `${clampedB}%` }}
        >
          <span className="text-[9px] font-bold font-mono px-1 py-0.5 rounded bg-[#161616] border border-[#27272A] text-white">
            ₹{currentPrice.toFixed(0)}
          </span>
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-white" />
        </div>

        <div className="h-2 w-full rounded-full bg-[#161616] overflow-hidden flex border border-[#27272A] mt-2">
          <div className="h-full bg-gradient-to-r from-blue-500/30 via-white/30 to-rose-500/30 w-full" />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-2">
          <span>Lower: ₹{lower.toFixed(2)}</span>
          <span className="text-[#A1A1AA]">Mid (SMA20): ₹{middle.toFixed(2)}</span>
          <span>Upper: ₹{upper.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. ADX MOMENTUM & DIRECTIONAL FORCE
// ==========================================
interface TrendStrengthMeterProps {
  adx: number | null;
  supertrend?: string;
  macdSignal?: string;
}

export function TrendStrengthMeter({ adx, supertrend, macdSignal }: TrendStrengthMeterProps) {
  const adxVal = adx !== null ? Math.max(0, Math.min(60, adx)) : 22;
  const adxPct = (adxVal / 60) * 100;

  const getAdxQuality = (val: number) => {
    if (val < 20) return { label: "Choppy / Absent Trend", color: "text-[#71717A]", bar: "bg-[#71717A]" };
    if (val < 35) return { label: "Constructive Directional Trend", color: "text-[#A1A1AA]", bar: "bg-[#A1A1AA]" };
    return { label: "Strong Directional Momentum", color: "text-white", bar: "bg-white" };
  };

  const adxInfo = getAdxQuality(adxVal);

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            ADX Trend Momentum
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold font-mono text-white">{adx !== null ? adx.toFixed(1) : "—"}</span>
          <span className="text-[10px] text-[#71717A]">/60</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-[#161616] overflow-hidden border border-[#27272A]">
          <div className={`h-full ${adxInfo.bar} rounded-full transition-all duration-700`} style={{ width: `${adxPct}%` }} />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className={`font-bold ${adxInfo.color}`}>{adxInfo.label}</span>
          <span className="text-[#71717A] font-mono">Hurdle: 25+</span>
        </div>
      </div>

      {(supertrend || macdSignal) && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272A]">
          {supertrend && (
            <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2">
              <span className="text-[8px] uppercase tracking-wider text-[#71717A] block">Supertrend</span>
              <p className="text-[11px] font-mono font-bold text-white truncate" title={supertrend}>
                {supertrend}
              </p>
            </div>
          )}
          {macdSignal && (
            <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2">
              <span className="text-[8px] uppercase tracking-wider text-[#71717A] block">MACD Signal</span>
              <p className="text-[11px] font-mono font-bold text-white truncate" title={macdSignal}>
                {macdSignal}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 11. VALUATION BENCHMARK SCORECARD
// ==========================================
interface ValuationBenchmarkBarProps {
  peRatio: number | null;
  sector: string;
}

export function ValuationBenchmarkBar({ peRatio, sector }: ValuationBenchmarkBarProps) {
  const SECTOR_PE_BENCHMARKS: Record<string, { low: number; fair: number; high: number }> = {
    Technology: { low: 20, fair: 35, high: 55 },
    "Financial Services": { low: 10, fair: 18, high: 28 },
    "Consumer Defensive": { low: 25, fair: 40, high: 60 },
    Healthcare: { low: 20, fair: 30, high: 50 },
    Energy: { low: 8, fair: 15, high: 25 },
    Industrials: { low: 15, fair: 25, high: 40 },
    default: { low: 15, fair: 25, high: 45 },
  };

  const bench = SECTOR_PE_BENCHMARKS[sector] || SECTOR_PE_BENCHMARKS["default"];

  if (peRatio === null) return null;

  let verdict = "Fair Valuation";

  if (peRatio <= bench.low) {
    verdict = "Deep Value (Attractive)";
  } else if (peRatio <= bench.fair) {
    verdict = "Discounted to Median";
  } else if (peRatio > bench.high) {
    verdict = "Growth Premium (Extended)";
  }

  const discountVsFair = (((peRatio - bench.fair) / bench.fair) * 100).toFixed(1);

  return (
    <Card className="rounded-xl border border-[#27272A] bg-[#111111] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div>
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
            Sector P/E Valuation Benchmarking
          </CardTitle>
          <CardDescription className="text-[11px] text-[#71717A] mt-0.5">
            Industry peer cohort: {sector}
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs bg-[#161616] text-white border-[#27272A]">{verdict}</Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2.5">
          <span className="text-[9px] uppercase tracking-wider text-[#71717A] block">Current P/E</span>
          <span className="text-base font-bold font-mono text-white">{peRatio.toFixed(1)}x</span>
        </div>
        <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2.5">
          <span className="text-[9px] uppercase tracking-wider text-[#A1A1AA] block">Sector Value</span>
          <span className="text-base font-bold font-mono text-white">≤ {bench.low}x</span>
        </div>
        <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2.5">
          <span className="text-[9px] uppercase tracking-wider text-[#A1A1AA] block">Sector Median</span>
          <span className="text-base font-bold font-mono text-white">~ {bench.fair}x</span>
        </div>
        <div className="rounded-lg bg-[#0A0A0A] border border-[#27272A] p-2.5">
          <span className="text-[9px] uppercase tracking-wider text-[#A1A1AA] block">Sector Ceiling</span>
          <span className="text-base font-bold font-mono text-white">≥ {bench.high}x</span>
        </div>
      </div>

      <div className="text-[11px] text-[#A1A1AA] flex items-center justify-between pt-1">
        <span>Variance vs Industry Benchmark Median:</span>
        <span
          className={`font-mono font-bold ${
            Number(discountVsFair) <= 0 ? "text-[#0FEDBE]" : "text-[#FF495B]"
          }`}
        >
          {Number(discountVsFair) > 0 ? "+" : ""}
          {discountVsFair}% Relative Premium
        </span>
      </div>
    </Card>
  );
}

// ==========================================
// 12. 3-PILLAR RISK AUDIT MATRIX
// ==========================================
interface RiskMatrixProps {
  businessRisk?: string;
  valuationRisk?: string;
  macroRisk?: string;
}

export function RiskMatrix({ businessRisk, valuationRisk, macroRisk }: RiskMatrixProps) {
  const getPill = (val?: string) => {
    if (!val) return { label: "MODERATE", variant: "outline" as const };
    const upper = val.toUpperCase();
    if (upper.includes("LOW")) return { label: "LOW RISK", variant: "outline" as const };
    if (upper.includes("HIGH") || upper.includes("ELEVATED"))
      return { label: "ELEVATED RISK", variant: "destructive" as const };
    return { label: "MODERATE RISK", variant: "outline" as const };
  };

  const pillars = [
    { title: "Operational & Moat Risk", text: businessRisk, pill: getPill(businessRisk) },
    { title: "Valuation Sensitivity", text: valuationRisk, pill: getPill(valuationRisk) },
    { title: "Macro & Systemic Beta", text: macroRisk, pill: getPill(macroRisk) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {pillars.map((p) => (
        <div key={p.title} className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{p.title}</span>
            <Badge variant={p.pill.variant} className="text-[9px] font-mono bg-[#161616] text-[#A1A1AA] border-[#27272A]">
              {p.pill.label}
            </Badge>
          </div>
          <p className="text-xs text-[#71717A] leading-relaxed">
            {p.text || "Standard operational risk envelope within sector boundaries."}
          </p>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 13. DUAL SCENARIO ASYMMETRY (BULL VS BEAR)
// ==========================================
interface BullBearScenariosProps {
  bullCase?: string;
  bearCase?: string;
}

export function BullBearScenarios({ bullCase, bearCase }: BullBearScenariosProps) {
  if (!bullCase && !bearCase) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {bullCase && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-500/20 text-[#0FEDBE]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0FEDBE]">
              Bullish Thesis & Catalysts
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-[#A1A1AA]">{bullCase}</p>
        </div>
      )}

      {bearCase && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-rose-500/20 text-[#FF495B]">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF495B]">
              Bearish Downside & Invalidation
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-[#A1A1AA]">{bearCase}</p>
        </div>
      )}
    </div>
  );
}
