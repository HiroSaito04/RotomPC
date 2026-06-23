import magikarpDance from "../assets/res/magikarp-dance.gif";
import Button from "../components/Button";

function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] px-4 text-center -mt-20 pt-30 pb-4 w-full min-h-fit selection:bg-[#3b4cca] selection:text-white">
      
      {/* The Animated Magikarp Container */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 scale-110 blur-2xl bg-blue-400/20 rounded-full animate-pulse"></div>
        
        <img 
          src={magikarpDance} 
          alt="Magikarp Dancing" 
          className="relative h-48 w-48 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Error Code Tag */}
        <div className="absolute -right-4 top-0 rotate-12 rounded-md border-2 border-zinc-900 bg-red-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          Error 404
        </div>
      </div>

      {/* Text Content with "Glitch" Styling */}
      <div className="space-y-2">
        <h1 className="text-6xl font-black uppercase italic tracking-tighter text-zinc-900 sm:text-8xl">
          OUT OF <span className="text-[#ff1c1c]">BOUNDS</span>
        </h1>
        <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400">
          Page Not Found...
        </h2>
      </div>

      {/* Message Box */}
      <div className="mt-0 max-w-md rounded-2xl border-4 border-zinc-900 bg-white p-4 shadow-[10px_10px_0px_0px_rgba(24,24,27,1)] mb-3">
        <p className="font-['Times_New_Roman',_serif] text-sm font-bold leading-tight text-zinc-600 italic">
          "It looks like you've wandered too far from the tall grass. This page is as broken as a level 1 Magikarp's Splash attack."
        </p>
      </div>

       <div className="flex justify-start pt-8 px-8 bg-[#f0f2f5]">
          <Button 
            to="/" 
            className="z-20 bg-[#3b4cca] text-black px-6 py-2.5 border-b-4 border-black text-xs font-black uppercase italic active:border-b-0 active:translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            ← Back to RotomPC
          </Button>
        </div>

    </div>
  );
}

export default NotFoundPage;