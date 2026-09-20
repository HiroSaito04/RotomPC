// rotompc-client/src/components/auth/PasswordField.jsx

import { useState } from "react";

import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/constants/authUI";

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

      <div
        className="
          relative
        "
      >
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

            pr-20
          `}
        />

        {/* =================================================
            SHOW / HIDE
        ================================================== */}

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="
            absolute

            right-2
            top-[calc(50%+4px)]

            -translate-y-1/2

            rounded-lg

            border-2
            border-zinc-300

            bg-zinc-100

            px-2.5
            py-1.5

            font-mono

            text-[8px]
            font-black
            uppercase
            tracking-[0.08em]

            text-zinc-600

            transition

            hover:border-zinc-500
            hover:bg-zinc-200
            hover:text-zinc-950

            focus:outline-none
            focus:ring-2
            focus:ring-[#3b4cca]/30

            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;
