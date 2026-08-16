"use server";

import _yahooFinance from "yahoo-finance2";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getWatchlistSymbolsByEmail } from "./watchlist.actions";

// ─── 0. Yahoo Finance Configuration ──────────────────────────────────────────
const yahooFinanceModule = (_yahooFinance as any).default || _yahooFinance;
const yahooFinance = typeof yahooFinanceModule === "function" 
  ? new yahooFinanceModule() 
  : yahooFinanceModule;

if (yahooFinance && yahooFinance.suppressNotices) {
  yahooFinance.suppressNotices(['yahooSurvey', 'validation']);
}

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  datetime: string;
  source: string;
  image: string | null;
}

// ─── Formatters ─────────────────────────────────────────────────────────────
const formatPrice = (number: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(number);
const formatMarketCap = (number: number) => !number ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 2 }).format(number);
const formatPercent = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "—";

const formatNumber = (value?: number | null, digits = 2) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";

const calculateSMA = (values: number[], period: number) => {
  if (values.length < period) return null;
  const window = values.slice(-period);
  const total = window.reduce((sum, value) => sum + value, 0);
  return total / period;
};

const calculateRSI = (values: number[], period = 14) => {
  if (values.length <= period) return null;

  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const change = curr - prev;

    if (change > 0) gains += change;
    if (change < 0) losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
};

const calculateVolatility = (values: number[]) => {
  if (values.length < 21) return null;

  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    if (!prev) continue;
    returns.push((values[i] - prev) / prev);
  }

  if (returns.length === 0) return null;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;

  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

const calculateEMA = (values: number[], period: number) => {
  if (values.length < period) return null;
  const multiplier = 2 / (period + 1);
  
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
  }
  return ema;
};

const calculateMACD = (values: number[]) => {
  const ema12 = calculateEMA(values, 12);
  const ema26 = calculateEMA(values, 26);
  
  if (ema12 === null || ema26 === null) return null;
  
  const macdLine = ema12 - ema26;
  return {
    macdLine,
    signal: macdLine > 0 ? "Bullish" : "Bearish",
  };
};

const calculateBollingerBands = (values: number[], period = 20) => {
  if (values.length < period) return null;
  
  const slice = values.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(
    slice.reduce((sum, v) => sum + (v - sma) ** 2, 0) / period
  );
  
  const currentPrice = values[values.length - 1];
  return {
    upper: sma + 2 * stdDev,
    middle: sma,
    lower: sma - 2 * stdDev,
    percentB: ((currentPrice - (sma - 2 * stdDev)) / (4 * stdDev)) * 100,
  };
};

const calculateVolumeTrend = (volumes: number[]) => {
  if (volumes.length < 20) return null;
  const recent10 = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const previous10 = volumes.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
  return {
    avgVolume10d: recent10,
    volumeChange: ((recent10 - previous10) / previous10) * 100,
    trend: recent10 > previous10 ? "Increasing" : "Decreasing",
  };
};

// ─── 1. Search Stocks ───────────────────────────────────────────────────────
export const searchStocks = cache(async (query?: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    const userWatchlistSymbols = await getWatchlistSymbolsByEmail(session.user.email);
    const trimmed = typeof query === "string" ? query.trim() : "";
    let results: any[] = [];

    const isIndianListing = (item: any) => {
      const symbol = String(item?.symbol || "").toUpperCase();
      const exchange = String(item?.exchange || "").toUpperCase();

      return (
        symbol.endsWith(".NS") ||
        symbol.endsWith(".BO") ||
        exchange === "NSI" ||
        exchange === "NSE" ||
        exchange === "BSE" ||
        exchange === "BOM"
      );
    };

    if (!trimmed) {
      const POPULAR_INDIAN_STOCKS = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "TATAMOTORS.NS", "LT.NS"];
      results = await Promise.all(POPULAR_INDIAN_STOCKS.map(async (sym) => {
         try { return await yahooFinance.quote(sym); } catch (e) { return null; }
      }));
    } else {
      let searchQuotes: any[] = [];

      try {
        const searchResult: any = await yahooFinance.search(trimmed);
        searchQuotes = Array.isArray(searchResult?.quotes) ? searchResult.quotes : [];
      } catch (error) {
        console.error("Search API failed, using direct symbol fallback:", error);
      }

      if (searchQuotes.length > 0) {
        results = searchQuotes.filter((q: any) => q && q.symbol && isIndianListing(q));
      }

      if (results.length === 0) {
        const compact = trimmed.toUpperCase().replace(/\s+/g, "");
        const rawCandidates = compact.includes(".")
          ? [compact]
          : [compact, `${compact}.NS`, `${compact}.BO`];

        const candidates = [...new Set(rawCandidates)];
        const fallbackQuotes = await Promise.all(
          candidates.map(async (sym) => {
            try {
              return await yahooFinance.quote(sym);
            } catch {
              return null;
            }
          })
        );

        results = fallbackQuotes.filter((q) => q && q.symbol && isIndianListing(q));
      }
    }

    const seen = new Set<string>();

    return results
      .filter((r) => r && r.symbol)
      .filter((r) => {
        const key = String(r.symbol).toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((r) => ({
        symbol: r.symbol,
        name: r.shortname || r.longname || r.displayName || r.symbol,
        exchange: r.exchange === "NSI" ? "NSE" : r.exchange,
        type: r.quoteType || "Stock",
        isInWatchlist: userWatchlistSymbols.includes(r.symbol),
      }))
      .slice(0, 15);
  } catch (error) { return []; }
});

