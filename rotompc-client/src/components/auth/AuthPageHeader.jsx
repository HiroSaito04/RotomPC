// rotompc-client/src/components/auth/AuthPageHeader.jsx

const AuthPageHeader = ({ eyebrow = "Trainer Access", title, description }) => {
  return (
    <div className="hidden lg:block">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#ff1c1c]" />

        <p
          className="
            font-mono
            text-[9px]
            font-black
            uppercase
            tracking-[0.16em]
            text-zinc-400
          "
        >
          {eyebrow}
        </p>
      </div>

      <h1
        className="
          font-display
          text-4xl
          font-bold
          tracking-tight
          text-zinc-950
        "
      >
        {title}
      </h1>

      {description && (
        <p
          className="
            mt-3
            max-w-lg
            text-sm
            font-medium
            leading-6
            text-zinc-500
          "
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default AuthPageHeader;
