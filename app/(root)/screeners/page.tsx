import React from "react";
import TradingViewScreener from "@/components/TradingViewScreener";

export default function ScreenersPage() {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="border-b border-[#27272A] pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Stock Screener</h1>
        <p className="text-[#71717A] text-xs mt-1">
          Filter and analyze market data using advanced technicals and institutional indicators.
        </p>
      </div>

      {/* Screener Surface Card */}
      <div className="rounded-xl border border-[#27272A] bg-[#111111] p-3 sm:p-4 hover:border-[#3F3F46] transition-colors">
        <TradingViewScreener height={650} />
      </div>
    </div>
  );
}