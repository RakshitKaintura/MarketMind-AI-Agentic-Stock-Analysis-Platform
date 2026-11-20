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
    <div className="min-h-screen bg-[#050505] text-[#A1A1AA] font-sans selection:bg-[#27272A] selection:text-white pb-10">
      <div className="flex flex-col lg:flex-row gap-8 px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
        
        {/* ─── LEFT COLUMN: Watchlist Table ─── */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-[#27272A] pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Market Watchlist
              </h1>
              <p className="text-[#71717A] text-sm mt-1 font-medium">
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
          <div className="sticky top-8 rounded-xl border border-[#27272A] bg-[#111111] p-5">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#27272A]">
              <div className="p-1.5 bg-[#161616] border border-[#27272A] rounded-md">
                <Newspaper className="text-white w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Market Intel</h2>
                <p className="text-xs text-[#71717A]">Portfolio news & updates</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {news && news.length > 0 ? (
                news.map((item: any, i: number) => (
                  <Link
                    key={i}
                    href={item.url || "#"}
                    target="_blank"
                    className="group block bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 hover:bg-[#161616] hover:border-[#3F3F46] transition-colors duration-200"
                  >
                    <div className="flex flex-col gap-2">
                      
                      {/* Source & Time */}
                      <div className="flex items-center justify-between text-xs text-[#71717A] mb-0.5">
                        <span className="font-semibold text-white bg-[#161616] border border-[#27272A] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider truncate max-w-[150px]">
                          {item.source}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                          <Clock size={11} className="text-[#71717A]" />
                          <span>{formatTimeAgo(item.datetime)}</span>
                        </div>
                      </div>

                      {/* Headline */}
                      <h3 className="text-sm font-semibold text-[#A1A1AA] group-hover:text-white transition-colors duration-200 line-clamp-2 leading-snug">
                        {item.headline}
                      </h3>

                      {/* Summary */}
                      {item.summary && !item.summary.includes("Click to read") && (
                        <p className="text-xs text-[#71717A] line-clamp-2 leading-relaxed mt-0.5">
                          {item.summary}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#71717A] group-hover:text-white transition-colors duration-200 mt-1">
                        <span>Read dispatch</span>
                        <ExternalLink size={10} />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-[#0A0A0A] rounded-lg border border-[#27272A] p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
                  <Newspaper className="w-6 h-6 text-[#71717A] mb-2" />
                  <p className="text-[#71717A] text-xs font-medium">
                    No active intelligence for your watchlist assets.
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