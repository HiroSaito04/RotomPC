import { useState, useEffect } from 'react';
import Button from '@/components/Button';

const HomePage = () => {
  // Mainframe Scanner (Randomizer) States
  const [scannerMon, setScannerMon] = useState(null);
  
  // Chronological Carousel States
  const [carouselPokemon, setCarouselPokemon] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1); // Start at dex ID 1 (Bulbasaur)
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  // Styling helper for types mapping
  const getTypeStyles = (type) => {
    const styles = {
      fire: { bg: 'bg-orange-50', grad: 'from-orange-400 to-red-500' },
      water: { bg: 'bg-blue-50', grad: 'from-blue-400 to-blue-600' },
      grass: { bg: 'bg-green-50', grad: 'from-green-400 to-green-600' },
      electric: { bg: 'bg-yellow-50', grad: 'from-yellow-400 to-amber-500' },
      bug: { bg: 'bg-lime-50', grad: 'from-lime-400 to-lime-600' },
      normal: { bg: 'bg-zinc-100', grad: 'from-zinc-300 to-zinc-400' },
      poison: { bg: 'bg-purple-50', grad: 'from-purple-400 to-purple-600' },
      ground: { bg: 'bg-yellow-100/50', grad: 'from-amber-600 to-amber-800' },
      fairy: { bg: 'bg-pink-50', grad: 'from-pink-300 to-pink-500' },
      psychic: { bg: 'bg-rose-50', grad: 'from-rose-400 to-pink-600' },
      fighting: { bg: 'bg-red-50', grad: 'from-red-500 to-zinc-700' },
      rock: { bg: 'bg-stone-100', grad: 'from-stone-400 to-stone-600' },
      ghost: { bg: 'bg-indigo-50', grad: 'from-indigo-400 to-purple-800' },
      ice: { bg: 'bg-cyan-50', grad: 'from-cyan-300 to-blue-400' },
      dragon: { bg: 'bg-violet-50', grad: 'from-violet-500 to-indigo-700' },
    };
    return styles[type?.toLowerCase()] || { bg: 'bg-zinc-50', grad: 'from-zinc-400 to-zinc-600' };
  };

  // --- Core Lifecycle 1: High-Tech Random Scanner Subsystem ---
  useEffect(() => {
    const fetchRandomScannerMon = async () => {
      try {
        const randomId = Math.floor(Math.random() * 151) + 1;
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await res.json();
        
        setScannerMon({
          name: data.name,
          image: data.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || data.sprites.front_default
        });
      } catch (err) {
        console.error("Scanner stream drop:", err);
      }
    };

    fetchRandomScannerMon();
    const scannerInterval = setInterval(fetchRandomScannerMon, 5000);

    return () => clearInterval(scannerInterval);
  }, []);

  // --- Core Lifecycle 2: Chronological Carousel Paginated Streams (OPTIMIZED) ---
  useEffect(() => {
    const fetchCarouselBatch = async () => {
      try {
        setLoadingCarousel(true);
        const idBatch = [currentIndex, currentIndex + 1, currentIndex + 2].filter(id => id <= 151);

        const dataPromises = idBatch.map(async (id) => {
          const [detailRes, speciesRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
            fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
          ]);

          const detailData = await detailRes.json();
          const speciesData = await speciesRes.json();

          const englishLog = speciesData.flavor_text_entries.find(
            (entry) => entry.language.name === 'en'
          );
          const cleanDesc = englishLog 
            ? englishLog.flavor_text.replace(/[\n\f]/g, ' ') 
            : 'Core diagnostic vectors mapped securely inside system constraints.';

          const primaryType = detailData.types[0]?.type?.name || 'normal';
          const typeDesign = getTypeStyles(primaryType);

          return {
            name: detailData.name,
            id: detailData.id,
            no: String(detailData.id).padStart(3, '0'),
            type: primaryType,
            bg: typeDesign.bg,
            grad: typeDesign.grad,
            image: detailData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || detailData.sprites.front_default,
            fallbackImage: detailData.sprites.front_default,
            desc: cleanDesc
          };
        });

        const completedBatch = await Promise.all(dataPromises);
        setCarouselPokemon(completedBatch);
      } catch (err) {
        console.error("Carousel vector loading failure:", err);
      } finally {
        setLoadingCarousel(false);
      }
    };

    fetchCarouselBatch();
  }, [currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 1) {
      setCurrentIndex(prev => Math.max(1, prev - 3));
    }
  };

  const handleNext = () => {
    if (currentIndex + 3 <= 151) {
      setCurrentIndex(prev => prev + 3);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 md:gap-10 bg-[#e5e7eb] pb-16 md:pb-20 font-sans selection:bg-[#ff1c1c] selection:text-white">
      
      {/* Hero Section: The Master Unit */}
      <section className="relative overflow-hidden border-b-[8px] md:border-b-[12px] border-zinc-900 bg-[#ff1c1c] px-4 py-10 md:py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative z-10 mx-auto max-w-7xl grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4 md:space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-block rounded-md bg-zinc-900 px-3 py-1 shadow-lg">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">
                System Version 3.0.5 // PALDEA
              </p>
            </div>
            
            <h1 className="text-4xl font-black leading-[1.0] sm:text-7xl drop-shadow-[3px_3px_0px_rgba(0,0,0,0.3)] italic uppercase tracking-tighter">
              Gotta Catch <br />
              <span className="text-zinc-900 underline decoration-yellow-400 underline-offset-4 md:underline-offset-8">'Em All!</span>
            </h1>
            
            <p className="max-w-md text-sm sm:text-base md:text-xl font-bold leading-relaxed text-red-100 border-t-4 lg:border-t-0 lg:border-l-4 border-yellow-400 pt-3 lg:pt-0 lg:pl-4 whitespace-pre-line">
              {`Welcome to the most advanced Pokémon database ever created. \nPowered by Rotom-Dex with real-time map mapping, data scanning, and field analysis.`}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2 w-full sm:w-auto">
              <Button to="/about" variant="primary" size="md" className="w-full sm:w-auto text-center justify-center">
                SEE TRAINER ID
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-full sm:w-auto justify-center">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Network Online</span>
              </div>
            </div>
          </div>

          {/* High-Tech Randomizer Scanner Frame */}
          <div className="relative group mx-auto w-full max-w-xs sm:max-w-md mt-4 lg:mt-0">
            <div className="relative aspect-square rounded-2xl md:rounded-3xl border-[8px] md:border-[12px] border-zinc-900 bg-zinc-800 p-3 md:p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] md:shadow-[15px_15px_0px_0px_rgba(0,0,0,0.2)] transition-transform group-hover:rotate-1">
              <div className="relative h-full w-full overflow-hidden rounded-xl border-4 border-zinc-700 bg-[#3b4cca]">
                 <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]"></div>
                 
                 <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 to-blue-800 p-4 md:p-8">
                    <div className="relative h-36 w-36 md:h-48 md:w-48 rounded-full bg-white/10 border-4 border-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                      <div className="absolute h-28 w-28 md:h-40 md:w-40 rounded-full border-4 border-dashed border-yellow-400/30 animate-[spin_10s_linear_infinite]" />
                      
                      {scannerMon ? (
                        <div className="flex flex-col items-center justify-center">
                          <img 
                            key={scannerMon.name}
                            src={scannerMon.image} 
                            alt={scannerMon.name} 
                            className="relative z-50 w-20 h-20 md:w-24 md:h-24 object-contain" 
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <span className="absolute bottom-2 md:bottom-3 text-yellow-400 font-black italic text-[10px] md:text-xs tracking-[0.2em] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] bg-zinc-900/80 px-2 py-0.5 border border-zinc-700 rounded-md uppercase max-w-[140px] truncate text-center">
                            {scannerMon.name}
                          </span>
                        </div>
                      ) : (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      )}
                    </div>
                    
                    <div className="mt-4 md:mt-6 w-full space-y-1.5 opacity-80">
                      <p className="text-[8px] md:text-[9px] font-black tracking-widest text-blue-200 uppercase text-center animate-pulse">
                        // ROTOM LIVE INTERCEPT ACTIVE //
                      </p>
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden"><div className="h-full w-[65%] bg-yellow-400 animate-pulse" /></div>
                    </div>
                 </div>
              </div>
              <div className="absolute -left-6 md:-left-8 top-1/2 -translate-y-1/2 space-y-1.5 md:space-y-2">
                <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-zinc-900" />
                <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-zinc-900" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="mx-auto -mt-8 md:-mt-12 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'National Dex', val: '1025', color: 'bg-indigo-600', icon: '🌐' },
            { label: 'Regional Dex Entry', val: '151', color: 'bg-red-500', icon: '🗺️' },
            { label: 'Discovered Regions', val: '09', color: 'bg-emerald-500', icon: '🏔️' },
            { label: 'Types', val: '18', color: 'bg-amber-500', icon: '🧬' }
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl md:rounded-2xl border-4 border-zinc-900 bg-white p-4 md:p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] md:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] transition-all hover:-translate-y-1">
              <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg md:rounded-xl border-2 border-zinc-900 ${stat.color} text-xl md:text-2xl shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl md:text-2xl font-black text-zinc-900 leading-none">{stat.val}</p>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chronological Research Lab Registry */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
        <div className="flex flex-col items-start text-left gap-1 border-b-4 border-zinc-300 pb-3 md:pb-4">
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 uppercase italic tracking-tighter">Chronological Index Log</h2>
          <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider">Sequential Database Streaming Matrix</p>
        </div>

        {/* Flanked Carousel Layout Container */}
        {/* On mobile, this uses a vertical flex sequence. Elements arrange natively or get adjusted */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 relative px-10 md:px-0">
          
          {/* LEFT ARROW BUTTON */}
          {/* Mobile: Absolute position aligned perfectly next to the middle (2nd) card */}
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 1}
            className="absolute left-0 top-[50%] md:top-auto -translate-y-1/2 md:translate-y-0 md:relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 md:h-14 md:w-14 shrink-0 border-4 border-zinc-900 bg-white text-zinc-900 font-black rounded-lg md:rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all z-20 text-sm md:text-xl order-1"
          >
            ◀
          </button>

          {/* CORE CARDS CONTENT GRID WINDOW */}
          <div className="flex-1 order-2">
            {loadingCarousel ? (
              <div className="flex justify-center items-center py-20 md:py-32 w-full">
                <div className="h-11 w-11 animate-spin rounded-full border-4 border-zinc-300 border-t-[#ff1c1c]"></div>
              </div>
            ) : (
              /* Mobile first: 1 column vertical structure. Cards are padded nicely */
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 w-full">
                {carouselPokemon.map((poke) => (
                  <article key={poke.id} className={`rotom-card ${poke.bg}`}>
                    {/* Compact structural padding for small mobile displays */}
                    <div className="p-3 md:p-5">
                      
                      {/* Image Preview Box - Aspect video scaled lower on mobile */}
                      <div className={`relative flex aspect-[21/9] md:aspect-video items-center justify-center rounded-lg md:rounded-2xl bg-gradient-to-b ${poke.grad} border-4 border-zinc-900 shadow-inner overflow-hidden`}>
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_4px)]" />
                        <img 
                          src={poke.image} 
                          alt={poke.name} 
                          className="relative z-10 w-14 h-14 md:w-24 md:h-24 object-contain transition-transform group-hover:scale-110" 
                          onError={(e) => {
                            e.target.src = poke.fallbackImage;
                          }}
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>

                      {/* Header Badge Layer */}
                      <div className="mt-2 md:mt-6 flex justify-between items-start gap-2">
                        <div className="truncate">
                          <span className="text-[8px] md:text-[10px] font-black uppercase text-zinc-400 tracking-widest block">NO. {poke.no}</span>
                          <h3 className="text-base md:text-2xl font-black text-zinc-900 italic uppercase leading-none mt-0.5 truncate">{poke.name}</h3>
                        </div>
                        <span className="rounded-md md:rounded-lg border-2 border-zinc-900 bg-white px-1.5 py-0.5 md:py-1 text-[8px] md:text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          {poke.type}
                        </span>
                      </div>

                      {/* Summary Vector Log */}
                      <p className="mt-2 md:mt-4 text-[11px] md:text-sm font-bold leading-normal md:leading-relaxed text-zinc-600 line-clamp-2 md:line-clamp-3 h-8 md:h-15">
                        {poke.desc}
                      </p>
                      
                      <Button 
                        to={`/pokedex/${poke.name}`}
                        variant="secondary" 
                        size="sm" 
                        className="mt-3 md:mt-8 w-full text-center justify-center py-1.5 text-xs md:text-sm font-black"
                      >
                        OPEN DATA LOG
                      </Button>
                    </div>
                  </article>
                ))}
              </div>     
            )} 
          </div>

          {/* RIGHT ARROW BUTTON */}
          {/* Mobile: Absolute position aligned perfectly next to the middle (2nd) card */}
          <button 
            onClick={handleNext}
            disabled={currentIndex + 3 > 151}
            className="absolute right-0 top-[50%] md:top-auto -translate-y-1/2 md:translate-y-0 md:relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 md:h-14 md:w-14 shrink-0 border-4 border-zinc-900 bg-zinc-900 text-white font-black rounded-lg md:rounded-xl shadow-[2px_2px_0px_0px_rgba(255,28,28,1)] md:shadow-[4px_4px_0px_0px_rgba(255,28,28,1)] hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(255,28,28,1)] transition-all z-20 text-sm md:text-xl order-3"
          >
            ▶
          </button>
          
        </div>
      </section>

      {/* View Full RotomDex Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        <div className="flex justify-center">
          <Button 
            to="/pokedex" 
            variant="primary" 
            size="lg" 
            className="w-full sm:w-auto px-6 py-3 md:px-12 md:py-4 text-base md:text-xl font-black italic tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center justify-center"
          >
            📟 ACCESS FULL ROTOMDEX SYSTEM
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;