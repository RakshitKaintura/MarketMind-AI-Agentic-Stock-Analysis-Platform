import { PeerReportSchema, validateAgentOutput } from "../schemas";
import type { PeerReport, MarketData, BaseLLM } from "../types";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";

const SECTOR_PEERS: Record<string, string[]> = {
  Technology: ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS"],
  "Financial Services": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "AXISBANK.NS"],
  "Consumer Defensive": ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS"],
  Energy: ["RELIANCE.NS", "ONGC.NS", "BPCL.NS", "IOC.NS", "NTPC.NS"],
  Healthcare: ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS"],
  Industrials: ["LT.NS", "SIEMENS.NS", "ABB.NS", "HAL.NS", "BEL.NS"],
  "Consumer Cyclical": ["TATAMOTORS.NS", "M&M.NS", "MARUTI.NS", "BAJAJ-AUTO.NS", "HEROMOTOCO.NS"],
  "Basic Materials": ["TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "ULTRACEMCO.NS", "SHREECEM.NS"],
  "Communication Services": ["BHARTIARTL.NS", "IDEA.NS", "TATACOMM.NS"],
  "Real Estate": ["DLF.NS", "GODREJPROP.NS", "OBEROIRLTY.NS", "PRESTIGE.NS"],
};

export async function comparePeers(
  llm: BaseLLM | null,
  market: MarketData
): Promise<PeerReport> {
  const peerSymbols = (SECTOR_PEERS[market.sector] || [])
    .filter((s) => s !== market.symbol)
    .slice(0, 4);

  if (peerSymbols.length === 0) {
    return {
      peers: [],
      relativeValuation: "IN_LINE",
      relativeStrength: "IN_LINE",
      keyObservation: `Direct sector peers for "${market.sector}" are not pre-mapped; valuation evaluated against broad market multiples.`,
    };
  }

  const peerDetails = await Promise.all(
    peerSymbols.map(async (sym) => {
      const d = await getStocksDetails(sym).catch(() => null);
      if (!d) return null;
      const parseNum = (str?: string) => {
        if (!str || str === "—") return null;
        const val = parseFloat(str.replace(/[^0-9.-]/g, ""));
        return Number.isFinite(val) ? val : null;
      };
      return {
        symbol: d.symbol,
        company: d.company,
        pe: parseNum(d.peRatio),
        roe: parseNum(d.roe),
        growth: parseNum(d.earningsGrowth),
        priceChange: d.changePercent,
      };
    })
  );

  const validPeers = peerDetails.filter(Boolean) as PeerReport["peers"];

  if (!llm) {
    return buildFallbackPeer(market, validPeers);
  }

  const peerSummary = validPeers
    .map(
      (p) =>
        `${p.company} (${p.symbol}): P/E=${p.pe ?? "N/A"}, ROE=${p.roe ?? "N/A"}%, Growth=${p.growth ?? "N/A"}%, Change=${p.priceChange.toFixed(2)}%`
    )
    .join("\n");

  const prompt = `You are an Equity Research Peer Benchmark Specialist.
Compare ${market.symbol} (${market.company}) against its direct industry peers.

TARGET STOCK:
${market.company} (${market.symbol}): P/E=${market.peRatio ?? "N/A"}, ROE=${market.roe !== null ? (market.roe * 100).toFixed(1) + "%" : "N/A"}, Today's Change=${market.changePercent.toFixed(2)}%

INDUSTRY PEERS (${market.sector}):
${peerSummary || "No direct peer figures available"}

TASK:
1. Determine relativeValuation: "CHEAPER" | "IN_LINE" | "EXPENSIVE" vs peer average P/E.
2. Determine relativeStrength: "OUTPERFORMING" | "IN_LINE" | "UNDERPERFORMING" vs peer average price action.
3. Provide a concise 2-3 sentence observation on comparative competitive advantages or valuation discounts.

REQUIRED OUTPUT:
Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "peers": [
    {
      "symbol": "<symbol>",
      "company": "<company>",
      "pe": <number | null>,
      "roe": <number | null>,
      "growth": <number | null>,
      "priceChange": <number>
    }
  ],
  "relativeValuation": "CHEAPER" | "IN_LINE" | "EXPENSIVE",
  "relativeStrength": "OUTPERFORMING" | "IN_LINE" | "UNDERPERFORMING",
  "keyObservation": "<2-3 sentence peer comparison summary>"
}`;

  try {
    const response = await llm.invoke(prompt);
    const text = typeof response.content === "string" ? response.content : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validation = validateAgentOutput(PeerReportSchema, parsed, "PeerComparator");
    if (validation.ok) return validation.data;
    return buildFallbackPeer(market, validPeers);
  } catch (error) {
    console.error("[PeerComparator] Error:", error);
    return buildFallbackPeer(market, validPeers);
  }
}

function buildFallbackPeer(
  market: MarketData,
  peers: PeerReport["peers"]
): PeerReport {
  const avgPeerPE = peers.filter((p) => p.pe !== null).map((p) => p.pe!);
  const peerAvgPE =
    avgPeerPE.length > 0
      ? avgPeerPE.reduce((a, b) => a + b, 0) / avgPeerPE.length
      : null;
  const myPE = market.peRatio;

  const valuation =
    peerAvgPE === null || myPE === null
      ? "IN_LINE"
      : myPE < peerAvgPE * 0.88
      ? "CHEAPER"
      : myPE > peerAvgPE * 1.12
      ? "EXPENSIVE"
      : "IN_LINE";

  const peerAvgChange =
    peers.length > 0
      ? peers.reduce((a, p) => a + p.priceChange, 0) / peers.length
      : 0;

  const strength =
    market.changePercent > peerAvgChange + 0.6
      ? "OUTPERFORMING"
      : market.changePercent < peerAvgChange - 0.6
      ? "UNDERPERFORMING"
      : "IN_LINE";

  return {
    peers,
    relativeValuation: valuation,
    relativeStrength: strength,
    keyObservation: `${market.company} trades at P/E ${myPE ? myPE.toFixed(1) : "—"} compared to the sector peer mean of ${peerAvgPE ? peerAvgPE.toFixed(1) : "—"}, showing ${valuation.toLowerCase()} relative valuation.`,
  };
}
