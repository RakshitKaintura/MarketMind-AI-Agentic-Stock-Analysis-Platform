import { Schema, model, models, type Model } from 'mongoose';

interface AnalysisCache {
  symbol: string;
  timeframe: string;
  riskProfile: string;
  stockData: string;
  newsData?: string;
  analysis: string;
  createdAt: Date;
}

const AnalysisCacheSchema = new Schema<AnalysisCache>({
  symbol: { type: String, required: true },
  timeframe: { type: String, required: true },
  riskProfile: { type: String, required: true },
  stockData: { type: String, required: true },
  newsData: { type: String, required: false },
  analysis: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // Auto-delete after 1 hour
});

AnalysisCacheSchema.index({ symbol: 1, timeframe: 1, riskProfile: 1 });

export const AnalysisCacheModel: Model<AnalysisCache> =
  (models?.AnalysisCache as Model<AnalysisCache>) || 
  model<AnalysisCache>('AnalysisCache', AnalysisCacheSchema);
