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
  yahooFinance.suppressNotices(['yahooSurvey', 'validation', 'ripHistorical']);
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

import { formatPrice, formatMarketCap, formatPercent, formatNumber } from "../utils/formatters";
import { calculateSMA, calculateRSI, calculateVolatility, calculateEMA, calculateMACD, calculateBollingerBands, calculateVolumeTrend } from "../utils/technical-indicators";

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
      try { 
        results = await yahooFinance.quote(POPULAR_INDIAN_STOCKS); 
      } catch (e) { 
        results = []; 
      }
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
    const [quote, summary, historical] = await Promise.all([
      yahooFinance.quote(cleanSymbol).catch(() => null),
      yahooFinance.quoteSummary(cleanSymbol, {
        modules: [
          "summaryDetail",
          "defaultKeyStatistics",
          "financialData",
          "summaryProfile",
        ],
      }).catch(() => null),
      yahooFinance.chart(cleanSymbol, {
        period1: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180),
        period2: new Date(),
        interval: "1d",
      }).catch(() => null),
    ]);

    if (!quote || !quote.regularMarketPrice) return null;

    const companyName = quote.longname || quote.shortname || cleanSymbol;
    const chartQuotes = historical?.quotes || [];
    const closes = chartQuotes
      .map((item: any) => item?.close)
      .filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value));

    const volumes = chartQuotes
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