// rotompc-client/src/pages/LandingPages/ArticleListPage.jsx

import React, { useEffect, useMemo, useState } from "react";

import Button from "@/components/Button.jsx";
import ArticleList from "@/components/ArticleList.jsx";
import ArticlePost from "@/components/ArticlePost.jsx";

import * as articleService from "@/services/ArticleService";

/* =========================================================
   CONFIG
========================================================= */

const FALLBACK_IMAGE =
  "https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png";

/* =========================================================
   HELPERS
========================================================= */

const normalizeArticles = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.articles)) {
    return data.articles;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const getLikeCount = (article) => {
  if (typeof article?.likesCount === "number") {
    return article.likesCount;
  }

  if (Array.isArray(article?.likes)) {
    return article.likes.length;
  }

  if (typeof article?.likes === "number") {
    return article.likes;
  }

  return 0;
};

const getArticleTimestamp = (article) => {
  const value =
    article?.createdAt?.$date || article?.createdAt || article?.date || 0;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return date.getTime();
};

const getSearchText = (article) => {
  const content = Array.isArray(article?.content)
    ? article.content.join(" ")
    : article?.content || "";

  return [
    article?.title,
    article?.desc,
    article?.author,
    article?.name,
    article?.date,
    content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

/* =========================================================
   PAGE
========================================================= */

const ArticleListPage = () => {
  const [rawArticles, setRawArticles] = useState([]);

  const [articles, setArticles] = useState([]);

  const [activeFilter, setActiveFilter] = useState("latest");

  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [itemsToShow, setItemsToShow] = useState(8);

  /* =======================================================
     SORTING
  ======================================================= */

  const sortArticlesLatest = (list) => {
    return [...list].sort(
      (a, b) => getArticleTimestamp(b) - getArticleTimestamp(a),
    );
  };

  const shuffleArray = (list) => {
    return [...list].sort(() => Math.random() - 0.5);
  };

  const randomizeWithinMonthYearGroups = (list) => {
    const grouped = {};

    list.forEach((article) => {
      const timestamp = getArticleTimestamp(article);

      const date = timestamp ? new Date(timestamp) : new Date(0);

      const groupKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }

      grouped[groupKey].push(article);
    });

    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .flatMap((key) => shuffleArray(grouped[key]));
  };

  /* =======================================================
     APPLY FEED
  ======================================================= */

  const applyArticles = (data) => {
    const dataArray = normalizeArticles(data);

    const visibleArticles = dataArray.filter(
      (article) => article && (!article.status || article.status === "active"),
    );

    setRawArticles(visibleArticles);

    setArticles(sortArticlesLatest(visibleArticles));

    setActiveFilter("latest");

    setItemsToShow(8);
  };

  /* =======================================================
     LOAD FEED
  ======================================================= */

  const loadMainframeFeed = async (forceRefresh = false) => {
    try {
      setError("");

      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const cached = articleService.getStoredArticles();

      if (!forceRefresh && Array.isArray(cached) && cached.length > 0) {
        applyArticles(cached);
      }

      const response = await articleService.fetchArticles(forceRefresh);

      applyArticles(response.data);
    } catch (err) {
      console.error("Error loading PokéSocial feed:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load PokéSocial reports.",
      );
    } finally {
      setLoading(false);

      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMainframeFeed();
  }, []);

  /* =======================================================
     IMAGE
  ======================================================= */

  const renderArticleImage = (article) => {
    if (!article) {
      return FALLBACK_IMAGE;
    }

    if (article.imageUrl) {
      return article.imageUrl;
    }

    if (article._id) {
      return articleService.getArticleImageUrl(article._id) || FALLBACK_IMAGE;
    }

    return FALLBACK_IMAGE;
  };

  /* =======================================================
     ARTICLE UPDATE
  ======================================================= */

  const handleArticleUpdate = (articleId, updates) => {
    if (!articleId) {
      return;
    }

    const patchArticles = (list) =>
      list.map((article) => {
        if (String(article._id) !== String(articleId)) {
          return article;
        }

        return {
          ...article,
          ...updates,
        };
      });

    setRawArticles((current) => patchArticles(current));

    setArticles((current) => patchArticles(current));
  };

  /* =======================================================
     FILTERS
  ======================================================= */

  const toggleLatestFilter = () => {
    if (activeFilter === "latest") {
      setActiveFilter("");

      setArticles(randomizeWithinMonthYearGroups(rawArticles));
    } else {
      setActiveFilter("latest");

      setArticles(sortArticlesLatest(rawArticles));
    }

    setItemsToShow(8);
  };

  const toggleTopRatedFilter = () => {
    if (activeFilter === "top-rated") {
      setActiveFilter("");

      setArticles([...rawArticles]);
    } else {
      setActiveFilter("top-rated");

      setArticles(
        [...rawArticles].sort((a, b) => getLikeCount(b) - getLikeCount(a)),
      );
    }

    setItemsToShow(8);
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  useEffect(() => {
    setItemsToShow(8);
  }, [searchQuery]);

  const searchedArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return articles;
    }

    return articles.filter((article) => getSearchText(article).includes(query));
  }, [articles, searchQuery]);

  const visibleSubset = searchedArticles.slice(0, itemsToShow);

  const remainingArticles = Math.max(searchedArticles.length - itemsToShow, 0);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#eef1f6]
        pb-14
        font-sans
        text-zinc-950
        selection:bg-[#3b4cca]
        selection:text-white
      "
    >
      {/* =================================================
          HERO
      ================================================== */}

      <section
        className="
          relative
          overflow-hidden
          border-b-[6px]
          border-zinc-950
          bg-[#3b4cca]
          text-white
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.08]
            bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
            bg-[size:22px_22px]
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-24
            -top-28
            h-[340px]
            w-[340px]
            rounded-full
            border-[46px]
            border-white/10
          "
        />

        <div
          className="
            relative
            z-10
            mx-auto
            w-full
            max-w-7xl
            px-4
            py-8
            sm:px-6
            sm:py-10
            lg:px-8
          "
        >
          <div
            className="
              max-w-3xl
            "
          >
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.18em]
                text-yellow-300
              "
            >
              Global Trainer Network
            </p>

            <h1
              className="
                mt-3
                text-[2.7rem]
                font-black
                uppercase
                italic
                leading-[0.86]
                tracking-[-0.05em]
                text-white
                drop-shadow-[5px_5px_0_rgba(0,0,0,.22)]
                sm:text-6xl
                lg:text-7xl
              "
            >
              Poké
              <span
                className="
                  text-yellow-300
                "
              >
                Social
              </span>
            </h1>

            <p
              className="
                mt-5
                max-w-xl
                border-l-4
                border-yellow-300
                pl-4
                text-sm
                font-semibold
                leading-6
                text-blue-50/90
                sm:text-[15px]
                sm:leading-7
              "
            >
              Trainer reports, discoveries, sightings, stories, and field
              updates from the RotomPC community.
            </p>

            <div
              className="
                mt-6
                flex
                flex-wrap
                gap-3
              "
            >
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                variant="secondary"
                size="md"
                className="
                  !border-zinc-950
                  !bg-yellow-300
                  !font-black
                  !text-zinc-950
                  hover:!bg-yellow-200
                "
              >
                + Post Report
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          FEED
      ================================================== */}

      <main
        className="
          mx-auto
          w-full
          max-w-7xl
          px-3
          py-6
          sm:px-6
          sm:py-8
          lg:px-8
        "
      >
        <section
          className="
            overflow-hidden
            rounded-[1.8rem]
            border-[4px]
            border-zinc-950
            bg-white
            shadow-[7px_7px_0_#18181b]
          "
        >
          {/* ===============================================
              HEADER
          ================================================ */}

          <div
            className="
              border-b-[3px]
              border-zinc-950
              bg-white
              p-4
              sm:p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border-[3px]
                      border-zinc-950
                      bg-yellow-300
                      text-xl
                      shadow-[3px_3px_0_#18181b]
                    "
                  >
                    📡
                  </div>

                  <div>
                    <p
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.14em]
                        text-[#3b4cca]
                      "
                    >
                      PokéSocial
                    </p>

                    <h2
                      className="
                        text-xl
                        font-black
                        uppercase
                        italic
                        tracking-[-0.03em]
                        text-zinc-950
                        sm:text-2xl
                      "
                    >
                      Trainer Reports
                    </h2>
                  </div>
                </div>

                <div
                  className="
                    grid
                    grid-cols-3
                    gap-2
                    lg:flex
                  "
                >
                  <Button
                    type="button"
                    onClick={toggleLatestFilter}
                    variant={
                      activeFilter === "latest" ? "primary" : "secondary"
                    }
                    size="sm"
                    className="
                      !min-w-0
                      !px-2
                      !text-[8px]
                      sm:!px-4
                      sm:!text-[10px]
                    "
                  >
                    {activeFilter === "latest" ? "✓ Latest" : "Latest"}
                  </Button>

                  <Button
                    type="button"
                    onClick={toggleTopRatedFilter}
                    variant={
                      activeFilter === "top-rated" ? "primary" : "secondary"
                    }
                    size="sm"
                    className="
                      !min-w-0
                      !px-2
                      !text-[8px]
                      sm:!px-4
                      sm:!text-[10px]
                    "
                  >
                    {activeFilter === "top-rated" ? "✓ Top" : "Top Rated"}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => loadMainframeFeed(true)}
                    variant="secondary"
                    size="sm"
                    disabled={isRefreshing}
                    className="
                      !min-w-0
                      !px-2
                      !text-[8px]
                      disabled:opacity-50
                      sm:!px-4
                      sm:!text-[10px]
                    "
                  >
                    {isRefreshing ? "..." : "↻ Refresh"}
                  </Button>
                </div>
              </div>

              {/* =========================================
                  SEARCH
              ========================================== */}

              <div
                className="
                  relative
                  w-full
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-lg
                    text-zinc-400
                  "
                >
                  ⌕
                </div>

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search reports, trainers, titles..."
                  aria-label="Search PokéSocial reports"
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border-[3px]
                    border-zinc-950
                    bg-zinc-50
                    pl-11
                    pr-24
                    text-sm
                    font-bold
                    text-zinc-950
                    outline-none
                    transition
                    placeholder:text-zinc-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-[#3b4cca]/15
                  "
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="
                      absolute
                      right-2
                      top-1/2
                      -translate-y-1/2
                      rounded-lg
                      border-2
                      border-zinc-300
                      bg-white
                      px-3
                      py-1.5
                      text-[9px]
                      font-black
                      uppercase
                      text-zinc-600
                      transition
                      hover:border-zinc-950
                      hover:text-zinc-950
                    "
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ===============================================
              ERROR
          ================================================ */}

          {error && (
            <div
              className="
                border-b-[3px]
                border-zinc-950
                bg-red-50
                p-4
              "
            >
              <div
                className="
                  rounded-xl
                  border-2
                  border-red-300
                  bg-white
                  p-3
                  text-sm
                  font-bold
                  text-red-700
                "
              >
                {error}
              </div>
            </div>
          )}

          {/* ===============================================
              CONTENT
          ================================================ */}

          <div
            className="
              bg-[#f8f9fb]
              p-3
              sm:p-5
              lg:p-6
            "
          >
            {loading && visibleSubset.length === 0 ? (
              <div
                className="
                  flex
                  min-h-[360px]
                  items-center
                  justify-center
                  rounded-2xl
                  border-2
                  border-dashed
                  border-zinc-300
                  bg-white
                "
              >
                <div
                  className="
                    text-center
                  "
                >
                  <div
                    className="
                      mx-auto
                      h-10
                      w-10
                      animate-spin
                      rounded-full
                      border-4
                      border-zinc-200
                      border-t-[#3b4cca]
                    "
                  />

                  <p
                    className="
                      mt-4
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      text-zinc-400
                    "
                  >
                    Loading Reports
                  </p>
                </div>
              </div>
            ) : visibleSubset.length > 0 ? (
              <div
                className="
                  flex
                  flex-col
                  gap-7
                "
              >
                <ArticleList
                  articles={visibleSubset}
                  getImage={renderArticleImage}
                  onArticleUpdate={handleArticleUpdate}
                />

                {remainingArticles > 0 && (
                  <div
                    className="
                      flex
                      justify-center
                      border-t-2
                      border-zinc-200
                      pt-6
                    "
                  >
                    <Button
                      type="button"
                      onClick={() => setItemsToShow((current) => current + 8)}
                      variant="secondary"
                      size="md"
                      className="
                        !border-[3px]
                        !border-zinc-950
                        !bg-yellow-300
                        !font-black
                        !text-zinc-950
                        !shadow-[4px_4px_0_#18181b]
                        hover:!bg-yellow-200
                      "
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="
                  flex
                  min-h-[360px]
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border-[3px]
                  border-dashed
                  border-zinc-300
                  bg-white
                  px-6
                  text-center
                "
              >
                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    border-[3px]
                    border-zinc-950
                    bg-yellow-300
                    text-2xl
                    shadow-[4px_4px_0_#18181b]
                  "
                >
                  {searchQuery ? "⌕" : "📡"}
                </div>

                <h3
                  className="
                    mt-5
                    text-xl
                    font-black
                    uppercase
                    italic
                    text-zinc-950
                  "
                >
                  {searchQuery ? "No Matching Reports" : "No Reports Found"}
                </h3>

                <p
                  className="
                    mt-2
                    max-w-sm
                    text-sm
                    font-medium
                    leading-6
                    text-zinc-500
                  "
                >
                  {searchQuery
                    ? `Nothing matches "${searchQuery.trim()}".`
                    : "There are no active PokéSocial reports to display."}
                </p>

                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    justify-center
                    gap-2
                  "
                >
                  {searchQuery ? (
                    <Button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      variant="secondary"
                      size="sm"
                    >
                      Clear Search
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={() => loadMainframeFeed(true)}
                        variant="secondary"
                        size="sm"
                      >
                        Refresh
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        variant="primary"
                        size="sm"
                      >
                        Post Report
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <ArticlePost
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={() => loadMainframeFeed(true)}
      />
    </div>
  );
};

export default ArticleListPage;
