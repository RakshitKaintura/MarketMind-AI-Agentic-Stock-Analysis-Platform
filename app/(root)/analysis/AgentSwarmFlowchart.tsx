"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  TrendingUp,
  BarChart3,
  Activity,
  ShieldAlert,
  Users,
  Target,
  Scale,
  CheckCircle2,
  Clock,
  Terminal,
  Cpu,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentSwarmFlowchartProps {
  symbol: string;
}

type NodeStatus = "waiting" | "active" | "completed";

interface AgentNode {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  phase: number;
}

const SPECIALIST_NODES: AgentNode[] = [
  {
    id: "technical",
    name: "Technical Analyst",
    role: "Momentum & Support Ribbon",
    icon: TrendingUp,
    phase: 2,
  },
  {
    id: "fundamental",
    name: "Fundamental Analyst",
    role: "Valuation & Solvency",
    icon: BarChart3,
    phase: 2,
  },
  {
    id: "sentiment",
    name: "Sentiment Analyst",
    role: "Market Flow & Positioning",
    icon: Activity,
    phase: 2,
  },
  {
    id: "risk",
    name: "Risk Specialist",
    role: "Drawdown & Beta Matrix",
    icon: ShieldAlert,
    phase: 2,
  },
  {
    id: "peers",
    name: "Peer Comparator",
    role: "Sector Benchmarking",
    icon: Users,
    phase: 2,
  },
];

