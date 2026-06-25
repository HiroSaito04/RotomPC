// rotompc-client/src/pages/LandingPages/AboutPage.jsx
import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import badgeA from '@/assets/res/A.png';
import badgeB from '@/assets/res/B.png';
import badgeC from '@/assets/res/C.png';
import badgeD from '@/assets/res/D.png';
import * as articleService from '@/services/ArticleService';
import constants from '@/constants';

const TRAINER_SPRITES = {
  male: 'https://ik.imagekit.io/ytwzizvepv/RotomPC/TrainerAvatar/Trainer03.png?updatedAt=1778900538799',
  female: 'https://ik.imagekit.io/ytwzizvepv/RotomPC/TrainerAvatar/Trainer04.png?updatedAt=1778900558997'
};

const AboutPage = () => {
  const defaultGuest = { id: 'UNKNOWN', username: 'RotomPC Guest', role: 'Viewer', gender: null };
  const [user, setUser] = useState(defaultGuest);
  const [trainerSprite, setTrainerSprite] = useState(null);
  const [userArticles, setUserArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  // Helper logic to render inline data-buffers or placeholder urls safely
const renderArticleImage = (row) => {
  if (!row) {
    return 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
  }

  if (row.imageUrl) return row.imageUrl;

  if (row._id) return articleService.getArticleImageUrl(row._id);

  return 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
};

  // Helper logic to produce dynamic relative intervals
  const getRelativeTime = (createdAtString) => {
    if (!createdAtString) return 'RECENT';

    try {
      const dateValue = typeof createdAtString === 'object' && createdAtString.$date 
        ? createdAtString.$date 
        : createdAtString;

      const createdDate = new Date(dateValue);
      const now = new Date();
      const secondsDelta = Math.floor((now - createdDate) / 1000);

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

  useEffect(() => {
    const syncProfileData = () => {
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        setUser(defaultGuest);
        setTrainerSprite(null);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        
        if (parsed && (parsed.id || parsed._id)) {
          const rawGender = parsed.gender || '';
          const userGender = rawGender.toLowerCase().trim() === 'female' ? 'female' : 'male';
          
          setUser({
            id: parsed.id || parsed._id,
            username: parsed.username || parsed.name || 'Trainer',
            role: parsed.role || 'IT Student',
            gender: userGender
          });

          setTrainerSprite(TRAINER_SPRITES[userGender]);
        } else {
          setUser(defaultGuest);
          setTrainerSprite(null);
        }
      } catch (err) {
        console.error("Authentication parsing error, resetting context state:", err);
        setUser(defaultGuest);
        setTrainerSprite(null);
      }
    };

    syncProfileData();
    window.addEventListener('storage', syncProfileData);  
    window.addEventListener('local-auth-update', syncProfileData);

    return () => {
      window.removeEventListener('storage', syncProfileData);
      window.removeEventListener('local-auth-update', syncProfileData);
    };
  }, []);

  useEffect(() => {
  const loadUserArticles = async () => {
    if (!user?.id || user.id === 'UNKNOWN') {
      setUserArticles([]);
      return;
    }

    const storedArticles = articleService.getStoredUserArticles?.(user.id, 4);

    if (storedArticles && Array.isArray(storedArticles)) {
      setUserArticles(storedArticles);
      setArticlesLoading(false);
    } else {
      setArticlesLoading(true);
    }

    try {
      const res = await articleService.fetchUserArticles(user.id, {
        limit: 4,
        forceRefresh: false
      });

      setUserArticles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching personal articles:', err);

      if (!storedArticles) {
        setUserArticles([]);
      }
    } finally {
      setArticlesLoading(false);
    }
  };

  loadUserArticles();
}, [user.id]);

  const badges = [
    { img: badgeA, name: 'Zephyr Badge' },
    { img: badgeB, name: 'Hive Badge' },
    { img: badgeC, name: 'Rising Badge' },
    { img: badgeD, name: 'Plain Badge' },
  ];

  return (
    <div className="flex w-full flex-col gap-8 bg-[#f8fafc] pb-16 font-sans selection:bg-[#ff1c1c] selection:text-white">
      {/* Profile Hero: Immersive Pokédex Stage */}
      <section className="relative border-b-[12px] border-[#cc0000] bg-[#ff1c1c] px-4 py-12 text-white sm:px-6 lg:px-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative z-10 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center max-w-7xl mx-auto">
          {/* Full Body Sprite Stage */}
          <div className="relative group">
            <div className="relative rounded-[3rem] border-8 border-[#30a7d7] bg-[#1a1a1a] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] aspect-[3/4] max-w-[320px] mx-auto overflow-hidden">
              <div className={`h-full w-full rounded-[2.5rem] relative flex items-end justify-center overflow-hidden transition-all duration-300 ${
                user.id !== 'UNKNOWN' && trainerSprite 
                  ? 'bg-gradient-to-b from-[#3b4cca] to-[#2a3a9d]' 
                  : 'bg-zinc-950'
              }`}>
                
                {user.id !== 'UNKNOWN' && trainerSprite ? (
                  <img 
                    src={trainerSprite} 
                    alt="Trainer" 
                    className="pb-5 relative z-20 h-[95%] w-auto object-contain transition-transform duration-700 group-hover:scale-105"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <Button 
                    to="/auth/signup"
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center group/btn border-none bg-zinc-950 hover:bg-zinc-900 transition-colors duration-300 text-white"
                  >
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce leading-tight">
                      <span className="text-yellow-300">Are you a boy <br /> or a girl?</span>
                    </h2>
                    <p className="mt-4 bg-zinc-900 border border-white/30 px-4 py-1.5 rounded-md text-white font-black uppercase tracking-widest text-[10px] shadow-md group-hover/btn:border-white/60 transition-colors">
                      Click to initialize
                    </p>
                  </Button>
                )}

                <div className="absolute bottom-6 h-8 w-40 rounded-[100%] bg-black/40 blur-md z-10"></div>
              </div>

              <div className="absolute top-8 left-8 flex gap-2 z-40">
                <div className="h-4 w-4 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_#60a5fa]"></div>
                <div className="h-2 w-10 rounded-full bg-white/20"></div>
              </div>
            </div>
          </div>

          {/* Trainer Data Panel */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-lg bg-zinc-900/30 px-4 py-2 backdrop-blur-md border border-white/10">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-yellow-300">
                Trainer Profile: ID #{user.id}
              </p>
            </div>

            <h1 className="text-5xl font-black leading-none sm:text-5xl drop-shadow-lg italic uppercase tracking-tighter">
              {user.username} <br />
              <span className="text-2xl sm:text-3xl font-black text-yellow-400 drop-shadow-md">
                {user.role}
              </span>
            </h1>

            <p className="max-w-lg text-xl font-bold leading-tight text-red-50 sm:text-2xl border-l-8 border-yellow-400 pl-6 italic">
              "Equipped with a diverse skill-set and a passion for clean UI, this trainer explores the wild frontiers of the web."
            </p>

            <div className="pt-6 flex flex-wrap gap-4">
              <Button to="/" variant="primary" size="md" className="w-full sm:w-auto">
                OPEN POKÉDEX
              </Button>
              <Button to="/articles" variant="secondary" size="md" className="w-full sm:w-auto">
                POKÉSOCIAL
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats & Quests Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 space-y-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          
          <div className="space-y-8">
            {/* Horizontal Stats Strip */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {[
                { label: 'Active Yrs', val: '05', color: 'bg-orange-500' },
                { label: 'Projects', val: '16', color: 'bg-blue-500' },
                { label: 'Certificates', val: '09', color: 'bg-purple-500' },
                { label: 'Specialty', val: 'IT', color: 'bg-green-500' },
              ].map((stat, i) => (
                <div key={i} className="group rounded-2xl border-4 border-zinc-900 bg-white p-5 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                  <div className={`mb-3 h-8 w-8 rounded-lg ${stat.color} border-2 border-zinc-900 shadow-sm transition-transform group-hover:rotate-12`} />
                  <p className="text-2xl font-black text-zinc-900 tracking-tighter">{stat.val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quest Log Area */}
            <div className="rounded-[2.5rem] border-4 border-zinc-900 bg-white p-8 shadow-[10px_10px_0px_0px_rgba(24,24,27,1)]">
              <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter mb-8 border-b-4 border-zinc-100 pb-2 flex items-center gap-3">
                <span className="h-4 w-4 bg-[#cc0000] rounded-sm rotate-45"></span>
                Active Quest Log
              </h2>
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-zinc-900 bg-sky-50 p-6 flex gap-6 items-start">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <h3 className="font-black text-sky-800 uppercase tracking-tight">The React Region</h3>
                    <p className="mt-1 text-sm font-medium text-zinc-600">Currently traversing through state management and component reusability architectures.</p>
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-zinc-900 bg-rose-50 p-6 flex gap-6 items-start">
                  <span className="text-3xl">⚔️</span>
                  <div>
                    <h3 className="font-black text-rose-800 uppercase tracking-tight">Experience Points (XP)</h3>
                    <p className="mt-1 text-sm font-medium text-zinc-600">Scaling complex deployments and hardening UI/UX logic across different IT environments.</p>
                  </div>
                </div>
              </div>
            </div> 
          </div>

          {/* Badge Showcase Sidebar */}
          <aside className="rounded-[3rem] border-4 border-zinc-900 bg-[#3b4cca] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] text-white">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter">Gym Badges</h2>
               <div className="h-10 w-10 rounded-full bg-[#ffcb05] border-4 border-zinc-900 shadow-md"></div>
            </div>
            
            <div className="grid gap-4 grid-cols-2">
              {badges.map((badge, i) => (
                <div key={i} className="group flex flex-col items-center justify-center aspect-square rounded-3xl bg-white/10 border-2 border-dashed border-white/20 hover:bg-white hover:border-white transition-all cursor-crosshair">
                  <img 
                    src={badge.img} 
                    alt={badge.name} 
                    className="h-16 w-16 object-contain drop-shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-12"
                    style={{ imageRendering: 'pixelated' }} 
                  />
                  <span className="mt-3 text-[9px] font-black uppercase text-white/50 group-hover:text-[#3b4cca] transition-colors">{badge.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 p-4 rounded-2xl bg-black/20 border border-white/10">
               <p className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest text-center">Trainer Rank: ELITE</p>
               <div className="mt-2 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-yellow-400"></div>
               </div>
            </div>
          </aside>
        </div>

        {/* COMPONENT ALIGNMENT PATCH: Redesigned personal logs feed matching ArticleList cards exactly */}
        <div className="rounded-[2.5rem] border-4 border-zinc-900 bg-white p-8 shadow-[10px_10px_0px_0px_rgba(24,24,27,1)]">
          <div className="mb-8 flex items-center justify-between gap-4 border-b-4 border-zinc-100 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                Trainer Posts
              </p>
              <p className="text-3xl font-black uppercase italic tracking-tighter text-zinc-900">
                My Articles
              </p>
            </div>

            <span className="rounded-xl border-2 border-zinc-900 bg-[#ffcb05] px-4 py-1.5 text-sm font-black text-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {userArticles.length}
            </span>
          </div>

          {articlesLoading ? (
            <p className="py-12 text-center text-sm font-black uppercase tracking-widest text-zinc-400 animate-pulse">
              Loading personal articles...
            </p>
          ) : userArticles.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {userArticles.slice(0, 4).map((article, i) => (
                <article 
                  key={article._id || article.id || i} 
                  className="group relative flex flex-col rounded-[2.5rem] border-4 border-zinc-900 bg-white p-5 shadow-[10px_10px_0px_0px_rgba(24,24,27,1)] transition-all hover:-translate-y-2 animate-in fade-in zoom-in-95 duration-300 ease-out"
                >
                  {/* Header Block Layout */}
                  <div className="mb-4 flex items-center gap-3 border-b-2 border-zinc-50 pb-3">
                    <div className={`h-10 w-10 rounded-full border-2 border-zinc-900 ${article.color || 'bg-zinc-500'} shadow-inner flex items-center justify-center font-black text-white text-xs shrink-0`}>
                      {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-zinc-900 leading-none">{user.username}</p>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                        posted {getRelativeTime(article.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Graphic Feed Layout Container */}
                  <div className="flex aspect-[4/3] items-center justify-center rounded-[1.8rem] bg-zinc-100 overflow-hidden relative border-2 border-zinc-900 mb-4 shadow-inner">
                    <img 
                      src={renderArticleImage(article)} 
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
                      {article.desc || 'No description available.'}
                    </p>
                  </div>

                  {/* Direct Interactive Matrix Buttons */}
                  <div className="mt-6 flex items-center gap-3">
                    <Button 
                      to={`/articles/${article.name}`}
                      variant="secondary"
                      size="md"
                      className="flex-1 py-3 text-center" 
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
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border-4 border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-zinc-400">
                No personal articles posted yet.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AboutPage;