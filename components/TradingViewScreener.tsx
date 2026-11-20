"use client";

import React, { useEffect, useRef, memo } from "react";

interface TradingViewScreenerProps {
  height?: number;
}

function TradingViewScreener({ height = 650 }: TradingViewScreenerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset container on mount/remount
    containerRef.current.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height,
      defaultColumn: "overview",
      defaultScreen: "most_capitalized",
      market: "india",
      showToolbar: true,
      colorTheme: "dark",
      locale: "en"
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [height]);

  return (
    <div className="tradingview-widget-container w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

export default memo(TradingViewScreener);