// filepath: rotompc-client/src/components/rotom-ai/RotomAI.jsx

import { useCallback, useState } from "react";

import "@/assets/styles/rotom-ai.css";

import { useAppBoot } from "@/context/AppBootContext";

import useRotomAIChat from "@/hooks/useRotomAIChat";

import useRotomAILauncherCycle from "@/hooks/useRotomAILauncherCycle";

import RotomAILauncher from "./RotomAILauncher";

import RotomAIChatModal from "./RotomAIChatModal";

/* =========================================================
   ROTOM AI
========================================================= */

const RotomAI = ({ buddyVisible = false }) => {
  const { appReady } = useAppBoot();

  const [isOpen, setIsOpen] = useState(false);

  const [input, setInput] = useState("");

  /* =======================================================
     CHAT
  ======================================================= */

  const chat = useRotomAIChat();

  /* =======================================================
     LAUNCHER CYCLE

     Only this component owns the launcher cycle.

     appReady comes from App.jsx through AppBootContext.

     While splash is active:
     appReady = false

     After splash finishes:
     appReady = true
  ======================================================= */

  const launcher = useRotomAILauncherCycle({
    paused: isOpen,

    appReady,

    buddyVisible,
  });

  /* =======================================================
     OPEN
  ======================================================= */

  const openRotomAI = useCallback(() => {
    if (!appReady) {
      return;
    }

    setIsOpen(true);
  }, [appReady]);

  /* =======================================================
     CLOSE
  ======================================================= */

  const closeRotomAI = useCallback(() => {
    setIsOpen(false);
  }, []);

  /* =======================================================
     SEND
  ======================================================= */

  const handleSendMessage = useCallback(
    async (quickPrompt) => {
      const message = String(quickPrompt || input).trim();

      if (!message || chat.loading || chat.historyLoading) {
        return;
      }

      setInput("");

      const result = await chat.sendMessage(message);

      /*
       * Restore the message if sending failed.
       */

      if (!result) {
        setInput(message);
      }
    },
    [chat, input],
  );

  /* =======================================================
     APP NOT READY

     Do not render Rotom while the splash is active.

     The hook also receives appReady=false, so its timers
     remain blocked.
  ======================================================= */

  if (!appReady) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/* =================================================
          ROTOM LAUNCHER
      ================================================== */}

      {!isOpen && (
        <RotomAILauncher
          phase={launcher.phase}
          position={launcher.position}
          teleportKey={launcher.teleportKey}
          bubbleText={launcher.bubble}
          buddyVisible={buddyVisible}
          onOpen={openRotomAI}
        />
      )}

      {/* =================================================
          CHAT MODAL
      ================================================== */}

      {isOpen && (
        <RotomAIChatModal
          messages={chat.messages}
          input={input}
          setInput={setInput}
          sending={chat.loading}
          historyLoading={chat.historyLoading}
          error={chat.error}
          sendMessage={handleSendMessage}
          clearHistory={chat.clearHistory}
          onClose={closeRotomAI}
        />
      )}
    </>
  );
};

export default RotomAI;
