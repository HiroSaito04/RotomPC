// rotompc-client\src\pages\ArticlePage\ArticlePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@/components/Button.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';
import * as articleService from '../../services/ArticleService';

function ArticlePage() {
  const { name } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

const renderArticleImage = (row) => {
  if (!row) return '';

  if (row.imageBuffer && row.imageMimeType) {
    const binaryString = typeof row.imageBuffer === 'string'
      ? row.imageBuffer
      : btoa(
          new Uint8Array(row.imageBuffer.data || row.imageBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

    return `data:${row.imageMimeType};base64,${binaryString}`;
  }

  if (row.imageUrl) return row.imageUrl;

  if (row._id) return articleService.getArticleImageUrl(row._id);

  return 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
};

  const getRelativeTime = (createdAtString) => {
    if (!createdAtString) return 'RECENT';

    try {
      const dateValue =
        typeof createdAtString === 'object' && createdAtString.$date
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
      console.error('Interval processing failure:', error);
      return 'RECENT';
    }
  };

  // Fixed Helper Engine: Attaches broken lines while preserving text linebreaks and paragraph separation structures.
  const getFormattedContent = () => {
    if (!article?.content) return [];

    // 1. Normalize array data pools or pure string formats into uniform arrays of paragraphs
    const paragraphs = Array.isArray(article.content)
      ? article.content.filter(Boolean).map(item => String(item))
      : String(article.content).split(/\n{2,}/);

    return paragraphs
      .map((paragraph) => {
        // Split text by lines, preserving structural code segments, lines, or lists
        const lines = paragraph.split('\n');
        const fixedLines = [];

        lines.forEach((currentLine) => {
          const trimmedLine = currentLine.trim();
          const previousLine = fixedLines[fixedLines.length - 1];

          // Edge Condition Check: Should this line merge back up with the previous text index?
          const shouldAttachToPrevious =
            previousLine &&
            trimmedLine.length > 0 &&
            trimmedLine.length <= 45 &&
            !/^[•\-*0-9]/.test(trimmedLine) && // Don't strip structured point markdown headers
            !/[.!?]"?$/.test(previousLine.trim()); // Only attach if the previous sentence was left open/detached

          if (shouldAttachToPrevious) {
            fixedLines[fixedLines.length - 1] = `${previousLine} ${trimmedLine}`;
          } else {
            // Keep the exact original padding space or structural line break intact
            fixedLines.push(currentLine);
          }
        });

        return fixedLines.join('\n');
      })
      .filter(Boolean);
  };

useEffect(() => {
  if (!name) {
    setLoading(false);
    return;
  }

  setLoading(true);

  articleService.fetchArticleByName(name)
    .then((res) => {
      setArticle(res.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error('Error retrieving full article document', err);
      setArticle(null);
      setLoading(false);
    });
}, [name]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] font-sans">
        <div className="rounded-3xl border-4 border-zinc-900 bg-white px-8 py-6 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
          <p className="animate-pulse text-lg font-black uppercase tracking-widest text-zinc-500">
            Loading Article...
          </p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-[#f8fafc]">
        <div className="flex flex-1 flex-col items-center justify-center">
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
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-yellow-400 selection:text-zinc-950">
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Button to="/articles" variant="secondary" size="sm" className="font-black tracking-tight">
            ← Return to Social Feed
          </Button>

          <span className="rounded-full border-2 border-zinc-900 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
            Rotom Article
          </span>
        </div>

        <article className="clearfix">
          <div className="mb-8 lg:float-left lg:mr-8 lg:w-[56%]">
            <div className="overflow-hidden rounded-[2rem] border-4 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)]">
              <div className="relative aspect-video overflow-hidden border-b-4 border-zinc-900 bg-zinc-900">
                <img
                  src={renderArticleImage(article)}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border-2 border-zinc-900 bg-black/80 px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                  </span>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.08)_50%)] bg-[length:100%_4px]" />
              </div>

              <div className="bg-white p-6 sm:p-8">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className={`rounded-lg border-2 border-zinc-900 ${article.color || 'bg-zinc-500'} px-3 py-1 text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    {article.date || 'RECENT'}
                  </span>

                  <span className="rounded-lg border-2 border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    LOG #{String(article.id || 'N/A').toUpperCase()}
                  </span>
                </div>

                <p className="text-4xl font-black uppercase italic leading-[0.9] tracking-tighter text-zinc-900 sm:text-5xl lg:text-6xl">
                  {article.title}
                </p>

                {article.desc && (
                  <div className="mt-6 rounded-2xl border-4 border-zinc-900 bg-zinc-50 p-5 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)]">
                    <p className="text-base font-bold italic leading-relaxed text-zinc-700">
                      “{article.desc}”
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.8rem] border-4 border-zinc-900 bg-[#ffcb05] p-5 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-white text-xl font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {article.author ? article.author.charAt(0).toUpperCase() : '?'}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800/70">
                      Published By
                    </p>
                    <p className="truncate text-xl font-black uppercase italic tracking-tighter text-zinc-900">
                      {article.author || 'Unknown Trainer'}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 rounded-lg border border-zinc-950 bg-zinc-950 px-2 py-1 text-[10px] font-black uppercase tracking-tight text-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {getRelativeTime(article.createdAt)}
                </p>
              </div>
            </div>

            <div className="rounded-[1.8rem] border-4 border-zinc-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] sm:p-8">
              <div className="mb-6 flex items-center gap-3 border-b-4 border-zinc-100 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-zinc-900 bg-[#3b4cca] text-lg shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
                  📄
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                    Document Body
                  </p>
                  <p className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">
                    Full Report
                  </p>
                </div>
              </div>

              <div className="max-w-none">
                {getFormattedContent().length > 0 ? (
                  getFormattedContent().map((paragraph, index) => (
                    <p
                      key={index}
                      className="mb-7 whitespace-pre-line text-left text-lg leading-8 text-zinc-800 last:mb-0 sm:text-md sm:leading-9"
                    >
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm italic text-zinc-400">
                    No matching log body records found in system partition.
                  </p>
                )}
              </div>
            </div>
          </div>
        </article>

        <div className="clear-both pt-12">
          <Button
            to="/articles"
            variant="secondary"
            size="md"
            className="rounded-xl border-4 border-zinc-900 font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Close Report Terminal
          </Button>
        </div>
      </main>
    </div>
  );
}

export default ArticlePage;