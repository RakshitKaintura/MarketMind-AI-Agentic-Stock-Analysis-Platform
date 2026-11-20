import TradingViewWidget from "@/components/TradingViewWidget";
import StockNews from "@/components/StockNews";
import TickerTape from "@/components/TickerTape"; 
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG
} from "@/lib/constants";

const Home = () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="flex flex-col min-h-screen bg-[#050505]">
          
          {/* 1. Ticker Tape (Full Width, touches Navbar) */}
          <TickerTape />

          <div className="px-4 lg:px-8 pb-10">
            {/* 2. Top Section: Market Overview & Heatmap */}
            <section className="grid w-full gap-6 mt-6 md:grid-cols-3 xl:grid-cols-3">
                <div className="md:col-span-1 xl:col-span-1 bg-[#111111] border border-[#27272A] rounded-xl hover:border-[#3F3F46] transition-colors duration-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#27272A]">
                        <h2 className="text-white font-bold text-base tracking-tight">Market Overview</h2>
                        <p className="text-[#71717A] text-xs mt-0.5">Global indices at a glance</p>
                    </div>
                    <TradingViewWidget
                      title="Market Overview"
                      scriptUrl={`${scriptUrl}market-overview.js`}
                      config={MARKET_OVERVIEW_WIDGET_CONFIG}
                      className="custom-chart"
                      height={560}
                    />
                </div>
                
                <div className="md:col-span-2 xl:col-span-2 bg-[#111111] border border-[#27272A] rounded-xl hover:border-[#3F3F46] transition-colors duration-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#27272A]">
                        <h2 className="text-white font-bold text-base tracking-tight">Stock Heatmap</h2>
                        <p className="text-[#71717A] text-xs mt-0.5">Visualize market performance</p>
                    </div>
                    <TradingViewWidget
                        title="Stock Heatmap"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        height={560}
                    />
                </div>
            </section>

            {/* 3. Bottom Section: News & Data Table */}
            <section className="grid w-full gap-6 mt-6 md:grid-cols-3 xl:grid-cols-3">
                  <div className="h-full md:col-span-1 xl:col-span-1">
                      <StockNews />
                  </div>
                  
                  <div className="h-full md:col-span-2 xl:col-span-2 bg-[#111111] border border-[#27272A] rounded-xl hover:border-[#3F3F46] transition-colors duration-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-[#27272A]">
                          <h2 className="text-white font-bold text-base tracking-tight">Live Market Data</h2>
                          <p className="text-[#71717A] text-xs mt-0.5">Real-time quotes and market stats</p>
                      </div>
                      <TradingViewWidget
                          title="Live Market Data"
                          scriptUrl={`${scriptUrl}market-quotes.js`}
                          config={MARKET_DATA_WIDGET_CONFIG}
                          height={560}
                      />
                  </div>
              </section>
          </div>
        </div>
    )
}

export default Home;
