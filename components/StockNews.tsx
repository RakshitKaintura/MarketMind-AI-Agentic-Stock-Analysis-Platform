'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Newspaper, Clock } from 'lucide-react';

interface NewsItem {
  title: string;
  description: string;
  source: { name: string; url: string };
  url: string;
  publishedAt: string;
}

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

const StockNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await res.json();

        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setNews(data.articles);
        } else {
          setError("No news available right now");
        }
      } catch {
        setError("Error fetching news");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="w-full h-[600px] flex flex-col bg-[#111111] rounded-xl border border-[#27272A] hover:border-[#3F3F46] transition-colors duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#27272A] bg-[#161616] shrink-0">
        <div className="p-1.5 bg-[#111111] border border-[#27272A] rounded-md">
          <Newspaper className="text-white w-4 h-4" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base tracking-tight">Top Stories</h3>
          <p className="text-[#71717A] text-xs">Latest market news</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-6 h-6 border-2 border-[#27272A] border-t-white rounded-full animate-spin" />
            <p className="text-[#71717A] text-sm">Loading news...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Newspaper className="w-8 h-8 text-[#71717A]" />
            <p className="text-[#71717A] text-sm text-center">{error}</p>
          </div>
        )}

        {!loading && !error && news.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 rounded-xl bg-[#0A0A0A] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#111111] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-[#A1A1AA] bg-[#161616] border border-[#27272A] px-2 py-1 rounded-md uppercase tracking-widest truncate max-w-[140px]">
                {item.source.name}
              </span>
              <div className="flex items-center gap-1 text-[#71717A] font-mono text-[10px] shrink-0">
                <Clock size={10} />
                <span>{formatTimeAgo(item.publishedAt)}</span>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-[#A1A1AA] group-hover:text-white transition-colors duration-200 mb-1 leading-snug line-clamp-2">
              {item.title}
            </h4>
            <p className="text-xs text-[#71717A] line-clamp-2 leading-relaxed">{item.description}</p>
            <div className="flex items-center gap-1 mt-3 text-[10px] font-bold uppercase tracking-widest text-[#71717A] group-hover:text-white transition-colors duration-200">
              <span>Read More</span>
              <ExternalLink size={10} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default StockNews;
