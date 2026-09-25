// rotompc-client/src/components/rotom-ai/RotomAI.jsx

import { useCallback, useState } from "react";

import "@/assets/styles/rotom-ai.css";

import useRotomAIChat from "@/hooks/useRotomAIChat";

import useRotomAILauncherCycle from "@/hooks/useRotomAILauncherCycle";

import RotomAILauncher from "./RotomAILauncher";

import RotomAIChatModal from "./RotomAIChatModal";

/* =========================================================
   ROTOM AI
========================================================= */

const RotomAI = ({ buddyVisible = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const [input, setInput] = useState("");

  /* =======================================================
     CHAT
  ======================================================= */

  const chat = useRotomAIChat();

  /* =======================================================
     LAUNCHER CYCLE

     ONE owner only.

     RotomAILauncher is now purely visual and does not
     create a second launcher cycle.
  ======================================================= */

  const launcher = useRotomAILauncherCycle({
    paused: isOpen,

    buddyVisible,
  });

  /* =======================================================
     OPEN
  ======================================================= */

  const openRotomAI = useCallback(() => {
    setIsOpen(true);
  }, []);

  /* =======================================================
     CLOSE
  ======================================================= */

  const closeRotomAI = useCallback(() => {
    setIsOpen(false);
  }, []);

  /* =======================================================
     SEND

     useRotomAIChat expects the actual message.
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
       * Restore unsent text if the request failed.
       */
      if (!result) {
        setInput(message);
      }
    },
    [chat, input],
  );

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
