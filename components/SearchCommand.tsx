"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";
import WatchlistButton from "./WatchlistButton";

export default function SearchCommand({
  renderAs = "button",
  label = "Add stock",
  initialStocks,
}: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm.trim());
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  };

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    setStocks((prevStocks) =>
      prevStocks.map((stock) =>
        stock.symbol === symbol ? { ...stock, isInWatchlist: isAdded } : stock
      )
    );
  };

  return (
    <>
      {renderAs === "text" ? (
        <span
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white transition-colors duration-200 cursor-pointer select-none"
        >
          <Search className="h-3.5 w-3.5" />
          {label}
        </span>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 h-auto text-sm bg-[#111111] hover:bg-[#161616] text-[#A1A1AA] hover:text-white border border-[#27272A] hover:border-[#3F3F46] rounded-md transition-all duration-200"
        >
          <Search className="h-3.5 w-3.5" />
          {label}
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="bg-[#111111] border border-[#27272A] lg:min-w-[720px] fixed top-10 left-1/2 -translate-x-1/2 translate-y-10 shadow-2xl shadow-black/60 rounded-xl overflow-hidden"
      >
        {/* Search input row */}
        <div className="bg-[#111111] border-b border-[#27272A] relative">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks by name or symbol..."
            className="bg-[#111111] border-0 text-white placeholder:text-[#71717A] focus:ring-0 text-sm h-12 pr-10"
          />
          {loading && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A] animate-spin" />
          )}
        </div>

        <CommandList className="bg-[#111111] max-h-[400px]">
          {loading ? (
            <CommandEmpty className="py-8 text-center text-[#71717A] text-sm">
              Loading stocks...
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-[#71717A]">
              {isSearchMode ? "No results found" : "No stocks available"}
            </div>
          ) : (
            <ul>
              {/* Section label */}
              <div className="px-4 py-2 text-xs font-semibold text-[#71717A] uppercase tracking-wider bg-[#0A0A0A] border-b border-[#27272A]">
                {isSearchMode ? "Search results" : "Popular stocks"}
                {` `}({displayStocks?.length || 0})
              </div>

              {displayStocks?.map((stock) => (
                <li key={stock.symbol} className="w-full">
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={handleSelectStock}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#27272A] last:border-b-0 hover:bg-[#161616] transition-colors duration-150 cursor-pointer"
                  >
                    <TrendingUp className="h-4 w-4 text-[#71717A] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{stock.name}</div>
                      <div className="text-xs text-[#71717A] mt-0.5">
                        {stock.symbol} &bull;{" "}
                        {stock.exchange === "NSI" ? "NSE" : stock.exchange} &bull;{" "}
                        {stock.type}
                      </div>
                    </div>
                    <WatchlistButton
                      symbol={stock.symbol}
                      company={stock.name}
                      isInWatchlist={stock.isInWatchlist}
                      onWatchlistChange={handleWatchlistChange}
                      type="icon"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