// ─── 2. Get Stock Details ───────────────────────────────────────────────────
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  try {
    const quote: any = await yahooFinance.quote(cleanSymbol);
    const [summary, historical] = await Promise.all([
      yahooFinance.quoteSummary(cleanSymbol, {
        modules: [
          "summaryDetail",
          "defaultKeyStatistics",
          "financialData",
          "summaryProfile",
        ],
      }),
      yahooFinance.historical(cleanSymbol, {
        period1: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180),
        period2: new Date(),
        interval: "1d",
      }),
    ]);

    if (!quote || !quote.regularMarketPrice) return null;

    const companyName = quote.longname || quote.shortname || cleanSymbol;
    const closes = (Array.isArray(historical) ? historical : [])
      .map((item: any) => item?.close)
      .filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value));

    const volumes = (Array.isArray(historical) ? historical : [])
      .map((item: any) => item?.volume)
      .filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value));

    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const rsi14 = calculateRSI(closes, 14);
    const annualizedVolatility = calculateVolatility(closes);
    
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macd = calculateMACD(closes);
    const bollingerBands = calculateBollingerBands(closes);
    const volumeTrend = calculateVolumeTrend(volumes);

    const summaryDetail = summary?.summaryDetail ?? {};
    const keyStats = summary?.defaultKeyStatistics ?? {};
    const financialData = summary?.financialData ?? {};
    const profile = summary?.summaryProfile ?? {};

    return {
      symbol: cleanSymbol,
      company: companyName,
      currentPrice: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent || 0,
      priceFormatted: formatPrice(quote.regularMarketPrice),
      changeFormatted: `${(quote.regularMarketChangePercent || 0) > 0 ? "+" : ""}${(quote.regularMarketChangePercent || 0).toFixed(2)}%`,
      peRatio: formatNumber(summaryDetail?.trailingPE),
      marketCapFormatted: formatMarketCap(quote.marketCap || 0),
      sector: profile?.sector || "—",
      industry: profile?.industry || "—",
      dividendYield: formatPercent(summaryDetail?.dividendYield),
      beta: formatNumber(summaryDetail?.beta ?? keyStats?.beta),
      pbRatio: formatNumber(summaryDetail?.priceToBook),
      roe: formatPercent(financialData?.returnOnEquity),
      debtToEquity: formatNumber(financialData?.debtToEquity),
      netMargin: formatPercent(financialData?.profitMargins),
      operatingMargin: formatPercent(financialData?.operatingMargins),
      revenueGrowth: formatPercent(financialData?.revenueGrowth),
      earningsGrowth: formatPercent(financialData?.earningsGrowth),
      epsTrailing: formatNumber(keyStats?.trailingEps),
      epsForward: formatNumber(keyStats?.forwardEps),
      fiftyTwoWeekHigh: formatPrice(summaryDetail?.fiftyTwoWeekHigh || quote.fiftyTwoWeekHigh || 0),
      fiftyTwoWeekLow: formatPrice(summaryDetail?.fiftyTwoWeekLow || quote.fiftyTwoWeekLow || 0),
      fiftyDayAverage: formatPrice(summaryDetail?.fiftyDayAverage || quote.fiftyDayAverage || 0),
      twoHundredDayAverage: formatPrice(summaryDetail?.twoHundredDayAverage || quote.twoHundredDayAverage || 0),
      currentRatio: formatNumber(financialData?.currentRatio),
      quickRatio: formatNumber(financialData?.quickRatio),
      freeCashflow: formatMarketCap(financialData?.freeCashflow || 0),
      operatingCashflow: formatMarketCap(financialData?.operatingCashflow || 0),
      targetMeanPrice: formatPrice(financialData?.targetMeanPrice || 0),
      recommendationKey: financialData?.recommendationKey || "—",
      technical: {
        sma20: sma20 ? formatPrice(sma20) : "—",
        sma50: sma50 ? formatPrice(sma50) : "—",
        rsi14: rsi14 !== null ? rsi14.toFixed(2) : "—",
        annualizedVolatility:
          annualizedVolatility !== null ? `${annualizedVolatility.toFixed(2)}%` : "—",
        ema12: ema12 ? formatPrice(ema12) : "—",
        ema26: ema26 ? formatPrice(ema26) : "—",
        macdSignal: macd ? `${macd.macdLine.toFixed(2)} (${macd.signal})` : "—",
        bollingerUpper: bollingerBands ? formatPrice(bollingerBands.upper) : "—",
        bollingerLower: bollingerBands ? formatPrice(bollingerBands.lower) : "—",
        bollingerPercentB: bollingerBands ? `${bollingerBands.percentB.toFixed(2)}%` : "—",
        volumeTrend: volumeTrend ? `${volumeTrend.trend} (${volumeTrend.volumeChange > 0 ? '+' : ''}${volumeTrend.volumeChange.toFixed(2)}%)` : "—",
      },
    };
  } catch (error) { return null; }
});

