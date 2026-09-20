// rotompc-client/src/pages/LandingPages/PokemonPage.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { MAX_POKEMON_ID } from "@/constants/pokemon";
import { fetchPokemon, fetchPokemonProfile } from "@/services/PokemonService";
import {
  getEnglishFlavorText,
  getEnglishGenus,
  getGenderPercentages,
  getPokemonImages,
  getPokemonTypeStyles,
} from "@/utils/pokemonHelpers";

const PokemonPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();

  const [pokemon, setPokemon] = useState(null);
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadPokemon = async () => {
      try {
        setLoading(true);
        setPokemon(null);
        setSpecies(null);

        const result = await fetchPokemonProfile(name, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setPokemon(result.pokemon);
        setSpecies(result.species);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load Pokémon profile:", err);
          setPokemon(null);
          setSpecies(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPokemon();

    return () => controller.abort();
  }, [name]);

  const handleNavigation = async (direction) => {
    if (!pokemon || !species || navigating) {
      return;
    }

    let targetId = species.id;

    if (direction === "prev") {
      targetId -= 1;

      if (targetId < 1) {
        targetId = MAX_POKEMON_ID;
      }
    } else if (direction === "next") {
      targetId += 1;

      if (targetId > MAX_POKEMON_ID) {
        targetId = 1;
      }
    } else {
      return;
    }

    try {
      setNavigating(true);

      const targetPokemon = await fetchPokemon(targetId);

      navigate(`/pokedex/${targetPokemon.name}`);
    } catch (err) {
      console.error("Unable to navigate Pokédex:", err);
    } finally {
      setNavigating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#18181b] font-sans relative overflow-hidden p-4">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="h-16 w-16 md:h-20 md:w-20 animate-spin rounded-full border-8 border-zinc-700 border-t-[#ff1c1c] shadow-[0_0_20px_rgba(255,28,28,0.4)]"></div>

        <p className="mt-6 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-400 animate-pulse text-center">
          Scanning Field Target Vector...
        </p>
      </div>
    );
  }

  if (!pokemon || !species) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center font-sans h-screen bg-[#18181b] flex flex-col items-center justify-center">
        <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-widest border-4 border-zinc-950 bg-zinc-900 p-4 md:p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          Target Signature Missing
        </h2>

        <Link
          to="/pokedex"
          className="mt-6 inline-block font-black text-xs uppercase tracking-widest bg-white border-4 border-zinc-950 text-zinc-950 px-6 py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"
        >
          Return to Dex Matrix
        </Link>
      </div>
    );
  }

  const primaryType = pokemon.types[0]?.type?.name || "normal";
  const design = getPokemonTypeStyles(primaryType);
  const cleanDesc = getEnglishFlavorText(species);
  const category = getEnglishGenus(species);
  const { male: malePercentage, female: femalePercentage } =
    getGenderPercentages(species);
  const images = getPokemonImages(pokemon, species.id);

  return (
    <div className="flex w-full flex-col gap-4 md:gap-6 bg-[#18181b] min-h-screen pb-12 md:pb-20 font-sans selection:bg-[#ff1c1c] selection:text-white relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:20px_20px] md:bg-[size:30px_30px]" />

      <div className="absolute top-0 left-0 w-full h-[300px] md:h-[500px] bg-gradient-to-b from-[#ff1c1c]/5 to-transparent pointer-events-none" />

      {/* Navigation Matrix Panel */}

      <div className="p-4 max-w-5xl mx-auto w-full mt-2 md:mt-6 z-10 flex flex-row gap-2 items-center justify-between">
        <Link
          to="/pokedex"

          className="inline-flex items-center gap-1 md:gap-2 border-4 border-zinc-950 bg-white text-zinc-950 px-3 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <span>⬅️</span> <span className="hidden sm:inline">RotomDex</span>{" "}
          Index
        </Link>

        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => handleNavigation("prev")}

            disabled={navigating}

            className="inline-flex items-center gap-1 border-4 border-zinc-950 bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 px-3 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            ◀ PREV
          </button>

          <button
            onClick={() => handleNavigation("next")}

            disabled={navigating}

            className="inline-flex items-center gap-1 border-4 border-zinc-950 bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 px-3 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            NEXT ▶
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 items-start z-10">
        {/* Left Card: Visual Data Profile Frame */}

        <div className={`rotom-profile-card ${design.bg}`}>
          <div className="w-full flex justify-between items-center px-1">
            <span className="text-[10px] md:text-xs font-black text-zinc-500 tracking-widest">
              ID / NO. {String(species.id).padStart(4, "0")}
            </span>

            <span className="rounded-lg border-2 border-zinc-950 bg-white px-2 py-0.5 text-[9px] md:text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-zinc-950 truncate max-w-[150px]">
              {category}
            </span>
          </div>

          <div
            className={`w-full aspect-video bg-gradient-to-b ${design.grad} rounded-2xl md:rounded-3xl border-4 border-zinc-950 flex items-center justify-center relative mt-3 md:mt-4 shadow-inner overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_4px)]"></div>

            <img
              src={images.animated || images.standard || images.original}

              alt={pokemon.name}

              className="w-28 h-28 md:w-36 md:h-36 object-contain z-10 animate-bounce [animation-duration:5s]"

              onError={(e) => {
                if (e.target.src === images.animated && images.standard) {
                  e.target.src = images.standard;
                } else if (e.target.src !== images.original) {
                  e.target.src = images.original;
                }
              }}

              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <p className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-zinc-950 mt-4 md:mt-5 w-full text-left border-b-4 border-zinc-950 pb-1">
            {pokemon.name}
          </p>

          <p className="mt-3 md:mt-4 text-xs md:text-sm font-bold leading-relaxed text-zinc-700 bg-white/60 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-zinc-950/10 shadow-sm w-full">
            {cleanDesc}
          </p>

          <div className="flex flex-wrap gap-2 mt-4 md:mt-5 w-full justify-start">
            {pokemon.types.map((t) => {
              const typeStyles = getPokemonTypeStyles(t.type.name);

              return (
                <span
                  key={t.type.name}
                  className={`px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-black uppercase border-4 border-zinc-950 ${typeStyles.accent} text-zinc-950 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
                >
                  {t.type.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right Card: Technical Performance Data Pools */}

        <div className="rotom-metrics-card">
          <div className="w-full space-y-5 md:space-y-6">
            <div>
              <h3 className="text-[10px] md:text-xs font-black tracking-widest text-zinc-400 uppercase border-b-2 border-zinc-700 pb-2">
                Core Metrics
              </h3>

              <div className="grid grid-cols-2 gap-3 md:gap-4 my-3 md:my-4">
                <div className="bg-zinc-950 border-2 border-zinc-800 p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-inner">
                  <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-500 block tracking-wider">
                    Physical Height
                  </span>

                  <span className="text-base md:text-xl font-black text-yellow-400">
                    {pokemon.height / 10} M
                  </span>
                </div>

                <div className="bg-zinc-950 border-2 border-zinc-800 p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-inner">
                  <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-500 block tracking-wider">
                    Mass Metric
                  </span>

                  <span className="text-base md:text-xl font-black text-emerald-400">
                    {pokemon.weight / 10} KG
                  </span>
                </div>
              </div>

              <div className="bg-zinc-950 border-2 border-zinc-800 p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 md:mb-6 space-y-1.5">
                <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-500 block tracking-wider">
                  Gender Verification Profiles
                </span>

                {femalePercentage === null ? (
                  <span className="text-xs md:text-sm font-black text-zinc-400 italic uppercase">
                    Genderless Signal Lock
                  </span>
                ) : (
                  <div className="flex gap-4 text-xs md:text-sm font-black">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <span>♂</span> <span>{malePercentage}%</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-pink-400">
                      <span>♀</span> <span>{femalePercentage}%</span>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-[10px] md:text-xs font-black tracking-widest text-zinc-400 uppercase mb-2.5">
                Ability Modulators
              </h3>

              <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                {pokemon.abilities.map((a) => (
                  <div
                    key={a.ability.name}

                    className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl border-2 text-[10px] md:text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${
                      a.is_hidden
                        ? "bg-purple-950/40 border-purple-500/50 text-purple-300"
                        : "bg-zinc-950 border-zinc-800 text-yellow-400"
                    }`}
                  >
                    <span>{a.ability.name.replace("-", " ")}</span>

                    {a.is_hidden && (
                      <span className="text-[7px] md:text-[8px] px-1 py-0.5 rounded bg-purple-500 text-zinc-950 font-extrabold tracking-tighter">
                        HIDDEN
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="text-[10px] md:text-xs font-black tracking-widest text-zinc-400 uppercase mb-3">
                Performance Data Pools
              </h3>

              <div className="space-y-2.5 md:space-y-3.5">
                {pokemon.stats.map((s) => (
                  <div key={s.stat.name} className="space-y-1">
                    <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                      <span className="text-zinc-400 truncate max-w-[140px]">
                        {s.stat.name.replace("-", " ")}
                      </span>

                      <span className="text-yellow-400 text-xs">
                        {s.base_stat}
                      </span>
                    </div>

                    <div className="h-2.5 md:h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-yellow-400 rounded-full transition-all duration-500 ease-out"

                        style={{
                          width: `${Math.min((s.base_stat / 160) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-[8px] md:text-[9px] font-black tracking-widest text-zinc-500 uppercase">
              <span>Rotom-Dex OS v8.0.2</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PokemonPage;
