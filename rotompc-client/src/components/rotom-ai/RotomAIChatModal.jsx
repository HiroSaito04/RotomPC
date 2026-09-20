// rotompc-client/src/components/rotom-ai/RotomAIChatModal.jsx

import { useEffect, useRef } from "react";

import { ROTOM_AI_ICON, ROTOM_AI_QUICK_PROMPTS } from "@/constants/rotomAI";

import RotomAIMessage from "./RotomAIMessage";

/* =========================================================
   MODAL
========================================================= */

const RotomAIChatModal = ({
  messages,

  input,

  setInput,

  sending,

  error,

  sendMessage,

  clearConversation,

  onClose,
}) => {
  const scrollRef = useRef(null);

  const inputRef = useRef(null);

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
  ======================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 220);

    return () => window.clearTimeout(timer);
  }, []);

  /* =======================================================
     AUTOSCROLL
  ======================================================= */

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [messages, sending]);

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
              onClick={clearConversation}
              className="rotom-ai-modal__clear"
            >
              Clear
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
            {/* STATUS */}

            <div className="rotom-ai-screen__status">
              <div>
                <span className="rotom-ai-screen__status-dot" />

                <span>Research Core Ready</span>
              </div>

              <span className="rotom-ai-screen__status-right">
                Pokédex + Live Events
              </span>
            </div>

            {/* ===========================================
                MESSAGES
            ============================================ */}

            <div
              ref={scrollRef}
              className="rotom-ai-screen__messages rotom-grid"
            >
              {messages.map((message) => (
                <RotomAIMessage key={message.id} message={message} />
              ))}

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
            ============================================ */}

            {messages.length <= 2 && (
              <div className="rotom-ai-quick">
                <p className="rotom-ai-quick__label">Quick Scan</p>

                <div className="rotom-ai-quick__items">
                  {ROTOM_AI_QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={sending}
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
                    disabled={sending}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();

                        sendMessage();
                      }
                    }}
                    placeholder="Ask RotomAI about Pokémon..."
                  />

                  <div className="rotom-ai-composer__meta">
                    <span>Enter to send · Shift+Enter for new line</span>

                    <span>
                      {input.length}
                      /4000
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={sending || !input.trim()}
                  onClick={() => sendMessage()}
                  className="rotom-ai-composer__send"
                  aria-label="Send message"
                >
                  ⚡
                </button>
              </div>

              <div className="rotom-ai-composer__footer">
                <button
                  type="button"
                  onClick={clearConversation}
                  className="rotom-ai-composer__mobile-clear"
                >
                  Clear Chat
                </button>

                <p>
                  Verify important competitive or time-sensitive details with
                  official sources.
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