// ─── 3. Get News (Google News RSS - High Accuracy Mode) ─────────────────────
export const getNews = async (companyNames?: string[], isFallbackAttempt = false): Promise<NewsItem[]> => {
  try {
    // 1. Build a "Financial Only" Query
    let query = "Indian Stock Market";

    if (companyNames && companyNames.length > 0) {
      // Take top 5 companies (increased from 3)
      const terms = companyNames.slice(0, 5).map(name => {
        // Clean the name slightly but keep it specific
        const clean = name
          .replace("Limited", "")
          .replace("Ltd", "")
          .replace("Corporation", "")
          .trim();
        return `"${clean}"`; // Quotes enforce exact match
      });

      // KEY CHANGE: We force the search to include financial context words.
      // Format: ("Reliance" OR "TCS") AND (stock OR share OR market OR price)
      const companiesGroup = `(${terms.join(" OR ")})`;
      const contextGroup = `(stock OR share OR market OR price OR sensex OR nifty)`;
      
      query = `${companiesGroup} AND ${contextGroup}`;
    }

    console.log(`Fetching Targeted News for: ${query}`);

    // 2. Fetch RSS Feed (India Edition)
    // 'when:7d' ensures we don't get ancient news
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:7d")}&hl=en-IN&gl=IN&ceid=IN:en`;
    
    const response = await fetch(rssUrl, { next: { revalidate: 1800 } }); // Cache for 30 mins
    if (!response.ok) {
      console.error(`Google News RSS request failed: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();

    // 3. Parse XML
    const items: NewsItem[] = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const titleRegex = /<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const sourceRegex = /<source url=".*?">(.*?)<\/source>/;
    const descRegex = /<description>([\s\S]*?)<\/description>/;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      if (items.length >= 10) break; // Limit to 10 items

      const itemBlock = match[0];
      const titleMatch = titleRegex.exec(itemBlock);
      const linkMatch = linkRegex.exec(itemBlock);
      const dateMatch = dateRegex.exec(itemBlock);
      const sourceMatch = sourceRegex.exec(itemBlock);
      const descMatch = descRegex.exec(itemBlock);

      // Try to extract an image from description HTML (Google sometimes puts it there)
      let imageUrl: string | null = null;
      if (descMatch) {
        const imgMatch = /src="(.*?)"/.exec(descMatch[1]);
        if (imgMatch) imageUrl = imgMatch[1];
      }

      if (titleMatch && linkMatch) {
        items.push({
          headline: titleMatch[1]
            .replace(" - Google News", "")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"'), 
          summary: "Click to read full coverage.", // Google RSS summaries are often messy HTML
          url: linkMatch[1],
          datetime: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          source: sourceMatch ? sourceMatch[1] : "Google News",
          image: imageUrl 
        });
      }
    }

    // 4. Fallback if empty
    if (items.length === 0) {
      if (isFallbackAttempt || !companyNames || companyNames.length === 0) {
        return [];
      }

      console.log("No specific news found. Fetching fallback...");
      return getNews([], true);
    }

    return items;

  } catch (error) {
    console.error("News Fetch Error:", error);
    return [];
  }
};