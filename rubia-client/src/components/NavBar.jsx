// rubia-client/src/components/NavBar.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Button from "./Button";

const links = [
  { label: 'PokeDex', to: '/' },
  { label: 'Trainer ID', to: '/about' },
  { label: 'PokeSocial', to: '/articles' },
];

const NavBar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('local-auth-update', handleAuthChange);
    return () => {
      window.removeEventListener('local-auth-update', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    // Clear authorization parameters safely from localized key registry
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('role');
    localStorage.removeItem('firstName');
    localStorage.removeItem('user');

    // Announce authentication status sync state modifications locally
    window.dispatchEvent(new Event('local-auth-update'));
    
    // Redirect cleanly to the application Landing HomePage
    navigate('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-[6px] border-zinc-900 bg-[#f3f4f6]">
      {/* Upper Hardware Strip */}
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
      <div className="relative mx-auto flex h-14 sm:h-20 max-w-7xl flex-row items-center justify-between gap-1 overflow-hidden px-1.5 py-1 sm:p-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <NavLink to="/" className="flex shrink-0 items-center gap-1 sm:gap-3 group">
          <div className="relative flex h-6 w-6 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 sm:border-4 border-zinc-900 bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] group-hover:rotate-12 transition-transform">
            <div className="h-3.5 w-3.5 sm:h-8 sm:w-8 rounded-full border border-blue-300 bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center overflow-hidden">
              <div className="absolute top-0.5 left-1 h-1.5 w-1.5 sm:h-4 sm:w-4 rounded-full bg-white/30 blur-[1px]"></div>
              <div className="h-full w-1 bg-white/10 rotate-45"></div>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="inline text-[4.5px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-[0.12em] sm:tracking-[0.3em] leading-none whitespace-nowrap">
              SYSTEM FEED //
            </span>
            <p className="text-[9px] sm:text-xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none whitespace-nowrap">
              ROTOM<span className="text-[#ff1c1c]">PC</span>
            </p>
          </div>
        </NavLink>

        {/* Navigation */}
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-[2px] rounded-md border border-zinc-900/5 bg-zinc-200/50 p-[2px] shadow-inner sm:flex-none sm:gap-0.5 sm:rounded-xl sm:p-0.5">
          {links.map((link) => (
            <Button
              key={link.to}
              to={link.to}
              asNavLink={true}
              end={link.to === '/'}
              variant="secondary"
              size="sm"
              className="relative h-5 min-w-0 flex-1 overflow-hidden whitespace-nowrap px-0.5 py-0 text-center text-[5.5px] leading-none tracking-tighter sm:h-9 sm:flex-none sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.15em]"
            >
              {link.label}
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(255,255,255,0.5)_50%)] bg-[length:100%_2px]"></div>
            </Button>
          ))}
        </nav>

        {/* Auth Action Handlers */}
        {isAuthenticated ? (
          <Button
            type="button"
            onClick={handleLogout}
            variant="secondary"
            size="sm"
            className="h-5 shrink-0 px-1 py-0 text-[6px] leading-none tracking-tight border-[#ff1c1c]/40 text-[#ff1c1c] hover:bg-red-50 sm:h-9 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.15em]"
          >
            <span className="flex items-center gap-0.5 sm:gap-2">
              <div className="h-1 w-1 sm:h-2 sm:w-2 rounded-full bg-zinc-400 animate-pulse"></div>
              Log Out
            </span>
          </Button>
        ) : (
          <Button
            to="/auth/signin"
            asNavLink={true}
            variant="secondary"
            size="sm"
            className="h-5 shrink-0 px-1 py-0 text-[6px] leading-none tracking-tight sm:h-9 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.15em]"
          >
            <span className="flex items-center gap-0.5 sm:gap-2">
              <div className="h-1 w-1 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse"></div>
              Log In
            </span>
          </Button>
        )}

      </div>
    </header>
  );
};

export default NavBar;