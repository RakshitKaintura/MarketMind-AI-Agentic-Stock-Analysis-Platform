"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { Star, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

interface WatchlistButtonProps {
  symbol: string;
  company: string;
  isInWatchlist: boolean;
  showTrashIcon?: boolean;
  type?: "button" | "icon";
  className?:string;
  onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
}

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  className,
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);

  const label = useMemo(() => {
    if (type === "icon") return "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const toggleWatchlist = async () => {
    const result = added
      ? await removeFromWatchlist(symbol)
      : await addToWatchlist(symbol, company);

    if (result.success) {
      toast.success(added ? "Removed from Watchlist" : "Added to Watchlist", {
        description: `${company} ${added ? "removed from" : "added to"} your watchlist`,
      });
      onWatchlistChange?.(symbol, !added);
    }
  };

  const debouncedToggle = useDebounce(toggleWatchlist, 300);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAdded(!added);
    debouncedToggle();
  };

  if (type === "icon") {
    return (
      <button
        className={`p-2 rounded-lg hover:bg-[#161616] transition-colors duration-200 ${
          added ? "text-[#d4a017]" : "text-[#71717A] hover:text-white"
        }`}
        onClick={handleClick}
      >
        {showTrashIcon && added ? <Trash2 size={16} /> : <Star size={16} fill={added ? "currentColor" : "none"} />}
      </button>
    );
  }

  return (
    <button
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer ${
        added
          ? "bg-[#111111] border border-[#27272A] text-white hover:border-[#FF495B] hover:text-[#FF495B]"
          : "bg-white text-black hover:bg-[#E5E5E5] shadow-sm"
      } ${className || ""}`}
      onClick={handleClick}
    >
      {showTrashIcon && added ? (
        <Trash2 size={15} />
      ) : (
        <Star size={15} fill={added ? "currentColor" : "none"} />
      )}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;