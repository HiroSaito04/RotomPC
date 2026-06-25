import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button.jsx';
import ArticleList from '@/components/ArticleList.jsx';
import ArticlePost from '@/components/ArticlePost.jsx';

import * as articleService from '@/services/ArticleService';

const ArticleListPage = () => {
  const [rawArticles, setRawArticles] = useState([]);
  const [articles, setArticles] = useState([]);
  // 1. Default system state set to 'latest' chronologically on frequency boot
  const [activeFilter, setActiveFilter] = useState('latest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 2. Performance Speed Optimization: Control maximum visible DOM elements on load
  const [itemsToShow, setItemsToShow] = useState(8);
  const navigate = useNavigate();

  // Helper routine to cleanly ensure chronological array ordering (Latest -> Oldest)
  const sortArticlesLatest = (list) => {
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt?.$date || a.createdAt || a.date || 0);
      const timeB = new Date(b.createdAt?.$date || b.createdAt || b.date || 0);
      return timeB - timeA;
    });
  };

  const shuffleArray = (list) => {
  return [...list].sort(() => Math.random() - 0.5);
};

const randomizeWithinMonthYearGroups = (list) => {
  const grouped = {};

  list.forEach((article) => {
    const dateValue = article.createdAt?.$date || article.createdAt || article.date || 0;
    const date = new Date(dateValue);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const groupKey = `${year}-${String(month).padStart(2, '0')}`;

    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push(article);
  });

  return Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .flatMap((key) => shuffleArray(grouped[key]));
};

  const applyArticles = (data) => {
    const dataArray = Array.isArray(data) ? data : data?.articles || [];
    const visibleArticles = dataArray.filter(item => item.status === 'active');

    setRawArticles(visibleArticles);
    setArticles(sortArticlesLatest(visibleArticles));
    setActiveFilter('latest');
    setItemsToShow(8);
  };

  const loadMainframeFeed = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);

      const cached = articleService.getStoredArticles();

      if (!forceRefresh && cached) {
        applyArticles(cached);
      }

      const res = await articleService.fetchArticles(forceRefresh);
      applyArticles(res.data);
    } catch (err) {
      console.error("Error connecting to live server database feed", err);
    } finally {
      if (forceRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMainframeFeed();
  }, []);

  const handleLogOff = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('role');
    localStorage.removeItem('firstName');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('local-auth-update'));
    navigate('/');
  };

const renderArticleImage = (row) => {
  if (!row) {
    return 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
  }

  if (row.imageUrl) return row.imageUrl;

  if (row._id) return articleService.getArticleImageUrl(row._id);

  return 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
};

const toggleLatestFilter = () => {
  if (activeFilter === 'latest') {
    setActiveFilter('');
    setArticles(randomizeWithinMonthYearGroups(rawArticles));
    setItemsToShow(8);
  } else {
    setActiveFilter('latest');
    setArticles(sortArticlesLatest(rawArticles));
    setItemsToShow(8);
  }
};
  

  const toggleTopRatedFilter = () => {
    if (activeFilter === 'top-rated') {
      setActiveFilter('');
      setArticles([...rawArticles]);
    } else {
      setActiveFilter('top-rated');
      const sorted = [...rawArticles].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      setArticles(sorted);
    }
  };

  // Extract a lightweight, high-performance slice window array from current filtered pool
  const visibleSubset = articles.slice(0, itemsToShow);

  return (
    <div className="flex w-full flex-col gap-8 bg-[#f8fafc] pb-12 font-sans selection:bg-[#3b4cca] selection:text-white">
      <section className="border-b-8 border-[#2a3a9d] bg-[#3b4cca] px-4 py-10 text-white sm:px-6 lg:px-8 shadow-inner relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 border-[20px] border-white/10" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <p className="mb-3 text-[12px] font-black uppercase tracking-[0.4em] text-yellow-400 drop-shadow-md">
            Global Trainer Network // Region: Kanto
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-tight sm:text-5xl drop-shadow-lg italic uppercase tracking-tighter">
            Poke<span className="text-yellow-400 underline decoration-white/20 underline-offset-4">Social</span> Feed
          </h1>
          <p className="mt-4 max-w-lg text-lg font-medium leading-7 text-blue-50 sm:text-xl border-l-4 border-yellow-400 pl-4">
            The #1 social hub for field reports, berry-gathering tips, and legendary sightings across all regions.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button onClick={handleLogOff} variant="danger" size="md">LOG OFF</Button>
            <Button onClick={() => setIsModalOpen(true)} variant="secondary" size="md">POST UPDATE</Button>
          </div>
        </div>
      </section>

      {/* Article Part */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-zinc-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffcb05] border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
              <span className="text-2xl">📡</span>
            </div>
            <h2 className="text-2xl !text-black font-black uppercase italic tracking-tighter">
              Trending Reports
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleLatestFilter}
              variant={activeFilter === 'latest' ? 'primary' : 'secondary'}
              size="sm"
              className={`px-4 py-2 text-xs transition-all ${activeFilter === 'latest' ? 'bg-zinc-900 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}`}
            >
              {activeFilter === 'latest' ? '✓ Latest' : 'Latest'}
            </Button>

            <Button
              onClick={toggleTopRatedFilter}
              variant={activeFilter === 'top-rated' ? 'primary' : 'secondary'}
              size="sm"
              className={`px-4 py-2 text-xs transition-all ${activeFilter === 'top-rated' ? 'bg-[#3b4cca] text-white border-zinc-900 hover:bg-[#2a3a9d]' : ''}`}
            >
              {activeFilter === 'top-rated' ? '✓ Top Rated' : 'Top Rated'}
            </Button>

            <Button
              onClick={() => loadMainframeFeed(true)}
              variant="secondary"
              size="sm"
              disabled={isRefreshing}
              className="px-4 py-2 text-xs transition-all bg-white border-zinc-900 text-zinc-900 hover:bg-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
             {isRefreshing ? 'Refreshing...' : '↻ Refresh'}
            </Button>
          </div>
        </div>

        {visibleSubset.length > 0 ? (
          <div className="flex flex-col gap-10">
            {/* Render the high-performance sliced chunk array */}
            <ArticleList articles={visibleSubset} getImage={renderArticleImage} />
            
            {/* Lazy Trigger Button Interface rendered only when hidden entries remain in the stream */}
            {articles.length > itemsToShow && (
              <div className="flex justify-center pt-2">
                <Button 
                  onClick={() => setItemsToShow(prev => prev + 8)}
                  variant="secondary"
                  size="md"
                  className="px-8 py-3 border-4 border-zinc-900 bg-[#ffcb05] text-zinc-950 font-black tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 transition-all uppercase italic"
                >
                  📡 Load More Feed Reports ({articles.length - itemsToShow} Remaining)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 font-bold uppercase italic tracking-tight">
            No visible reports streaming on this frequency.
          </div>
        )}
      </section>

      {/* Tip Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-[2.5rem] border-4 border-zinc-900 bg-[#4dad5b] p-8 shadow-[10px_10px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-white border-4 border-zinc-900 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-4xl z-10">
            💡
          </div>
          <div className="z-10">
            <h4 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">Pro-Trainer Tip:</h4>
            <p className="mt-2 font-bold text-green-950 text-lg leading-snug">
              Sync your RotomPC to stay updated with latest pokemon news or high-priority sightings!
            </p>
          </div>
        </div>
      </section>

      <ArticlePost 
       isOpen={isModalOpen} 
       onClose={() => setIsModalOpen(false)} 
       onRefresh={() => loadMainframeFeed(true)} 
     />
    </div>
  );
};

export default ArticleListPage;