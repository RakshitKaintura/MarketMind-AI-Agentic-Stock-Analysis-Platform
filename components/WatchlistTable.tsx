"use client"; // <--- This magic line fixes the error

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import { cn } from "@/lib/utils";

// Helper to colorize change text
function ChangeText({
  changePercent,
  changeFormatted,
  className,
}: {
  changePercent: number;
  changeFormatted: string;
  className?: string;
}) {
  const colorClass =
    changePercent > 0
      ? "text-green-500"
      : changePercent < 0
      ? "text-red-500"
      : "text-gray-500";
  return (
    <span className={cn("font-semibold", colorClass, className)}>
      {changeFormatted || "0.00%"}
    </span>
  );
}

export function WatchlistTable({ watchlist }: { watchlist: any[] }) {
  const HEADERS = [
    "Company",
    "Symbol",
    "Price",
    "Change",
    "Market Cap",
    "P/E Ratio",
    "Action",
  ];

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white/5 rounded-2xl border border-white/10 text-center backdrop-blur-xl shadow-2xl">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full blur-xl bg-[#d4a017]/20 animate-pulse" />
          <div className="relative p-5 bg-[#d4a017]/10 rounded-full border border-[#d4a017]/20">
            <Star className="w-10 h-10 text-[#d4a017]" />
          </div>
        </div>
        <h3 className="text-2xl font-black tracking-tight text-white/90">Portfolio Empty</h3>
        <p className="text-white/50 mt-3 max-w-sm text-sm leading-relaxed font-medium">
          Initialize your tracking grid by adding assets using the search module above.
        </p>
      </div>
    );
  }

  // TABLE STATE
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_0.5fr] gap-4 px-6 py-4 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
        {HEADERS.map((h) => (
          <div
            key={h}
            className="text-white/40 text-[10px] font-bold uppercase tracking-widest"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {watchlist.map((item, i) => (
        <Link
          key={item.symbol + i}
          href={`/stocks/${item.symbol}`}
          className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_0.5fr] gap-4 px-6 py-4 border-b border-white/5 last:border-none items-center hover:bg-white/10 hover:shadow-lg hover:-translate-y-[1px] transition-all cursor-pointer group"
        >
          {/* Company */}
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <div className="p-1.5 rounded-md bg-[#d4a017]/10 border border-[#d4a017]/20 shrink-0 group-hover:scale-110 transition-transform">
              <Star size={14} className="fill-[#d4a017] text-[#d4a017]" />
            </div>
            <span className="text-white/90 font-bold truncate group-hover:text-[#d4a017] transition-colors" title={item.company}>
              {item.company}
            </span>
          </div>

          {/* Symbol */}
          <span className="text-white/40 font-mono text-xs font-semibold px-2 py-1 bg-black/40 rounded-md w-fit border border-white/5">
            {item.symbol}
          </span>

          {/* Price */}
          <span className="text-white font-mono font-bold tracking-tight">
            {item.priceFormatted || "—"}
          </span>

          {/* Change */}
          <ChangeText
            changePercent={item.changePercent}
            changeFormatted={item.changeFormatted}
            className="font-mono tracking-tight"
          />

          {/* Market Cap */}
          <span className="text-white/60 font-mono text-sm">{item.marketCap || "—"}</span>

          {/* P/E Ratio */}
          <span className="text-white/60 font-mono text-sm">{item.peRatio || "—"}</span>

          {/* Remove Action (Wrapped in div to stop propagation) */}
          <div 
            onClick={(e) => {
              e.preventDefault(); // Prevents Link navigation
              e.stopPropagation(); // Stops event bubbling
            }}
          >
            <WatchlistButton
              symbol={item.symbol}
              company={item.company}
              isInWatchlist={true}
              showTrashIcon={true}
              type="icon"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}