"use server";

import { connectToDatabase } from "@/database/mongoose";
import { AnalysisHistoryModel } from "@/database/models/analysis-history.model";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";

export async function saveAnalysisToHistory(data: {
  symbol: string;
  timeframe: string;
  riskProfile: string;
  analysis: string;
  confidenceScore: number;
  decision: string;
}) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const doc = await AnalysisHistoryModel.create({
      userId: session.user.id,
      ...data,
    });

    return { success: true, id: doc._id.toString() };
  } catch (error) {
    console.error("Failed to save analysis history:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getAnalysisHistory() {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const history = await AnalysisHistoryModel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(history)) 
    };
  } catch (error) {
    console.error("Failed to fetch analysis history:", error);
    return { success: false, error: "Database error", data: [] };
  }
}
