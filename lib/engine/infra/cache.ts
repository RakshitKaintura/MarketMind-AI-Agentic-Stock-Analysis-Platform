import { connectToDatabase } from "@/database/mongoose";
import { AnalysisCacheModel } from "@/database/models/analysis-cache.model";

export async function getCachedAnalysis(
  symbol: string,
  timeframe: string,
  riskProfile: string
) {
  try {
    await connectToDatabase();
    const cached = await AnalysisCacheModel.findOne({
      symbol,
      timeframe,
      riskProfile,
    }).lean();
    if (!cached) return null;

    // Invalidate stale fallback cache so fresh AI analysis can run
    if (
      cached.analysis?.includes("Sustained earnings delivery") ||
      cached.analysis?.includes("Data unavailable") ||
      cached.analysis?.includes("Broader market volatility")
    ) {
      await AnalysisCacheModel.deleteOne({ _id: (cached as any)._id }).catch(() => {});
      return null;
    }

    return cached;
  } catch (error) {
    console.error("[Cache] Read error:", error);
    return null;
  }
}

export async function cacheAnalysis(
  symbol: string,
  timeframe: string,
  riskProfile: string,
  stockData: string,
  newsData: string,
  analysis: string
) {
  try {
    // Never cache generic fallback text
    if (
      analysis.includes("Sustained earnings delivery") ||
      analysis.includes("Data unavailable") ||
      analysis.includes("Broader market volatility")
    ) {
      return;
    }

    await connectToDatabase();
    await AnalysisCacheModel.findOneAndUpdate(
      { symbol, timeframe, riskProfile },
      { stockData, newsData, analysis, createdAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("[Cache] Write error:", error);
  }
}
