// rotompc-client\src\components\ArticleList.jsx
import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';

const ArticleList = ({ articles, getImage }) => {
  // Local state to hold only the visibly rendered subset of articles
  const [visibleArticles, setVisibleArticles] = useState([]);

  // Handles the sequential, one-by-one streaming layout animation effect
  useEffect(() => {
    setVisibleArticles(articles);
  }, [articles]);

  // Utility calculation handler to produce dynamic relative intervals
  const getRelativeTime = (createdAtString) => {
    if (!createdAtString) return 'RECENT';

    try {
      // Safely process MongoDB standard ISODate string configurations or $date wrapper layouts
      const dateValue = typeof createdAtString === 'object' && createdAtString.$date 
        ? createdAtString.$date 
        : createdAtString;

      const createdDate = new Date(dateValue);
      const now = new Date();
      const secondsDelta = Math.floor((now - createdDate) / 1000);

      // Define standard conversion thresholds
      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
      ];

      for (const interval of intervals) {
        const count = Math.floor(secondsDelta / interval.seconds);
        if (count >= 1) {
          const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
          return rtf.format(-count, interval.label).toUpperCase();
        }
      }

      return 'JUST NOW';
    } catch (error) {
      console.error("Interval processing failure:", error);
      return 'RECENT';
    }
  };

  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
      {visibleArticles.map((article, i) => {
        // Skip rendering if an undefined entry gets passed during stream tracking step cycles
        if (!article) return null;

        return (
          <article 
            key={article._id || article.id || i} 
            className="group relative flex flex-col rounded-[2.5rem] border-4 border-zinc-900 bg-white p-5 shadow-[10px_10px_0px_0px_rgba(24,24,27,1)] transition-all hover:-translate-y-2 animate-in fade-in zoom-in-95 duration-300 ease-out"
          >
            {/* Header Block Layout */}
            <div className="mb-4 flex items-center gap-3 border-b-2 border-zinc-50 pb-3">
              <div className={`h-10 w-10 rounded-full border-2 border-zinc-900 ${article.color || 'bg-zinc-500'} shadow-inner flex items-center justify-center font-black text-white text-xs shrink-0`}>
                {article.author ? article.author.charAt(0) : '?'}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-zinc-900 leading-none">{article.author}</p>
                <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                  posted {getRelativeTime(article.createdAt)}
                </p>
              </div>
            </div>

            {/* Graphic Feed Layout Container */}
            <div className="flex aspect-[4/3] items-center justify-center rounded-[1.8rem] bg-zinc-100 overflow-hidden relative border-2 border-zinc-900 mb-4 shadow-inner">
              <img 
                src={getImage ? getImage(article) : article.image || article.imageFallbackUrl} 
                alt={article.title} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
              <div className="absolute bottom-2 right-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-1 text-[8px] font-black text-white uppercase tracking-widest">
                Live_Feed
              </div>
            </div>

            {/* Body Narrative Section */}
            <div className="flex-grow">
              <span className="inline-block rounded-md border-2 border-zinc-900 bg-white px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                {article.date || 'RECENT'}
              </span>
              <h3 className="mt-3 text-xl font-black text-zinc-900 leading-tight italic uppercase tracking-tighter">
                {article.title}
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500 line-clamp-3">
                {article.desc}
              </p>
            </div>

            {/* Direct Interactive Matrix Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <Button 
                to={`/articles/${article.name}`}
                variant="secondary"
                size="md"
                className="flex-1 py-3" 
              >
                VIEW REPORT
              </Button>

              <Button 
                variant="secondary"
                size="md"
                className="h-[38px] w-[38px] !px-0 !py-0 flex items-center justify-center bg-red-50 hover:bg-red-500 hover:text-white shrink-0 rounded-xl transition-all"
              >
                ❤️
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ArticleList;