//rotompc-client\src\components\Button.jsx

import { Link, NavLink } from "react-router-dom";

const variantClasses = {
  primary:
    "bg-[#ffcb05] text-zinc-950 border-zinc-950 " +
    "shadow-[0_4px_0_#18181b] hover:bg-yellow-300 " +
    "hover:translate-y-[1px] hover:shadow-[0_3px_0_#18181b] " +
    "active:translate-y-[4px] active:shadow-none",

  secondary:
    "bg-white text-zinc-900 border-zinc-900 " +
    "shadow-[0_4px_0_#18181b] hover:bg-zinc-50 " +
    "hover:translate-y-[1px] hover:shadow-[0_3px_0_#18181b] " +
    "active:translate-y-[4px] active:shadow-none",

  danger:
    "bg-[#e31b23] text-white border-zinc-950 " +
    "shadow-[0_4px_0_#18181b] hover:bg-[#c9161d] " +
    "hover:translate-y-[1px] hover:shadow-[0_3px_0_#18181b] " +
    "active:translate-y-[4px] active:shadow-none",
};

const sizeClasses = {
  sm: "min-h-9 px-3 py-1.5 text-[10px] sm:min-h-10 sm:px-4 sm:text-[11px]",
  md: "min-h-11 px-5 py-2.5 text-xs sm:px-6 sm:text-[13px]",
  lg: "min-h-12 px-7 py-3 text-sm sm:min-h-14 sm:px-10 sm:text-base",
};

const Button = ({
  children,
  to,
  type = "button",
  variant = "secondary",
  size = "md",
  className = "",
  onClick,
  asNavLink = false,
  end = false,
  disabled = false,
}) => {
  const getClasses = (isActive = false) =>
    [
      "inline-flex items-center justify-center",
      "rounded-lg sm:rounded-xl border-2",
      "font-display font-bold uppercase",
      "tracking-[0.08em]",
      "transition-all duration-150",
      "select-none text-center",
      "focus-visible:outline-none",
      "focus-visible:ring-4 focus-visible:ring-[#3b4cca]/30",
      isActive
        ? variantClasses.primary
        : (variantClasses[variant] ?? variantClasses.secondary),
      sizeClasses[size] ?? sizeClasses.md,
      disabled ? "pointer-events-none opacity-50 shadow-none" : "",
      className,
    ]
      .join(" ")
      .trim();

  if (to && asNavLink) {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => getClasses(isActive)}
      >
        {children}
      </NavLink>
    );
  }

  if (to) {
    return (
      <Link to={to} className={getClasses()}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={getClasses()}
    >
      {children}
    </button>
  );
};

export default Button;
