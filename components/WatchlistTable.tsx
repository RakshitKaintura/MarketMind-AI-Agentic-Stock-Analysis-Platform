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
      ? "text-[#0FEDBE]"
      : changePercent < 0
      ? "text-[#FF495B]"
      : "text-[#71717A]";
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
      <div className="flex flex-col items-center justify-center p-16 bg-[#111111] rounded-xl border border-[#27272A] text-center">
        <div className="relative mb-6">
          <div className="relative p-5 bg-[#161616] rounded-full border border-[#27272A]">
            <Star className="w-10 h-10 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-black tracking-tight text-white">Portfolio Empty</h3>
        <p className="text-[#71717A] mt-3 max-w-sm text-sm leading-relaxed font-medium">
          Initialize your tracking grid by adding assets using the search module above.
        </p>
      </div>
    );
  }

  // TABLE STATE
  return (
    <div className="bg-[#111111] rounded-xl border border-[#27272A] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_0.5fr] gap-4 px-6 py-4 border-b border-[#27272A] bg-[#161616]">
        {HEADERS.map((h) => (
          <div
            key={h}
            className="text-[#71717A] text-[10px] font-bold uppercase tracking-widest"
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
          className={cn(
            "grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_0.5fr] gap-4 px-6 py-4 border-b border-[#27272A] last:border-none items-center hover:bg-[#161616] transition-colors duration-200 cursor-pointer group",
            i % 2 === 0 ? "bg-[#111111]" : "bg-[#0A0A0A]"
          )}
        >
          {/* Company */}
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <div className="p-1.5 rounded-md bg-[#161616] border border-[#27272A] shrink-0 group-hover:scale-110 transition-transform duration-200">
              <Star size={14} className="fill-white text-white" />
            </div>
            <span className="text-white font-bold truncate group-hover:text-[#A1A1AA] transition-colors duration-200" title={item.company}>
              {item.company}
            </span>
          </div>

          {/* Symbol */}
          <span className="text-[#71717A] font-mono text-xs font-semibold px-2 py-1 bg-[#0A0A0A] rounded-md w-fit border border-[#27272A]">
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
          <span className="text-[#A1A1AA] font-mono text-sm">{item.marketCap || "—"}</span>

          {/* P/E Ratio */}
          <span className="text-[#A1A1AA] font-mono text-sm">{item.peRatio || "—"}</span>

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
