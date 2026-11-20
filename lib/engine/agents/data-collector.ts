"use server";

import _yahooFinance from "yahoo-finance2";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";
import * as T from "../indicators/trend";
import * as M from "../indicators/momentum";
import * as V from "../indicators/volatility";
import * as Vol from "../indicators/volume";
import type { CollectedData, MarketData, TechnicalIndicators } from "../types";

const yahooFinanceModule = (_yahooFinance as any).default || _yahooFinance;
const yahooFinance =
  typeof yahooFinanceModule === "function"
    ? new yahooFinanceModule()
    : yahooFinanceModule;

if (yahooFinance && yahooFinance.suppressNotices) {
  yahooFinance.suppressNotices(["yahooSurvey", "validation", "ripHistorical"]);
}

export async function collectData(symbol: string): Promise<CollectedData | null> {
  try {
    const details = await getStocksDetails(symbol);
    if (!details) return null;

    const cleanSymbol = symbol.trim().toUpperCase();

    // Fetch daily historical chart data for indicator calculations
    const historical = await yahooFinance
      .chart(cleanSymbol, {
        period1: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240),
        period2: new Date(),
        interval: "1d",
      })
      .catch(() => null);

    const chartQuotes = historical?.quotes || [];
    const closes: number[] = chartQuotes
      .map((q: any) => q?.close)
      .filter((v: unknown): v is number => typeof v === "number" && Number.isFinite(v));
    const highs: number[] = chartQuotes
      .map((q: any) => q?.high)
      .filter((v: unknown): v is number => typeof v === "number" && Number.isFinite(v));
    const lows: number[] = chartQuotes
      .map((q: any) => q?.low)
      .filter((v: unknown): v is number => typeof v === "number" && Number.isFinite(v));
    const volumes: number[] = chartQuotes
      .map((q: any) => q?.volume)
      .filter((v: unknown): v is number => typeof v === "number" && Number.isFinite(v));

    const parseNum = (str?: string | null) => {
      if (!str || str === "—") return null;
      const cleaned = str.replace(/[^0-9.-]/g, "");
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : null;
    };

    const market: MarketData = {
      symbol: details.symbol,
      company: details.company,
      sector: details.sector || "—",
      industry: details.industry || "—",
      currentPrice: details.currentPrice,
      changePercent: details.changePercent,
      fiftyTwoWeekHigh: parseNum(details.fiftyTwoWeekHigh) || details.currentPrice,
      fiftyTwoWeekLow: parseNum(details.fiftyTwoWeekLow) || details.currentPrice,
      fiftyDayAvg: parseNum(details.fiftyDayAverage) || details.currentPrice,
      twoHundredDayAvg: parseNum(details.twoHundredDayAverage) || details.currentPrice,
      marketCap: parseNum(details.marketCapFormatted) || 0,
      volume: volumes.length > 0 ? volumes[volumes.length - 1] : 0,
      peRatio: parseNum(details.peRatio),
      pbRatio: parseNum(details.pbRatio),
      roe: parseNum(details.roe),
      debtToEquity: parseNum(details.debtToEquity),
      netMargin: parseNum(details.netMargin),
      operatingMargin: parseNum(details.operatingMargin),
      revenueGrowth: parseNum(details.revenueGrowth),
      earningsGrowth: parseNum(details.earningsGrowth),
      epsTrailing: parseNum(details.epsTrailing),
      epsForward: parseNum(details.epsForward),
      currentRatio: parseNum(details.currentRatio),
      quickRatio: parseNum(details.quickRatio),
      dividendYield: parseNum(details.dividendYield),
      beta: parseNum(details.beta),
      freeCashflow: parseNum(details.freeCashflow),
      operatingCashflow: parseNum(details.operatingCashflow),
      analystTarget: parseNum(details.targetMeanPrice),
      analystRecommendation: details.recommendationKey !== "—" ? details.recommendationKey : null,
    };

    // Calculate 20+ indicators
    const indicators: TechnicalIndicators = {
      sma20: T.sma(closes, 20),
      sma50: T.sma(closes, 50),
      sma200: T.sma(closes, 200),
      ema12: T.ema(closes, 12),
      ema26: T.ema(closes, 26),
      adx: T.adx(highs, lows, closes),
      supertrend: T.supertrend(highs, lows, closes),
      rsi14: M.rsi(closes),
      macd: M.macd(closes),
      stochastic: M.stochastic(closes, highs, lows),
      williamsR: M.williamsR(closes, highs, lows),
      atr14: V.atr(highs, lows, closes),
      bollingerBands: V.bollingerBands(closes),
      keltnerChannel: V.keltnerChannel(highs, lows, closes),
      annualizedVolatility: V.annualizedVolatility(closes),
      obv: Vol.obv(closes, volumes),
      vwap: Vol.vwap(closes, highs, lows, volumes),
      mfi: Vol.mfi(closes, highs, lows, volumes),
      volumeTrend: Vol.volumeTrend(volumes),
    };

    const indicatorList: string[] = [];
    for (const [key, value] of Object.entries(indicators)) {
      if (value !== null) indicatorList.push(key);
    }

    return {
      market,
      indicators,
      news: [],
      closes,
      indicatorList,
    };
  } catch (error) {
    console.error("[DataCollector] Failed to collect stock data:", error);
    return null;
  }
}
