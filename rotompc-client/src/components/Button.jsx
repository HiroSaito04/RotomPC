import { Link, NavLink } from 'react-router-dom';

const variantClasses = {
  primary: 'bg-[#ffcb05] text-[#3b4cca] border-[#3b4cca] shadow-[0px_4px_0px_0px_rgba(59,76,202,1)] hover:translate-y-[2px] hover:shadow-[0px_2px_0px_0px_rgba(59,76,202,1)] active:translate-y-[4px] active:shadow-none',
  secondary: 'bg-white text-zinc-900 border-zinc-900 shadow-[0px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[2px] hover:shadow-[0px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-[4px] active:shadow-none',
  danger: 'bg-[#ff1c1c] text-white border-zinc-900 shadow-[0px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[2px] hover:shadow-[0px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-[4px] active:shadow-none',
};

const sizeClasses = {
  sm: 'px-4 py-1.5 text-[10px]',
  md: 'px-6 py-2 text-[11px]',
  lg: 'px-10 py-3.5 text-base sm:text-lg border-4 shadow-[0px_6px_0px_0px]', 
};

const Button = ({
  children,
  to,
  type = 'button',
  variant = 'secondary',
  size = 'md', 
  className = '',
  onClick,
  asNavLink = false,
  end = false // ⚡ Added 'end' prop safely so index matches like PokeDex work cleanly
}) => {
  // Calculates combined variant and system size tokens
  const getCombinedClasses = (isActive) => [
    'inline-flex items-center justify-center rounded-xl border-2 font-black uppercase tracking-[0.15em] italic transition-all duration-75 select-none text-center',
    isActive ? variantClasses.primary : (variantClasses[variant] ?? variantClasses.secondary),
    sizeClasses[size] ?? sizeClasses.md,
    className,
  ]
  .join(' ')
  .trim();

  // ⚡ Define a base 'classes' variable for the standard button and link tags below
  const classes = getCombinedClasses(false);

  if (to) {
    if (asNavLink) {
      return (
        <NavLink 
          to={to} 
          end={end} // Passes down the structural index exact rule
          className={({ isActive }) => getCombinedClasses(isActive)}
        >
          {children}
        </NavLink>
      );
    }
    
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  // ⚡ Dead duplicate code safely removed from here

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
};

export default Button;