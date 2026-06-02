import { NavLink } from 'react-router-dom';
import Button from "../components/Button";

const links = [
  { label: 'PokeDex', to: '/' },
  { label: 'Trainer ID', to: '/about' },
  { label: 'PokeSocial', to: '/articles' },
];

const NavBar = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-[6px] border-zinc-900 bg-[#f3f4f6]">
      {/* Upper Hardware Strip: The "Status LEDs" */}
      <div className="flex h-6 w-full items-center gap-3 bg-[#cc0000] px-4 sm:px-6 border-b-2 border-black/20">
        <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse"></div>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#ff1c1c] border border-black/20"></div>
          <div className="h-2 w-2 rounded-full bg-[#ffcb05] border border-black/20"></div>
          <div className="h-2 w-2 rounded-full bg-[#4dad5b] border border-black/20"></div>
        </div>
        <div className="ml-auto flex gap-4">
          <div className="h-1 w-12 rounded-full bg-black/20"></div>
        </div>
      </div>

      {/* Main Container */}
      {/* ⚡ Fix: Changed flex-col to a forced flex-row that never wraps or stretches height vertically */}
      <div className="relative mx-auto flex flex-row items-center justify-between gap-1.5 xs:gap-2 sm:gap-4 p-3 sm:p-4 sm:px-6 lg:px-8 max-w-7xl h-16 sm:h-20 overflow-hidden"> 
        
        {/* Logo Component Unit */}
        <NavLink to="/" className="flex items-center gap-1.5 sm:gap-3 group shrink-0">
          {/* ⚡ Fix: Microscaled structural lens sizes for small viewports */}
          <div className="relative flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 sm:border-4 border-zinc-900 bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] group-hover:rotate-12 transition-transform">
            <div className="h-5 w-5 sm:h-8 sm:w-8 rounded-full border border-blue-300 bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center overflow-hidden">
                <div className="absolute top-0.5 left-1 h-2 w-2 sm:h-4 sm:w-4 rounded-full bg-white/30 blur-[1px]"></div>
                <div className="h-full w-1 bg-white/10 rotate-45"></div>
            </div>
          </div>
          {/* ⚡ Fix: Hidden system feed helper tag on mobile to save critical horizontal layout pathing */}
          <div className="flex flex-col">
            <span className="hidden sm:inline text-[7px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-none">
              SYSTEM FEED //
            </span>
            <p className="text-sm sm:text-xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
              ROTOM<span className="text-[#ff1c1c]">PC</span>
            </p>
          </div>
        </NavLink>

        {/* Navigation Interface Selection Module */}
        {/* ⚡ Fix: Added shrink layout safety controllers and minimized padding blocks */}
        <nav className="flex items-center justify-center gap-0.5 sm:gap-2 bg-zinc-200/50 p-0.5 sm:p-1 rounded-xl border-2 border-zinc-900/5 shadow-inner shrink min-w-0">
          {links.map((link) => (
            <Button
              key={link.to}
              to={link.to}
              asNavLink={true}
              end={link.to === '/'}
              variant="secondary"
              size="sm"
              /* ⚡ Fix: Highly compressed micro-paddings and letter tracking on mobile devices */
              className="relative overflow-hidden flex-none text-center px-1.5 py-1 sm:px-4 sm:py-2 text-[8px] sm:text-[10px] tracking-tight sm:tracking-[0.15em] h-7 sm:h-9"
            >
              {link.label}
              
              {/* Scanline overlay for active link */}
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(255,255,255,0.5)_50%)] bg-[length:100%_2px]"></div>
            </Button>
          ))}
        </nav>

        {/* Log In Action Trigger Button */}
        {/* ⚡ Fix: Squeezed text and sizing metrics dynamically to fit cleanly on the single layout row */}
        <Button
          to="/auth/signin"
          asNavLink={true}
          variant="secondary"
          size="sm"
          className="shrink-0 px-2 py-1 sm:px-4 sm:py-2 text-[8px] sm:text-[10px] h-7 sm:h-9 tracking-tight sm:tracking-[0.15em]"
        >
          <span className="flex items-center gap-1 sm:gap-2">
            <div className="h-1 w-1 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse"></div>
            Log In
          </span>
        </Button>
        
      </div>
    </header>
  );
};

export default NavBar;