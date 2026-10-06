// filepath: rotompc-client/src/components/auth/PasswordField.jsx

import { useState } from "react";

import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/constants/authUI";

/* =========================================================
   ICONS
========================================================= */

const EyeIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
};

const EyeOffIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M3 3l18 18" />

      <path d="M10.6 6.15A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.7 15.7 0 0 1-2.06 2.76" />

      <path d="M6.1 6.1C3.83 7.55 2.5 12 2.5 12s3.5 6 9.5 6a9.9 9.9 0 0 0 3.05-.47" />

      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
    </svg>
  );
};

/* =========================================================
   PASSWORD FIELD
========================================================= */

const PasswordField = ({
  id,

  label,

  value,

  onChange,

  placeholder = "",

  autoComplete,

  required = false,

  minLength,

  maxLength,

  pattern,

  title,

  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {/* ===================================================
          LABEL
      ==================================================== */}

      <label htmlFor={id} className={AUTH_LABEL_CLASS}>
        {label}
      </label>

      {/* ===================================================
          FIELD
      ==================================================== */}

      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          title={title}
          disabled={disabled}
          className={`
            ${AUTH_INPUT_CLASS}

            pr-12
          `}
        />

        {/* =================================================
            PASSWORD VISIBILITY
        ================================================== */}

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
          className="
            absolute
            right-2
            top-1/2

            flex
            h-9
            w-9

            -translate-y-1/2

            items-center
            justify-center

            rounded-lg

            border-0

            bg-transparent

            p-0

            text-zinc-400

            outline-none

            transition-all
            duration-150

            hover:bg-zinc-100
            hover:text-zinc-950

            focus-visible:bg-zinc-100
            focus-visible:text-zinc-950
            focus-visible:ring-2
            focus-visible:ring-[#3b4cca]/30

            active:scale-95

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;
