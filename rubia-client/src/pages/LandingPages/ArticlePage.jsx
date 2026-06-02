// rubia-client\src\pages\ArticlePage\ArticlePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import NotFoundPage from '../NotFoundPage.jsx';

// Import your centralized article service layer
import * as articleService from '../../services/ArticleService';

function ArticlePage() {
  const { name } = useParams(); 
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("React Router Param (:name) extracted value:", name);

    if (!name) {
      setLoading(false);
      return;
    }

    articleService.fetchArticles()
      .then(res => {
        console.log("Database Response Raw Array:", res.data);
        const found = res.data.find(a => String(a.name).toLowerCase() === String(name).toLowerCase());
        
        console.log("Matched Document Object Result:", found);
        setArticle(found);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error retrieving document from database registry", err);
        setLoading(false);
      });
  }, [name]);

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-[#f0f2f5] items-center justify-center font-sans">
        <p className="text-xl font-black uppercase text-zinc-400 animate-pulse tracking-wider">Loading Archive Log...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="relative flex flex-col w-full min-h-screen bg-[#f0f2f5]">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex justify-center pb-8 pt-10">
            <Button to="/articles" size="md" className="z-20 bg-[#3b4cca] text-white">
              ← Back to PokeSocial Feed
            </Button>
          </div>
          <NotFoundPage />
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans selection:bg-yellow-400">
      <main className="mx-auto max-w-5xl px-4 py-8 pt-25">
        {/* Secondary Back Action */}
        <div className="mb-8">
          <Button to="/articles" variant="secondary" size="sm">
            ← Return to Social Feed
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Article Meta & Image */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-[2.5rem] border-4 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)]">
              <div className="relative aspect-video border-b-4 border-zinc-900 bg-zinc-200">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="h-full w-full object-cover" 
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border-2 border-zinc-900 bg-black/80 px-3 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]"></div>
                <div className="absolute top-0 right-0 p-4">
                  <div className="h-4 w-4 border-t-2 border-r-2 border-white/30"></div>
                </div>
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="h-4 w-4 border-b-2 border-l-2 border-white/30"></div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className={`rounded-md border-2 border-zinc-900 ${article.color || 'bg-zinc-500'} px-3 py-0.5 text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    {article.date}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Log Entry #{article.id}</span>
                </div>
                <h1 className="text-4xl font-black uppercase italic leading-[0.9] tracking-tighter !text-zinc-900 sm:text-6xl">
                  {article.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Column: Content & Author */}
          <div className="lg:col-span-5">
            <div className="space-y-6">
              <div className="rounded-3xl border-4 border-zinc-900 bg-[#ffcb05] p-6 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-white text-xl font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {article.author ? article.author.charAt(0) : '?'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-700 opacity-70">Published By</p>
                    <p className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">{article.author}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border-4 border-zinc-900 bg-white p-8 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
                <div className="prose prose-zinc max-w-none">
                  {Array.isArray(article.content) && article.content.map((paragraph, index) => (
                    <p key={index} className="mb-6 text-xl leading-relaxed text-zinc-800 last:mb-0 font-['Times_New_Roman',_serif] text-justify">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-20">
          <Button to="/articles" variant="secondary" size="md" className="rounded-none">
            Close Report
          </Button>
        </div>
      </main>
    </div>
  );
}

export default ArticlePage;