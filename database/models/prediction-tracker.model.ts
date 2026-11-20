import { Schema, model, models, type Model } from "mongoose";

export interface IPredictionTracker {
  userId: string;
  symbol: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  decision: string;
  priceAtPrediction: number;
  targetPrice?: number;
  timeframe: string;
  verifyAfter: Date;
  actualPrice?: number;
  wasCorrect?: boolean;
  errorPercent?: number;
  createdAt: Date;
}

const PredictionTrackerSchema = new Schema<IPredictionTracker>({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },
  direction: {
    type: String,
    enum: ["BULLISH", "BEARISH", "NEUTRAL"],
    required: true,
  },
  decision: { type: String, required: true },
  priceAtPrediction: { type: Number, required: true },
  targetPrice: { type: Number },
  timeframe: { type: String, required: true },
  verifyAfter: { type: Date, required: true, index: true },
  actualPrice: { type: Number },
  wasCorrect: { type: Boolean },
  errorPercent: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export const PredictionTrackerModel: Model<IPredictionTracker> =
  (models?.PredictionTracker as Model<IPredictionTracker>) ||
  model<IPredictionTracker>("PredictionTracker", PredictionTrackerSchema);
