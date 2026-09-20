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

  /* =======================================================
     CHAT
  ======================================================= */

  const chat = useRotomAIChat();

  /* =======================================================
     LAUNCHER CYCLE
  ======================================================= */

  const launcher = useRotomAILauncherCycle({
    isOpen,
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
     UI
  ======================================================= */

  return (
    <>
      {/* ===================================================
          FLOATING / DOCKED ROTOM
      ==================================================== */}

      {!isOpen && (
        <RotomAILauncher
          phase={launcher.phase}
          position={launcher.position}
          teleporting={launcher.teleporting}
          teleportKey={launcher.teleportKey}
          bubbleText={launcher.bubbleText}
          buddyVisible={buddyVisible}
          onOpen={openRotomAI}
        />
      )}

      {/* ===================================================
          CHAT MODAL
      ==================================================== */}

      {isOpen && (
        <RotomAIChatModal
          messages={chat.messages}
          input={chat.input}
          setInput={chat.setInput}
          sending={chat.sending}
          error={chat.error}
          sendMessage={chat.sendMessage}
          clearConversation={chat.clearConversation}
          onClose={closeRotomAI}
        />
      )}
    </>
  );
};

export default RotomAI;
