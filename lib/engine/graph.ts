import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { collectData } from "./agents/data-collector";
import { analyzeTechnicals } from "./agents/technical-analyst";
import { analyzeFundamentals } from "./agents/fundamental-analyst";
import { analyzeSentiment } from "./agents/sentiment-analyst";
import { assessRisk } from "./agents/risk-analyst";
import { comparePeers } from "./agents/peer-comparator";
import { synthesize } from "./agents/chief-analyst";
import { computeFinalScore } from "./scoring";
import type { FinalAnalysis, Timeframe, RiskProfile, BaseLLM } from "./types";

export const EngineState = Annotation.Root({
  symbol: Annotation<string>,
  timeframe: Annotation<string>,
  riskProfile: Annotation<string>,
  collectedData: Annotation<string>,
  technicalReport: Annotation<string>,
  fundamentalReport: Annotation<string>,
  sentimentReport: Annotation<string>,
  riskReport: Annotation<string>,
  peerReport: Annotation<string>,
  chiefReport: Annotation<string>,
  finalScore: Annotation<string>,
});

export function buildAnalysisGraph(llm: BaseLLM | null) {
  // Node 1: Collect Data (market data + 20 indicators + news)
  const collectNode = async (state: typeof EngineState.State) => {
    const data = await collectData(state.symbol);
    return {
      collectedData: JSON.stringify(data),
    };
  };

  // Node 2: Technical Analyst
  const technicalNode = async (state: typeof EngineState.State) => {
    const data = state.collectedData ? JSON.parse(state.collectedData) : null;
    if (!data) {
      return {
        technicalReport: JSON.stringify({
          score: 50,
          regime: "RANGING",
          signals: ["Data unavailable"],
          supportLevel: 0,
          resistanceLevel: 0,
          trendStrength: "WEAK",
          keyObservation: "Technical data unavailable.",
        }),
      };
    }
    const report = await analyzeTechnicals(
      llm,
      data.market,
      data.indicators,
      data.indicatorList
    );
    return { technicalReport: JSON.stringify(report) };
  };

  // Node 3: Fundamental Analyst
  const fundamentalNode = async (state: typeof EngineState.State) => {
    const data = state.collectedData ? JSON.parse(state.collectedData) : null;
    if (!data) {
      return {
        fundamentalReport: JSON.stringify({
          score: 50,
          valuationVerdict: "FAIRLY_VALUED",
          profitabilityGrade: "C",
          growthOutlook: "Data unavailable",
          balanceSheetHealth: "Data unavailable",
          cashFlowQuality: "Data unavailable",
          keyObservation: "Fundamental data unavailable.",
        }),
      };
    }
    const report = await analyzeFundamentals(llm, data.market);
    return {
      fundamentalReport: JSON.stringify(report),
    };
  };

  // Node 4: Sentiment Analyst
  const sentimentNode = async (state: typeof EngineState.State) => {
    const data = state.collectedData ? JSON.parse(state.collectedData) : null;
    if (!data) {
      return {
        sentimentReport: JSON.stringify({
          score: 50,
          overallMood: "NEUTRAL",
          headlines: [],
          keyDrivers: ["Data unavailable"],
          keyObservation: "Sentiment data unavailable.",
        }),
      };
    }
    const report = await analyzeSentiment(llm, data.market, data.indicators);
    return {
      sentimentReport: JSON.stringify(report),
    };
  };

  // Node 5: Risk Analyst
  const riskNode = async (state: typeof EngineState.State) => {
    const data = state.collectedData ? JSON.parse(state.collectedData) : null;
    if (!data) {
      return {
        riskReport: JSON.stringify({
          overallRisk: "MEDIUM",
          score: 50,
          businessRisk: { level: "MEDIUM", detail: "Data unavailable" },
          valuationRisk: { level: "MEDIUM", detail: "Data unavailable" },
          macroRisk: { level: "MEDIUM", detail: "Data unavailable" },
          liquidityRisk: { level: "LOW", detail: "Data unavailable" },
          keyObservation: "Risk data unavailable.",
        }),
      };
    }
    const report = await assessRisk(llm, data.market, data.indicators);
    return { riskReport: JSON.stringify(report) };
  };

  // Node 6: Peer Comparator
  const peerNode = async (state: typeof EngineState.State) => {
    const data = state.collectedData ? JSON.parse(state.collectedData) : null;
    if (!data) {
      return {
        peerReport: JSON.stringify({
          peers: [],
          relativeValuation: "IN_LINE",
          relativeStrength: "IN_LINE",
          keyObservation: "Peer data unavailable.",
        }),
      };
    }
    const report = await comparePeers(llm, data.market);
    return { peerReport: JSON.stringify(report) };
  };

  // Node 7: Chief Analyst (Synthesizes all 5 specialists)
  const chiefNode = async (state: typeof EngineState.State) => {
    const data = state.collectedData ? JSON.parse(state.collectedData) : null;
    const technical = state.technicalReport ? JSON.parse(state.technicalReport) : null;
    const fundamental = state.fundamentalReport ? JSON.parse(state.fundamentalReport) : null;
    const sentiment = state.sentimentReport ? JSON.parse(state.sentimentReport) : null;
    const risk = state.riskReport ? JSON.parse(state.riskReport) : null;
    const peers = state.peerReport ? JSON.parse(state.peerReport) : null;

    if (!data || !technical || !fundamental || !sentiment || !risk || !peers) {
      return {
        chiefReport: "{}",
      };
    }

    const synthesis = await synthesize(
      llm,
      data.market,
      technical,
      fundamental,
      sentiment,
      risk,
      peers,
      state.timeframe,
      state.riskProfile
    );

    return { chiefReport: synthesis };
  };

  // Node 8: Deterministic Scoring (Runs after all specialists finish)
  const scoringNode = async (state: typeof EngineState.State) => {
    const data = state.collectedData ? JSON.parse(state.collectedData) : null;
    const technical = state.technicalReport ? JSON.parse(state.technicalReport) : null;
    const fundamental = state.fundamentalReport ? JSON.parse(state.fundamentalReport) : null;
    const sentiment = state.sentimentReport ? JSON.parse(state.sentimentReport) : null;
    const risk = state.riskReport ? JSON.parse(state.riskReport) : null;
    const peers = state.peerReport ? JSON.parse(state.peerReport) : null;

    if (!data || !technical || !fundamental || !sentiment || !risk || !peers) {
      return {
        finalScore: JSON.stringify({
          overallScore: 50,
          decision: "HOLD",
          confidence: "LOW",
        }),
      };
    }

    const scores = computeFinalScore(
      data.market,
      technical,
      fundamental,
      sentiment,
      risk,
      peers,
      state.timeframe,
      state.riskProfile
    );

    return { finalScore: JSON.stringify(scores) };
  };

  // Assemble the LangGraph StateGraph
  return new StateGraph(EngineState)
    .addNode("collect", collectNode)
    .addNode("technical", technicalNode)
    .addNode("fundamental", fundamentalNode)
    .addNode("sentiment", sentimentNode)
    .addNode("risk", riskNode)
    .addNode("peers", peerNode)
    .addNode("chief", chiefNode)
    .addNode("scoring", scoringNode)
    .addEdge(START, "collect")
    .addEdge("collect", "technical")
    .addEdge("collect", "fundamental")
    .addEdge("collect", "sentiment")
    .addEdge("collect", "risk")
    .addEdge("collect", "peers")
    .addEdge("technical", "chief")
    .addEdge("fundamental", "chief")
    .addEdge("sentiment", "chief")
    .addEdge("risk", "chief")
    .addEdge("peers", "chief")
    .addEdge("chief", "scoring")
    .addEdge("scoring", END)
    .compile();
}

export type { FinalAnalysis, Timeframe, RiskProfile };
