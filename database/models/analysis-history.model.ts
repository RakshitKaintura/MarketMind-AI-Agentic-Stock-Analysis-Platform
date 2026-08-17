import { Schema, model, models, type Model, Types } from 'mongoose';

export interface IAnalysisHistory {
  userId: string;
  symbol: string;
  timeframe: string;
  riskProfile: string;
  analysis: string;
  confidenceScore: number;
  decision: string;
  createdAt: Date;
}

const AnalysisHistorySchema = new Schema<IAnalysisHistory>({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },
  timeframe: { type: String, required: true },
  riskProfile: { type: String, required: true },
  analysis: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  decision: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Sort by createdAt descending for history queries
AnalysisHistorySchema.index({ userId: 1, createdAt: -1 });

export const AnalysisHistoryModel: Model<IAnalysisHistory> =
  (models?.AnalysisHistory as Model<IAnalysisHistory>) || 
  model<IAnalysisHistory>('AnalysisHistory', AnalysisHistorySchema);
