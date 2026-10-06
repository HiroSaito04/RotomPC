// filepath: rotompc-client/src/components/profile/TrainerProfilePicture.jsx

import TrainerAvatar from "@/components/profile/TrainerAvatar";

const SIZE_MAP = {
  xs: "h-8 w-8",
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

const TrainerProfilePicture = ({
  userId,
  username = "",
  size = "md",
  className = "",
  fallbackClassName = "",
  roundedClassName = "rounded-xl",
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`
        relative
        shrink-0

        overflow-hidden

        ${sizeClass}
        ${roundedClassName}

        border-2
        border-zinc-950

        bg-gradient-to-b
        from-sky-100
        via-blue-100
        to-blue-200

        ${className}
      `}
    >
      <TrainerAvatar
        userId={userId}
        username={username}
        className="
          absolute
          inset-0

          h-full
          w-full

          overflow-hidden
        "
        imageClassName="
          !h-full
          !w-full

          !max-h-full
          !max-w-full

          !p-0

          origin-top

          scale-[2.15]

          object-contain
          object-top

          [image-rendering:pixelated]
        "
        fallbackClassName={`
          h-full
          w-full

          flex
          items-center
          justify-center

          bg-[#e63946]

          font-black
          uppercase

          text-white

          ${fallbackClassName}
        `}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-x-[18%]
          top-[7%]

          h-[13%]

          rounded-full

          bg-white/20

          blur-[1px]
        "
      />
    </div>
  );
};

export default TrainerProfilePicture;
