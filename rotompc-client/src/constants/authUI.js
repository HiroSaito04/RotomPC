// rotompc-client/src/constants/authUI.js

/* =========================================================
   SHARED AUTH FIELD

   Permanent visible outline:
   - strong zinc border
   - inner ring
   - white background
   - stronger focus state
========================================================= */

export const AUTH_INPUT_CLASS = `
  mt-2
  block
  min-h-12
  w-full

  rounded-xl

  border-2
  border-zinc-400

  bg-white

  px-4

  text-sm
  font-semibold
  text-zinc-950

  shadow-[inset_0_0_0_1px_rgba(24,24,27,0.04)]

  outline-none

  transition-all
  duration-150

  placeholder:text-zinc-400

  hover:border-zinc-500

  focus:border-[#3b4cca]
  focus:ring-[3px]
  focus:ring-[#3b4cca]/20

  disabled:cursor-not-allowed
  disabled:border-zinc-300
  disabled:bg-zinc-100
  disabled:text-zinc-500
`;

export const AUTH_LABEL_CLASS = `
  text-[11px]
  font-black
  uppercase
  tracking-[0.08em]

  text-zinc-700
`;

export const AUTH_ERROR_CLASS = `
  rounded-xl

  border-2
  border-red-400

  bg-red-50

  px-4
  py-3

  text-sm
  font-bold

  text-red-700

  shadow-[2px_2px_0_rgba(127,29,29,0.12)]
`;

export const AUTH_PRIMARY_BUTTON_CLASS = `
  min-h-12
  w-full

  rounded-xl

  border-[3px]
  border-zinc-950

  text-[11px]
  font-black
  uppercase
  tracking-[0.12em]

  shadow-[3px_3px_0_#18181b]
`;

export const AUTH_FOOTER_CLASS = `
  mt-8

  border-t-2
  border-zinc-200

  pt-6

  text-sm
  font-medium

  text-zinc-500
`;

export const AUTH_LINK_CLASS = `
  font-black

  text-zinc-950

  transition

  hover:text-[#cc0000]
`;
