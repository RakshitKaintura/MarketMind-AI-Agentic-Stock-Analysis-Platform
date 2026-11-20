import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";
import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { notFound } from "next/navigation";

// Define Page Props Type
interface StockDetailsPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  const stockData = await getStocksDetails(symbol.toUpperCase());
  const watchlist = await getUserWatchlist();

  if (!stockData) notFound();

  const isInWatchlist = watchlist.some(
    (item: any) => item.symbol === symbol.toUpperCase()
  );

  const isPositive = stockData.changePercent >= 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Stock Header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                {symbol.toUpperCase()}
              </h1>
              <span
                className={`text-lg font-semibold px-3 py-1 rounded-lg ${
                  isPositive
                    ? "text-[#0FEDBE] bg-[#0FEDBE]/10"
                    : "text-[#FF495B] bg-[#FF495B]/10"
                }`}
              >
                {stockData.changeFormatted}
              </span>
            </div>
            <p className="text-[#A1A1AA] text-base mt-1">{stockData.company}</p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-white">{stockData.priceFormatted}</p>
            <p className="text-xs uppercase tracking-widest text-[#71717A] mt-1">
              Current Price
            </p>
          </div>
        </div>

        {/* ── Quick Stats Bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Market Cap", value: stockData.marketCapFormatted },
            { label: "P/E Ratio", value: stockData.peRatio },
            { label: "52W High", value: stockData.fiftyTwoWeekHigh },
            { label: "52W Low", value: stockData.fiftyTwoWeekLow },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-[#111111] border border-[#27272A] rounded-xl px-4 py-3 hover:border-[#3F3F46] transition-colors duration-200"
            >
              <p className="text-[10px] uppercase tracking-widest text-[#71717A] mb-1">
                {label}
              </p>
              <p className="text-white font-bold text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Two Column Layout ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

          {/* Left column */}
          <div className="flex flex-col gap-6">

            {/* Symbol Info Widget */}
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl overflow-hidden hover:border-[#3F3F46] transition-colors duration-200">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}symbol-info.js`}
                config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                height={170}
              />
            </div>

            {/* Candle Chart */}
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl overflow-hidden hover:border-[#3F3F46] transition-colors duration-200">
              <div className="px-4 pt-4 pb-0">
                <p className="text-[10px] uppercase tracking-widest text-[#71717A]">Candlestick Chart</p>
              </div>
              <TradingViewWidget
                scriptUrl={`${scriptUrl}advanced-chart.js`}
                config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                className="custom-chart"
                height={600}
              />
            </div>

            {/* Baseline Chart */}
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl overflow-hidden hover:border-[#3F3F46] transition-colors duration-200">
              <div className="px-4 pt-4 pb-0">
                <p className="text-[10px] uppercase tracking-widest text-[#71717A]">Baseline Chart</p>
              </div>
              <TradingViewWidget
                scriptUrl={`${scriptUrl}advanced-chart.js`}
                config={BASELINE_WIDGET_CONFIG(symbol)}
                className="custom-chart"
                height={600}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* Watchlist Button */}
            <WatchlistButton
              symbol={symbol}
              company={stockData.company}
              isInWatchlist={isInWatchlist}
              type="button"
              className="w-full h-12 text-base"
            />

            {/* Technical Analysis */}
            <div className="bg-[#111111] border border-[#27272A] rounded-xl overflow-hidden hover:border-[#3F3F46] transition-colors duration-200">
              <div className="px-4 pt-4 pb-0">
                <p className="text-[10px] uppercase tracking-widest text-[#71717A]">Technical Analysis</p>
              </div>
              <TradingViewWidget
                scriptUrl={`${scriptUrl}technical-analysis.js`}
                config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                height={400}
              />
            </div>

            {/* Company Profile */}
            <div className="bg-[#111111] border border-[#27272A] rounded-xl overflow-hidden hover:border-[#3F3F46] transition-colors duration-200">
              <div className="px-4 pt-4 pb-0">
                <p className="text-[10px] uppercase tracking-widest text-[#71717A]">Company Profile</p>
              </div>
              <TradingViewWidget
                key={`${symbol}-profile`}
                scriptUrl={`${scriptUrl}symbol-profile.js`}
                config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                height={440}
              />
            </div>

            {/* Financials */}
            <div className="bg-[#111111] border border-[#27272A] rounded-xl overflow-hidden hover:border-[#3F3F46] transition-colors duration-200">
              <div className="px-4 pt-4 pb-0">
                <p className="text-[10px] uppercase tracking-widest text-[#71717A]">Financials</p>
              </div>
              <TradingViewWidget
                scriptUrl={`${scriptUrl}financials.js`}
                config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                height={464}
              />
            </div>

            {/* Financial Metrics Card */}
            <div className="bg-[#111111] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-colors duration-200">
              <h3 className="text-xs uppercase tracking-widest text-[#71717A] mb-4">Key Metrics</h3>
              <div className="divide-y divide-[#27272A]">
                {[
                  { label: "Beta", value: stockData.beta },
                  { label: "P/B Ratio", value: stockData.pbRatio },
                  { label: "EPS (TTM)", value: stockData.epsTrailing },
                  { label: "EPS (Fwd)", value: stockData.epsForward },
                  { label: "Dividend Yield", value: stockData.dividendYield },
                  { label: "Return on Equity", value: stockData.roe },
                  { label: "Debt / Equity", value: stockData.debtToEquity },
                  { label: "Net Margin", value: stockData.netMargin },
                  { label: "Operating Margin", value: stockData.operatingMargin },
                  { label: "Revenue Growth", value: stockData.revenueGrowth },
                  { label: "Earnings Growth", value: stockData.earningsGrowth },
                  { label: "50-Day Avg", value: stockData.fiftyDayAverage },
                  { label: "200-Day Avg", value: stockData.twoHundredDayAverage },
                  { label: "Sector", value: stockData.sector },
                  { label: "Industry", value: stockData.industry },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-xs text-[#71717A] uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
