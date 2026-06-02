import Button from './Button';

const ArticleList = ({ articles }) => {
  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
      {articles.map((article, i) => (
        <article key={i} className="group relative flex flex-col rounded-[2.5rem] border-4 border-zinc-900 bg-white p-5 shadow-[10px_10px_0px_0px_rgba(24,24,27,1)] transition-all hover:-translate-y-2">
          
          <div className="mb-4 flex items-center gap-3 border-b-2 border-zinc-50 pb-3">
            <div className={`h-10 w-10 rounded-full border-2 border-zinc-900 ${article.color} shadow-inner flex items-center justify-center font-black text-white text-xs`}>
              {article.author ? article.author.charAt(0) : '?'}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-zinc-900 leading-none">{article.author}</p>
              <p className="text-[9px] font-bold text-zinc-400 mt-1">LOG ENTRY #{article.id}</p>
            </div>
          </div>

          <div className="flex aspect-[4/3] items-center justify-center rounded-[1.8rem] bg-zinc-100 overflow-hidden relative border-2 border-zinc-900 mb-4 shadow-inner">
            <img 
              src={article.image} 
              alt={article.title} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
            <div className="absolute bottom-2 right-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-1 text-[8px] font-black text-white uppercase tracking-widest">
              Live_Feed
            </div>
          </div>

          <div className="flex-grow">
            <span className={`inline-block rounded-md border-2 border-zinc-900 bg-white px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`}>
              {article.date}
            </span>
            <h3 className="mt-3 text-xl font-black text-zinc-900 leading-tight italic uppercase tracking-tighter">
              {article.title}
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500 line-clamp-3">
              {article.desc}
            </p>
          </div>

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
              className="h-[38px] w-[38px] !px-0 !py-0 flex items-center justify-center bg-red-50 hover:bg-red-500 hover:text-white shrink-0 rounded-xl"
            >
              ❤️
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default ArticleList;