export function AgentSwarmFlowchart({ symbol }: AgentSwarmFlowchartProps) {
  const [elapsed, setElapsed] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulation timer tracking elapsed execution time
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const sec = ((Date.now() - startTime) / 1000).toFixed(1);
      setElapsed(parseFloat(sec));
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Progressive phase transitions and live execution terminal logs
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    // Phase 1: Ingestion
    setCurrentPhase(1);
    setLogs([
      `[00:00.8] DataCollector: Ingesting live market candles, 52W range, and Yahoo Finance quotes for ${symbol}...`,
      `[00:01.5] DataCollector: Computing 20+ quantitative indicators (RSI-14, SMA-20/50/200, Supertrend, Bollinger Bands, ADX)...`,
    ]);

    // Phase 2: Parallel Specialist Swarm (2.2s)
    timeouts.push(
      setTimeout(() => {
        setCurrentPhase(2);
        setLogs((prev) => [
          ...prev,
          `[00:02.4] LangGraph Dispatcher: Fanning out collected data to 5 concurrent micro-specialist agents...`,
          `[00:02.9] TechnicalAnalyst: Inspecting moving average ribbon and momentum divergence...`,
          `[00:03.4] FundamentalAnalyst: Evaluating sector P/E benchmarks, ROE, and debt-to-equity leverage...`,
          `[00:03.9] SentimentAnalyst: Auditing Money Flow Index (MFI), OBV, and market positioning...`,
          `[00:04.4] RiskAnalyst: Simulating maximum historical drawdown envelope and systemic beta...`,
          `[00:04.8] PeerComparator: Benchmarking relative multiple compression against sector peers...`,
        ]);
      }, 2200)
    );

    // Phase 3: Chief Analyst Synthesis (5.5s)
    timeouts.push(
      setTimeout(() => {
        setCurrentPhase(3);
        setLogs((prev) => [
          ...prev,
          `[00:05.6] ChiefAnalyst: All 5 specialist reports received. Synthesizing committee consensus...`,
          `[00:06.2] ChiefAnalyst: Calculating price target horizons (1-3M, 3-6M, 6-12M) and stop-loss floor...`,
          `[00:06.9] ChiefAnalyst: Formulating bull vs bear thesis and operational invalidation triggers...`,
        ]);
      }, 5500)
    );

    // Phase 4: Deterministic Scoring Engine (8.0s)
    timeouts.push(
      setTimeout(() => {
        setCurrentPhase(4);
        setLogs((prev) => [
          ...prev,
          `[00:08.1] ScoringEngine: Applying mathematical multi-factor scoring formula with sector penalties...`,
          `[00:08.7] ScoringEngine: Lock established. Compiling institutional report payload...`,
        ]);
      }, 8000)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [symbol]);

  // Node status resolver based on current pipeline phase
  const getNodeStatus = (nodePhase: number): NodeStatus => {
    if (currentPhase > nodePhase) return "completed";
    if (currentPhase === nodePhase) return "active";
    return "waiting";
  };

  const collectorStatus = getNodeStatus(1);
  const specialistStatus = getNodeStatus(2);
  const chiefStatus = getNodeStatus(3);
  const scoringStatus = getNodeStatus(4);

  return (
    <div className="w-full rounded-xl border border-[#27272A] bg-[#0A0A0A] p-6 shadow-2xl space-y-6 animate-in fade-in duration-500">
      {/* 1. Header: Live Pipeline Status & Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-white" />
              Autonomous Swarm Pipeline Telemetry
            </h3>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            Real-time execution DAG for <span className="font-mono text-white font-bold">{symbol}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#27272A] text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="text-[#71717A]">Elapsed:</span>
            <span className="font-bold text-white">{elapsed.toFixed(1)}s</span>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-[#27272A] text-white bg-[#111111]">
            {currentPhase === 1
              ? "Phase 1: Ingestion"
              : currentPhase === 2
              ? "Phase 2: Specialist Swarm"
              : currentPhase === 3
              ? "Phase 3: Synthesis"
              : "Phase 4: Scoring Engine"}
          </Badge>
        </div>
      </div>

      {/* 2. Visual Flowchart (DAG Node Architecture) */}
      <div className="relative py-2 space-y-6">
        {/* ========================================= */}
        {/* STAGE 1: DATA INGESTION & INDICATORS */}
        {/* ========================================= */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-md rounded-xl border p-4 transition-all duration-300 ${
              collectorStatus === "active"
                ? "border-white bg-[#161616] shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                : collectorStatus === "completed"
                ? "border-[#27272A] bg-[#111111]"
                : "border-[#27272A]/50 bg-[#0A0A0A] opacity-40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg border ${
                    collectorStatus === "active"
                      ? "bg-white text-black border-white"
                      : collectorStatus === "completed"
                      ? "bg-[#161616] border-[#27272A] text-white"
                      : "bg-[#111111] border-[#27272A] text-[#71717A]"
                  }`}
                >
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-white">
                      Node 1: Data Ingestion & Indicator Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Live Yahoo Candles • 20+ Technical Metrics • SEC/BSE Data
                  </p>
                </div>
              </div>

              {collectorStatus === "completed" ? (
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Done</span>
                </div>
              ) : collectorStatus === "active" ? (
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Ingesting...</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[#71717A]">Waiting</span>
              )}
            </div>
          </div>

          {/* Connecting Arrow Flowing Down */}
          <div className="flex flex-col items-center my-1.5">
            <div
              className={`w-0.5 h-6 transition-all duration-300 ${
                collectorStatus === "completed"
                  ? "bg-white"
                  : collectorStatus === "active"
                  ? "bg-white/40 animate-pulse"
                  : "bg-[#27272A]"
              }`}
            />
            <div className="w-full max-w-2xl flex items-center justify-center relative">
              <div
                className={`h-0.5 w-full transition-all duration-300 ${
                  collectorStatus === "completed"
                    ? "bg-[#27272A]"
                    : "bg-[#27272A]/40"
                }`}
              />
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* STAGE 2: PARALLEL SPECIALIST SWARM (5 NODES) */}
        {/* ========================================= */}
        <div className="space-y-2">
          <div className="text-center">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#A1A1AA] px-3 py-1 rounded-full bg-[#111111] border border-[#27272A]">
              Parallel Specialist Swarm Layer (5 Nodes)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {SPECIALIST_NODES.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.id}
                  className={`rounded-xl border p-3.5 transition-all duration-300 flex flex-col justify-between ${
                    specialistStatus === "active"
                      ? "border-white bg-[#161616] shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                      : specialistStatus === "completed"
                      ? "border-[#27272A] bg-[#111111]"
                      : "border-[#27272A]/50 bg-[#0A0A0A] opacity-40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg border bg-[#161616] border-[#27272A] text-white">
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {specialistStatus === "completed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : specialistStatus === "active" ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-[#71717A]" />
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white font-mono leading-tight">
                      {node.name}
                    </h4>
                    <p className="text-[10px] text-[#71717A] mt-1 leading-snug">{node.role}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#27272A] flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#71717A]">Specialist</span>
                    <span
                      className={`text-[9px] font-mono font-bold ${
                        specialistStatus === "completed"
                          ? "text-white"
                          : specialistStatus === "active"
                          ? "text-white animate-pulse"
                          : "text-[#71717A]"
                      }`}
                    >
                      {specialistStatus === "completed"
                        ? "Verified"
                        : specialistStatus === "active"
                        ? "Auditing..."
                        : "Queued"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Converging Lines Flowing Down */}
          <div className="flex flex-col items-center my-2">
            <div className="w-full max-w-2xl flex items-center justify-center relative">
              <div
                className={`h-0.5 w-full transition-all duration-300 ${
                  specialistStatus === "completed"
                    ? "bg-[#27272A]"
                    : "bg-[#27272A]/40"
                }`}
              />
            </div>
            <div
              className={`w-0.5 h-6 transition-all duration-300 ${
                specialistStatus === "completed"
                  ? "bg-white"
                  : specialistStatus === "active"
                  ? "bg-white/40 animate-pulse"
                  : "bg-[#27272A]"
              }`}
            />
          </div>
        </div>

        {/* ========================================= */}
        {/* STAGE 3: CHIEF ANALYST SYNTHESIS & SCORING */}
        {/* ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* Node 3: Chief Analyst */}
          <div
            className={`rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${
              chiefStatus === "active"
                ? "border-white bg-[#161616] shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                : chiefStatus === "completed"
                ? "border-[#27272A] bg-[#111111]"
                : "border-[#27272A]/50 bg-[#0A0A0A] opacity-40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg border ${
                    chiefStatus === "active"
                      ? "bg-white text-black border-white"
                      : chiefStatus === "completed"
                      ? "bg-[#161616] border-[#27272A] text-white"
                      : "bg-[#111111] border-[#27272A] text-[#71717A]"
                  }`}
                >
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono text-white">
                    Node 3: Chief Analyst Synthesis
                  </h4>
                  <p className="text-[10px] text-[#71717A]">
                    Resolves consensus, horizon price targets & scenarios
                  </p>
                </div>
              </div>

              {chiefStatus === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : chiefStatus === "active" ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[#71717A]" />
              )}
            </div>

            <div className="mt-2 text-[10px] font-mono text-[#71717A] flex justify-between">
              <span>Swarm Committee Weight</span>
              <span className="text-white font-bold">100% Convergence</span>
            </div>
          </div>

          {/* Node 4: Deterministic Scoring Engine */}
          <div
            className={`rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${
              scoringStatus === "active"
                ? "border-white bg-[#161616] shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                : scoringStatus === "completed"
                ? "border-[#27272A] bg-[#111111]"
                : "border-[#27272A]/50 bg-[#0A0A0A] opacity-40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg border ${
                    scoringStatus === "active"
                      ? "bg-white text-black border-white"
                      : scoringStatus === "completed"
                      ? "bg-[#161616] border-[#27272A] text-white"
                      : "bg-[#111111] border-[#27272A] text-[#71717A]"
                  }`}
                >
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono text-white">
                    Node 4: Multi-Factor Scoring Engine
                  </h4>
                  <p className="text-[10px] text-[#71717A]">
                    Mathematical 0-100 score & dynamic decision rules
                  </p>
                </div>
              </div>

              {scoringStatus === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : scoringStatus === "active" ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[#71717A]" />
              )}
            </div>

            <div className="mt-2 text-[10px] font-mono text-[#71717A] flex justify-between">
              <span>Final Gate</span>
              <span className="text-white font-bold">Deterministic V2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Execution Terminal Feed */}
      <div className="rounded-xl border border-[#27272A] bg-[#050505] p-4 space-y-2">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
            <Terminal className="w-3.5 h-3.5 text-white" />
            <span>Agent Swarm Execution Log Feed</span>
          </div>
          <span className="text-[10px] font-mono text-[#71717A]">Live SSE Telemetry</span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px] text-[#A1A1AA] custom-scrollbar pr-1">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed animate-in fade-in">
              <span className="text-white shrink-0 font-bold">›</span>
              <span className="text-[#A1A1AA]">{log}</span>
            </div>
          ))}
          {scoringStatus === "active" && (
            <div className="flex items-center gap-2 text-white animate-pulse">
              <span className="font-bold">›</span>
              <span>Finalizing institutional report payload...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
