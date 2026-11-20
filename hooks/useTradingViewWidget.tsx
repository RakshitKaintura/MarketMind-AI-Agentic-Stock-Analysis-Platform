'use client';
import { useEffect, useRef } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        if (containerRef.current.dataset.loaded) return;

        // Elegant dark luxury placeholder while TradingView script downloads
        containerRef.current.innerHTML = `
          <div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px; display: flex; align-items: center; justify-content: center; background: #0A0A0A;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; font-family: inherit;">
              <div style="width: 18px; height: 18px; border: 2px solid #27272A; border-top-color: #FFFFFF; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
              <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717A;">Connecting Telemetry...</span>
            </div>
          </div>
        `;

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);

        script.onerror = () => {
          if (containerRef.current) {
            const widgetEl = containerRef.current.querySelector('.tradingview-widget-container__widget');
            if (widgetEl) {
              widgetEl.innerHTML = `
                <div style="display:flex;height:100%;align-items:center;justify-content:center;flex-direction:column;gap:6px;padding:24px;text-align:center;background:#111111;color:#71717A;font-family:inherit;font-size:11px;">
                  <span style="color:#FFFFFF;font-weight:600;letter-spacing:0.04em;">Telemetry Feed Unavailable</span>
                  <span style="color:#71717A;font-size:10px;">External chart stream timed out or was blocked.</span>
                </div>
              `;
            }
          }
        };

        containerRef.current.appendChild(script);
        containerRef.current.dataset.loaded = 'true';

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                delete containerRef.current.dataset.loaded;
            }
        };
    }, [scriptUrl, config, height]);

    return containerRef;
};

export default useTradingViewWidget;