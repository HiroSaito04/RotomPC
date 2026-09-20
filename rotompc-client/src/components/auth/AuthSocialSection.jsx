// rotompc-client/src/components/auth/AuthSocialSection.jsx

import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

const AuthSocialSection = ({
  mode,

  onAuthenticated,

  onError,
}) => {
  return (
    <>
      {/* ===================================================
          DIVIDER
      ==================================================== */}

      <div
        className="
          my-7

          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            h-px
            flex-1

            bg-zinc-200
          "
        />

        <span
          className="
            font-mono

            text-[8px]
            font-black
            uppercase
            tracking-[0.14em]

            text-zinc-400
          "
        >
          {mode === "signup" ? "social signup" : "social login"}
        </span>

        <div
          className="
            h-px
            flex-1

            bg-zinc-200
          "
        />
      </div>

      {/* ===================================================
          GOOGLE + FACEBOOK
      ==================================================== */}

      <SocialAuthButtons
        mode={mode}
        onAuthenticated={onAuthenticated}
        onError={onError}
      />
    </>
  );
};

export default AuthSocialSection;
