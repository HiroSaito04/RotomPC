// rubia-client\src\pages\ArticleListPage\ArticleListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import ArticleList from '../../components/ArticleList.jsx';

// Import your centralized article service layer
import * as articleService from '../../services/ArticleService';

const ArticleListPage = () => {
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    articleService.fetchArticles()
      .then(res => {
        const visibleArticles = res.data.filter(item => item.status === 'active');
        setArticles(visibleArticles);
      })
      .catch(err => console.error("Error connecting to live server database feed", err));
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

  return (
    <div className="flex w-full flex-col gap-8 bg-[#f8fafc] pb-12 font-sans selection:bg-[#3b4cca] selection:text-white">
      {/* Header: PokeSocial Feed Branding */}
      <section className="border-b-8 border-[#2a3a9d] bg-[#3b4cca] px-4 py-10 text-white sm:px-6 lg:px-8 shadow-inner relative overflow-hidden">
        {/* Decorative Pokéball Background Element */}
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
            <Button 
              onClick={handleLogOff} 
              variant="danger"
              size="md"
            >
              LOG OFF
            </Button>
            <Button 
              variant="secondary"
              size="md"
            >
              POST UPDATE
            </Button>
          </div>
        </div>
      </section>

      {/* Article Part*/}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-zinc-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffcb05] border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
              <span className="text-2xl">📡</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">Trending Reports</h2>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              className="px-4 py-2"
            >
              Latest
            </Button>
            
            <Button 
              variant="primary" 
              size="sm"
              className="px-4 py-2 bg-[#3b4cca] text-white border-zinc-900 hover:bg-[#2a3a9d]" 
            >
              Top Rated
            </Button>
          </div>
        </div>

        {/* Call Article Here*/}
        <ArticleList articles={articles} />
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
              Sync your Pokégear at every Pokémon Center to stay updated with regional migrations and high-priority sightings!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArticleListPage;