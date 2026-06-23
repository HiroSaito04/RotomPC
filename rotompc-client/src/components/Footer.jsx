import { NavLink } from 'react-router-dom';

const links = [
  { label: 'PokeDex', to: '/' },
  { label: 'Trainer ID', to: '/about' },
  { label: 'PokeSocial', to: '/articles' },
];

const Footer = () => {
  return (
    /* ⚡ Fix: Strict height clamping at the root level ensures uniformity */
    <footer className="mt-auto w-full h-24 sm:h-28 border-t-[6px] border-zinc-900 bg-[#f3f4f6] flex flex-col justify-between overflow-hidden select-none">
      
      {/* MAIN CONTAINER ROW */}
      {/* ⚡ Fix: Eliminated the grid layout completely in favor of a non-wrapping flex-row */}
      <div className="w-full flex flex-row items-center justify-between gap-2 px-3 py-2 sm:px-6 lg:px-8 max-w-7xl mx-auto h-full min-w-0">
        
        {/* Left Node: Brand/System Info */}
        <div className="flex flex-col justify-center min-w-0 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-zinc-900 shrink-0"></div>
            <span className="text-xs sm:text-base font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
              ROTOM<span className="text-[#ff1c1c]">PC</span>
            </span>
          </div>
          <p className="text-[7px] sm:text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5 whitespace-nowrap truncate">
             ROTOM WEB SYSTEM
          </p>
        </div>
        
        {/* Middle Node: Integrated Compact Navigation Menu */}
        {/* ⚡ Structural Addition: Responsive text scales down smoothly without line-wrapping */}
        <nav className="flex items-center justify-center gap-2 sm:gap-4 px-2 min-w-0">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                [
                  'text-[8px] sm:text-[11px] font-black uppercase tracking-wider italic transition-colors leading-none shrink-0',
                  isActive 
                    ? 'text-[#3b4cca] underline decoration-2 underline-offset-2 font-black' 
                    : 'text-zinc-500 hover:text-zinc-900'
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Node: Hardware Serial / Version Log */}
        {/* ⚡ Fix: Combined system details horizontally on mobile layouts to protect height */}
        <div className="flex flex-col items-end justify-center min-w-0 shrink-0 text-right">
          <div className="hidden xs:block rounded border border-zinc-300 bg-zinc-200 px-1.5 py-0.5 text-[7px] sm:text-[9px] font-mono font-bold text-zinc-500 shadow-inner leading-none">
            S/N: 8008-5110-MP
          </div>
          <p className="text-[7px] sm:text-[9px] font-black uppercase text-zinc-400 mt-1 leading-none">
            v3.0.4 // © 2026
          </p>
        </div>

      </div>

      {/* LOWER RED STRIP */}
      {/* ⚡ Fix: Lowered height to h-6 on small viewports to maintain total proportional height uniformity */}
      <div className="flex h-5 sm:h-7 w-full items-center justify-between bg-[#cc0000] px-4 sm:px-6 border-t-2 border-black/20 shrink-0">
        <div className="flex gap-2 sm:gap-4 items-center">
          <div className="h-1 sm:h-2 w-12 sm:w-16 rounded-full bg-black/20"></div>
          <div className="hidden sm:block h-2 w-8 rounded-full bg-black/10"></div>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-[7px] sm:text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">
             System Stable
           </span>
           <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#4dad5b] shadow-[0_0_6px_#4dad5b]"></div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;