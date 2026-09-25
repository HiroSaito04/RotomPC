// rotompc-client/src/components/rotom-ai/RotomAIChatModal.jsx

import { useEffect, useRef } from "react";

import { ROTOM_AI_ICON, ROTOM_AI_QUICK_PROMPTS } from "@/constants/rotomAI";

import RotomAIMessage from "./RotomAIMessage";

/* =========================================================
   MODAL
========================================================= */

const RotomAIChatModal = ({
  messages = [],

  input,

  setInput,

  sending = false,

  historyLoading = false,

  error,

  sendMessage,

  /*
   * New persistent-history function.
   */
  clearHistory,

  /*
   * Kept temporarily for backward compatibility
   * with your old RotomAI parent component.
   */
  clearConversation,

  onClose,
}) => {
  const scrollRef = useRef(null);

  const inputRef = useRef(null);

  /* =======================================================
     CLEAR HANDLER

     Prefer the new MongoDB-backed clearHistory().
     Fall back to the old clearConversation() while
     the parent component is being migrated.
  ======================================================= */

  const handleClearHistory = clearHistory || clearConversation || (() => {});

  const busy = sending || historyLoading;

  /* =======================================================
     BODY LOCK / ESC
  ======================================================= */

  useEffect(() => {
    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previous;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  /* =======================================================
     FOCUS

     Wait until MongoDB history has loaded before focusing
     the input.
  ======================================================= */

  useEffect(() => {
    if (historyLoading) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [historyLoading]);

  /* =======================================================
     AUTOSCROLL
  ======================================================= */

  useEffect(() => {
    if (historyLoading) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [messages, sending, historyLoading]);

  /* =======================================================
     CLEAR
  ======================================================= */

  const handleClear = async () => {
    if (busy) {
      return;
    }

    await handleClearHistory();
  };

  /* =======================================================
     SEND
  ======================================================= */

  const handleSend = () => {
    if (busy || !input.trim()) {
      return;
    }

    sendMessage();
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="rotom-ai-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="rotom-ai-modal-glow" aria-hidden="true" />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="RotomAI Pokémon assistant"
        className="rotom-ai-modal"
      >
        {/* ===============================================
            HEADER
        ================================================ */}

        <header className="rotom-ai-modal__header">
          <div className="rotom-ai-modal__identity">
            <div className="rotom-ai-modal__avatar">
              <img src={ROTOM_AI_ICON} alt="" />
            </div>

            <div className="rotom-ai-modal__identity-text">
              <div className="rotom-ai-modal__title-row">
                <h2>RotomAI</h2>

                <span className="rotom-ai-modal__online-dot" />
              </div>

              <p>Pokémon Intelligence Core</p>
            </div>
          </div>

          <div className="rotom-ai-modal__header-actions">
            <button
              type="button"
              onClick={handleClear}
              disabled={busy || messages.length === 0}
              className="rotom-ai-modal__clear"
            >
              {historyLoading ? "Syncing" : "Clear"}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close RotomAI"
              className="rotom-ai-modal__close"
            >
              ×
            </button>
          </div>
        </header>

        {/* ===============================================
            ROTOM SCREEN
        ================================================ */}

        <div className="rotom-ai-screen-shell">
          <div className="rotom-ai-screen">
            {/* ===========================================
                STATUS
            ============================================ */}

            <div className="rotom-ai-screen__status">
              <div>
                <span className="rotom-ai-screen__status-dot" />

                <span>
                  {historyLoading
                    ? "Syncing Memory"
                    : sending
                      ? "Researching"
                      : "Research Core Ready"}
                </span>
              </div>

              <span className="rotom-ai-screen__status-right">
                {historyLoading
                  ? "Trainer Memory Link"
                  : "Pokédex + Live Events"}
              </span>
            </div>

            {/* ===========================================
                MESSAGES
            ============================================ */}

            <div
              ref={scrollRef}
              className="
                rotom-ai-screen__messages
                rotom-grid
              "
            >
              {/* =========================================
                  HISTORY LOADING
              ========================================== */}

              {historyLoading && (
                <div
                  className="
                    flex
                    min-h-[240px]
                    flex-col
                    items-center
                    justify-center
                    gap-4
                    px-6
                    text-center
                  "
                >
                  <div
                    className="
                      relative

                      flex
                      h-16
                      w-16

                      items-center
                      justify-center
                    "
                  >
                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0

                        animate-ping

                        rounded-full

                        bg-yellow-300/25
                      "
                    />

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-1

                        animate-pulse

                        rounded-full

                        border-2
                        border-dashed
                        border-yellow-400
                      "
                    />

                    <img
                      src={ROTOM_AI_ICON}
                      alt=""
                      className="
                        relative
                        z-10

                        h-11
                        w-11

                        object-contain

                        drop-shadow-md
                      "
                    />
                  </div>

                  <div>
                    <p
                      className="
                        font-mono

                        text-[9px]
                        font-black
                        uppercase
                        tracking-[0.14em]

                        text-zinc-700
                      "
                    >
                      Syncing Rotom Memory...
                    </p>

                    <p
                      className="
                        mt-2

                        max-w-[260px]

                        text-xs
                        font-semibold
                        leading-5

                        text-zinc-500
                      "
                    >
                      Loading your saved Trainer conversation from the RotomPC
                      network.
                    </p>
                  </div>
                </div>
              )}

              {/* =========================================
                  SAVED MESSAGES
              ========================================== */}

              {!historyLoading &&
                messages.map((message) => (
                  <RotomAIMessage key={message.id} message={message} />
                ))}

              {/* =========================================
                  EMPTY STATE
              ========================================== */}

              {!historyLoading && messages.length === 0 && !sending && (
                <div
                  className="
                      flex
                      min-h-[220px]
                      flex-col
                      items-center
                      justify-center

                      px-6

                      text-center
                    "
                >
                  <div
                    className="
                        mb-4

                        flex
                        h-16
                        w-16

                        items-center
                        justify-center

                        rounded-2xl

                        border-2
                        border-zinc-950

                        bg-white

                        shadow-[3px_3px_0_#18181b]
                      "
                  >
                    <img
                      src={ROTOM_AI_ICON}
                      alt=""
                      className="
                          h-12
                          w-12

                          object-contain
                        "
                    />
                  </div>

                  <p
                    className="
                        font-display

                        text-lg
                        font-bold

                        text-zinc-950
                      "
                  >
                    Rotom Memory Ready!
                  </p>

                  <p
                    className="
                        mt-2

                        max-w-[290px]

                        text-xs
                        font-semibold
                        leading-5

                        text-zinc-500
                      "
                  >
                    Ask about Pokémon, games, Pokédex data, battle mechanics, or
                    current events.
                  </p>

                  <p
                    className="
                        mt-3

                        font-mono

                        text-[7px]
                        font-black
                        uppercase
                        tracking-[0.1em]

                        text-zinc-400
                      "
                  >
                    Conversations are saved to your Trainer account
                  </p>
                </div>
              )}

              {/* =========================================
                  THINKING
              ========================================== */}

              {sending && (
                <div className="rotom-ai-thinking">
                  <img src={ROTOM_AI_ICON} alt="" />

                  <div className="rotom-ai-thinking__dots">
                    <span />
                    <span />
                    <span />
                  </div>

                  <span className="rotom-ai-thinking__label">researching</span>
                </div>
              )}
            </div>

            {/* ===========================================
                QUICK PROMPTS

                Don't show while saved history is loading.
            ============================================ */}

            {!historyLoading && messages.length <= 2 && (
              <div className="rotom-ai-quick">
                <p className="rotom-ai-quick__label">Quick Scan</p>

                <div className="rotom-ai-quick__items">
                  {ROTOM_AI_QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={busy}
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===========================================
                ERROR
            ============================================ */}

            {error && <div className="rotom-ai-error">⚡ {error}</div>}

            {/* ===========================================
                INPUT
            ============================================ */}

            <div className="rotom-ai-composer">
              <div className="rotom-ai-composer__row">
                <div className="rotom-ai-composer__field">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    maxLength={4000}
                    value={input}
                    disabled={busy}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();

                        handleSend();
                      }
                    }}
                    placeholder={
                      historyLoading
                        ? "Syncing Rotom memory..."
                        : "Ask RotomAI about Pokémon..."
                    }
                  />

                  <div className="rotom-ai-composer__meta">
                    <span>
                      {historyLoading
                        ? "Restoring saved conversation..."
                        : "Enter to send · Shift+Enter for new line"}
                    </span>

                    <span>
                      {input.length}
                      /4000
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busy || !input.trim()}
                  onClick={handleSend}
                  className="rotom-ai-composer__send"
                  aria-label="Send message"
                >
                  {sending ? "…" : "⚡"}
                </button>
              </div>

              {/* =========================================
                  FOOTER
              ========================================== */}

              <div className="rotom-ai-composer__footer">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={busy || messages.length === 0}
                  className="rotom-ai-composer__mobile-clear"
                >
                  Clear Chat
                </button>

                <p>
                  Chat history is synced to your Trainer account. Verify
                  important competitive or time-sensitive details with official
                  sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RotomAIChatModal;
