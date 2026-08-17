import React from "react";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { searchStocks, getNews } from "@/lib/actions/finnhub.actions";
import SearchCommand from "@/components/SearchCommand";
import { WatchlistTable } from "@/components/WatchlistTable";
import Link from "next/link";
import { ExternalLink, Newspaper, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Helper: Time Ago Formatter ─────────────────────────────────────────────
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

// ─── Main Page Component ────────────────────────────────────────────────────
export default async function WatchlistPage() {
  // 1. Fetch Watchlist Data (Server Side)
  const watchlist = await getWatchlistWithData();
  const initialStocks = await searchStocks();

  // 2. Extract Company Names for News Search
  // We use names (e.g., "Reliance Industries") instead of symbols ("RELIANCE.NS")
  // because Google News works much better with names.
  const watchlistNames = watchlist.map((item: any) => item.company);
  
  // 3. Fetch News
  const news = await getNews(watchlistNames);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e4e9] font-sans selection:bg-[#d4a017]/30 selection:text-white relative overflow-hidden pb-10">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#d4a017]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#0FEDBE]/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row gap-8 px-4 lg:px-8 py-8 max-w-[1400px] mx-auto relative z-10">
        
        {/* ─── LEFT COLUMN: Watchlist Table ─── */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Market Watchlist
              </h1>
              <p className="text-white/50 text-sm mt-2 font-medium tracking-wide">
                Tracking {watchlist.length} asset{watchlist.length !== 1 && "s"} in your portfolio
              </p>
            </div>
            
            {/* Search / Add Stock Button */}
            <div className="relative z-10">
               <SearchCommand 
                 initialStocks={initialStocks} 
                 renderAs="button"
                 label="Add Stock"
               />
            </div>
          </div>
          
          <WatchlistTable watchlist={watchlist} />
        </div>

        {/* ─── RIGHT COLUMN: Related News ─── */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="sticky top-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#d4a017]/10 rounded-lg">
                <Newspaper className="text-[#d4a017] w-5 h-5" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#d4a017]">Market Intel</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {news && news.length > 0 ? (
                news.map((item: any, i: number) => (
                  <Link
                    key={i}
                    href={item.url || "#"}
                    target="_blank"
                    className="group block bg-black/20 border border-white/5 rounded-xl p-5 hover:bg-white/10 hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex flex-col gap-2">
                      
                      {/* Source & Time */}
                      <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                        <span className="font-bold text-[#d4a017] bg-[#d4a017]/10 px-2 py-1 rounded-md text-[9px] uppercase tracking-widest truncate max-w-[150px]">
                          {item.source}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                          <Clock size={12} className="text-white/40" />
                          <span>{formatTimeAgo(item.datetime)}</span>
                        </div>
                      </div>

                      {/* Headline */}
                      <h3 className="text-sm font-semibold text-white/90 leading-snug group-hover:text-[#d4a017] transition-colors line-clamp-2">
                        {item.headline}
                      </h3>

                      {/* Summary (if available) */}
                      {item.summary && !item.summary.includes("Click to read") && (
                        <p className="text-[13px] text-white/60 line-clamp-2 leading-relaxed mt-1">
                          {item.summary}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-white/40 mt-3 group-hover:text-[#d4a017] transition-colors">
                        <span>Read Intel</span>
                        <ExternalLink size={12} />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-black/20 rounded-xl border border-white/5 p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                  <Newspaper className="w-8 h-8 text-white/10 mb-3" />
                  <p className="text-white/40 text-sm font-medium tracking-wide">
                    No recent intelligence found for your watchlist assets.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}