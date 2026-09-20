// rotompc-client/src/hooks/useRotomAIChat.js

import { useEffect, useMemo, useState } from "react";

import * as rotomAIService from "@/services/RotomAIService";

import { ROTOM_AI_SESSION_KEY } from "@/constants/rotomAI";

import {
  createRotomGreeting,
  createRotomMessageId,
  readRotomMessages,
  storeRotomMessages,
} from "@/utils/rotomAI";

/* =========================================================
   CHAT HOOK
========================================================= */

const useRotomAIChat = () => {
  const [messages, setMessages] = useState(readRotomMessages);

  const [input, setInput] = useState("");

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
       STORAGE
    ===================================================== */

  useEffect(() => {
    storeRotomMessages(messages);
  }, [messages]);

  /* =====================================================
       API HISTORY
    ===================================================== */

  const apiHistory = useMemo(
    () =>
      messages
        .filter(
          (message) =>
            !message.local &&
            (message.role === "user" || message.role === "assistant"),
        )
        .slice(-10)
        .map((message) => ({
          role: message.role,

          content: message.content,
        })),
    [messages],
  );

  /* =====================================================
       SEND
    ===================================================== */

  const sendMessage = async (textOverride = null) => {
    const text = String(textOverride ?? input).trim();

    if (!text || sending) {
      return;
    }

    if (text.length > 4000) {
      setError("Keep each message under 4,000 characters.");

      return;
    }

    const userMessage = {
      id: createRotomMessageId(),

      role: "user",

      content: text,

      local: false,
    };

    setMessages((current) => [...current, userMessage]);

    setInput("");

    setError("");

    setSending(true);

    try {
      const response = await rotomAIService.sendRotomMessage({
        message: text,

        history: apiHistory,
      });

      const data = response.data || {};

      const assistantMessage = {
        id: createRotomMessageId(),

        role: "assistant",

        local: false,

        content: data.answer || "Bzzzt... I couldn't form a response.",

        sources: Array.isArray(data.sources) ? data.sources : [],

        pokemonData: Array.isArray(data.pokemonData) ? data.pokemonData : [],

        model: data.model || null,

        grounded: Boolean(data.grounded),
      };

      setMessages((current) => [...current, assistantMessage]);

      if (data.warning) {
        setError(data.warning);
      }
    } catch (requestError) {
      console.error("RotomAI error:", requestError);

      const requestMessage =
        requestError.response?.data?.message ||
        requestError.message ||
        "RotomAI connection failed.";

      setError(requestMessage);

      setMessages((current) => [
        ...current,

        {
          id: createRotomMessageId(),

          role: "assistant",

          local: false,

          content:
            "Bzzzt—signal interrupted! I couldn't reach my research core. Try again in a moment.",

          sources: [],

          pokemonData: [],

          model: null,

          grounded: false,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  /* =====================================================
       CLEAR
    ===================================================== */

  const clearConversation = () => {
    setMessages([createRotomGreeting()]);

    setInput("");

    setError("");

    sessionStorage.removeItem(ROTOM_AI_SESSION_KEY);
  };

  return {
    messages,

    input,
    setInput,

    sending,

    error,

    sendMessage,

    clearConversation,
  };
};

export default useRotomAIChat;
