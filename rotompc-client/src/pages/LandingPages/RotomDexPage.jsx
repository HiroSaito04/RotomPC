// rotompc-client/src/pages/LandingPages/RotomDexPage.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { POKEMON_GENERATIONS, POKEMON_TYPE_FILTERS } from "@/constants/pokemon";
import { fetchPokemonRange } from "@/services/PokemonService";
import { normalizeDexPokemon } from "@/utils/pokemonHelpers";

const RotomDexPage = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedGen, setSelectedGen] = useState("GEN1");

  useEffect(() => {
    const controller = new AbortController();

    const loadGeneration = async () => {
      try {
        setLoading(true);
        setError("");

        const generation = POKEMON_GENERATIONS[selectedGen];

        if (!generation) {
          throw new Error("Unknown Pokédex generation.");
        }

        const pokemon = await fetchPokemonRange({
          offset: generation.offset,
          limit: generation.limit,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setPokemonList(pokemon.map(normalizeDexPokemon));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load Pokédex generation:", err);
          setPokemonList([]);
          setError("Unable to synchronize this Pokédex generation.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadGeneration();

    return () => controller.abort();
  }, [selectedGen]);

  const filteredPokemon = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return pokemonList.filter((poke) => {
      const matchesSearch =
        !normalizedSearch ||
        poke.name.toLowerCase().includes(normalizedSearch) ||
        poke.dexNo.includes(normalizedSearch);

      const matchesType =
        selectedType === "ALL" ||
        poke.types.some(
          (type) => type.toUpperCase() === selectedType.toUpperCase(),
        );

      return matchesSearch && matchesType;
    });
  }, [pokemonList, searchQuery, selectedType]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#1e1e24] font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="h-20 w-20 animate-spin rounded-full border-8 border-zinc-700 border-t-[#ff1c1c] shadow-[0_0_20px_rgba(255,28,28,0.4)]"></div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.4em] text-zinc-400 animate-pulse z-10">
          Syncing Rotom Core Data...
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 bg-[#18181b] min-h-screen pb-20 font-sans selection:bg-[#ff1c1c] selection:text-white relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#ff1c1c]/10 to-transparent pointer-events-none" />

      {/* Header Banner */}
      <section className="border-b-[12px] border-zinc-950 bg-[#ff1c1c] px-4 py-10 text-white relative shadow-2xl">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-block rounded-md bg-zinc-950 px-3 py-1 shadow-md border border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">
                Mainframe Database // Global Query
              </p>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter sm:text-6xl drop-shadow-[4px_4px_0px_rgba(0,0,0,0.4)]">
              Rotom-Dex Database
            </h1>
          </div>
          <div className="shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 border-4 border-zinc-950 bg-white text-zinc-950 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-zinc-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              HOMEPAGE
            </Link>
          </div>
        </div>
      </section>

      {/* Operation Terminal Layout */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="border-4 border-zinc-950 bg-zinc-900 p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
              <div className="relative">
                <select
                  value={selectedGen}
                  onChange={(e) => setSelectedGen(e.target.value)}
                  className="w-full sm:w-64 bg-zinc-950 border-4 border-zinc-950 text-yellow-400 px-4 py-2.5 rounded-xl font-black text-xs tracking-wider appearance-none focus:outline-none focus:border-yellow-400 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {Object.keys(POKEMON_GENERATIONS).map((key) => (
                    <option
                      key={key}
                      value={key}
                      className="bg-zinc-900 text-white font-bold"
                    >
                      {POKEMON_GENERATIONS[key].label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-400 text-xs">
                  ▼
                </span>
              </div>

              <div className="relative flex-1 md:max-w-xs">
                <input
                  type="text"
                  placeholder="SEARCH ENGINE LOG..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border-4 border-zinc-950 text-white px-4 py-2.5 rounded-xl font-bold uppercase placeholder-zinc-600 text-xs tracking-wider focus:outline-none focus:border-yellow-400 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">
                  🔍
                </span>
              </div>
            </div>

            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-lg px-3 py-1 text-right self-stretch md:self-auto flex items-center justify-center">
              <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                LOADED:{" "}
                <span className="text-emerald-400">
                  {filteredPokemon.length}
                </span>{" "}
                UNITS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800 max-h-24 overflow-y-auto custom-scrollbar">
            {POKEMON_TYPE_FILTERS.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 text-[10px] font-black tracking-wider rounded-lg border-2 border-zinc-950 transition-all ${
                  selectedType === type
                    ? "bg-yellow-400 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="rounded-2xl border-4 border-red-950 bg-red-100 px-5 py-4 text-sm font-black uppercase tracking-wide text-red-800 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            {error}
          </div>
        </section>
      )}

      {/* Main Grid View Vector */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        {filteredPokemon.length === 0 ? (
          <div className="text-center py-20 border-4 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/50">
            <p className="text-sm font-black tracking-widest text-zinc-500 uppercase">
              No Data Logs Found Matching Request Parameters
            </p>
          </div>
        ) : (
          /* MODIFIED: Fixed columns to 3 on mobile (grid-cols-3) up to tablet (sm:grid-cols-3) */
          <div className="grid gap-2 sm:gap-6 grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredPokemon.map((poke) => (
              <article
                key={poke.id}
                /* MODIFIED: Reduced borders on mobile (border-2 to border-4) and card tracking gaps */
                className={`group relative rounded-xl sm:rounded-[2rem] border-2 sm:border-4 border-zinc-950 ${poke.bg} p-1 sm:p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-[1.03] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)]`}
              >
                {/* MODIFIED: Scaled down interior layout margins and internal paddings */}
                <div className="rounded-lg sm:rounded-[1.7rem] p-1.5 sm:p-4 flex flex-col h-full justify-between">
                  <div
                    className={`relative flex aspect-square items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-b ${poke.grad} border-2 sm:border-4 border-zinc-950 shadow-inner overflow-hidden`}
                  >
                    <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_4px)]" />
                    <img
                      src={poke.image || poke.fallbackImage}
                      alt={poke.name}
                      className="relative z-10 w-12 h-12 sm:w-24 sm:h-24 object-contain transition-transform group-hover:scale-125"
                      onError={(e) => {
                        if (
                          e.target.src === poke.image &&
                          poke.image !== poke.fallbackImage
                        ) {
                          e.target.src = poke.fallbackImage;
                        } else if (e.target.src !== poke.originalFallback) {
                          e.target.src = poke.originalFallback;
                        }
                      }}
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>

                  {/* MODIFIED: Structured text and layout tags to safely wrap inside tiny 3-row grid columns */}
                  <div className="mt-1.5 sm:mt-4 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-0.5 sm:gap-1">
                    <div className="truncate w-full">
                      <span className="text-[6px] sm:text-[9px] font-black uppercase text-zinc-500 tracking-wider sm:tracking-widest block">
                        NO. {poke.dexNo}
                      </span>
                      <h3 className="text-[9px] sm:text-base font-black text-zinc-950 italic uppercase leading-tight truncate">
                        {poke.name}
                      </h3>
                    </div>

                    {/* MODIFIED: Stack tags horizontally, with smaller mobile typography */}
                    <div className="flex flex-wrap gap-0.5 mt-0.5 lg:mt-0 shrink-0">
                      {poke.types.map((t) => (
                        <span
                          key={t}
                          className="rounded border sm:border-2 border-zinc-950 bg-white px-1 py-0.5 text-[5px] sm:text-[8px] font-black uppercase text-zinc-950"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* MODIFIED: Adjusted buttons for tight viewport widths */}
                  <Link
                    to={`/pokedex/${poke.slug}`}
                    className="mt-2 sm:mt-4 block w-full text-center border-2 sm:border-4 border-zinc-950 bg-white text-zinc-950 py-1 rounded-md sm:rounded-lg text-[7px] sm:text-[10px] font-black uppercase italic tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r hover:from-zinc-50 hover:to-zinc-100"
                  >
                    OPEN LOG
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RotomDexPage;
