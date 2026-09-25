// rotompc-client/src/hooks/useRotomAIChat.js

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearRotomAIHistory,
  getRotomAIHistory,
  sendRotomMessage,
} from "@/services/RotomAIService";

/* =========================================================
   HELPERS
========================================================= */

const createTemporaryMessage = (role, content) => ({
  id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,

  role,

  content,

  sources: [],

  grounded: false,

  warning: "",

  model: "",

  createdAt: new Date().toISOString(),

  temporary: true,
});

/* =========================================================
   HOOK
========================================================= */

const useRotomAIChat = () => {
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(true);

  const [error, setError] = useState("");

  const mountedRef = useRef(true);

  /* =====================================================
       LOAD HISTORY
    ===================================================== */

  const loadHistory = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessages([]);

      setHistoryLoading(false);

      return;
    }

    setHistoryLoading(true);

    setError("");

    try {
      const response = await getRotomAIHistory();

      if (!mountedRef.current) {
        return;
      }

      setMessages(
        Array.isArray(response.data?.messages) ? response.data.messages : [],
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setMessages([]);

        return;
      }

      console.error("RotomAI history error:", err);

      setError(
        err.response?.data?.message || "Unable to load RotomAI history.",
      );
    } finally {
      if (mountedRef.current) {
        setHistoryLoading(false);
      }
    }
  }, []);

  /* =====================================================
       INITIAL HISTORY
    ===================================================== */

  useEffect(() => {
    mountedRef.current = true;

    loadHistory();

    return () => {
      mountedRef.current = false;
    };
  }, [loadHistory]);

  /* =====================================================
       AUTH CHANGES
    ===================================================== */

  useEffect(() => {
    const handleAuthUpdate = () => {
      loadHistory();
    };

    window.addEventListener(
      "local-auth-update",

      handleAuthUpdate,
    );

    return () => {
      window.removeEventListener(
        "local-auth-update",

        handleAuthUpdate,
      );
    };
  }, [loadHistory]);

  /* =====================================================
       SEND
    ===================================================== */

  const sendMessage = useCallback(
    async (rawMessage) => {
      const message = String(rawMessage || "").trim();

      if (!message || loading) {
        return null;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Log in to use RotomAI and save your chat history.");

        return null;
      }

      setError("");

      setLoading(true);

      /*
       * Optimistic user message.
       */

      const temporaryUser = createTemporaryMessage(
        "user",

        message,
      );

      setMessages((current) => [...current, temporaryUser]);

      try {
        const response = await sendRotomMessage({
          message,
        });

        const {
          userMessage,

          assistantMessage,
        } = response.data;

        if (!mountedRef.current) {
          return response.data;
        }

        /*
         * Replace optimistic message with
         * the real MongoDB-backed messages.
         */

        setMessages((current) => {
          const withoutTemporary = current.filter(
            (entry) => entry.id !== temporaryUser.id,
          );

          return [...withoutTemporary, userMessage, assistantMessage].filter(
            Boolean,
          );
        });

        return response.data;
      } catch (err) {
        console.error("RotomAI chat error:", err);

        if (mountedRef.current) {
          setMessages((current) =>
            current.filter((entry) => entry.id !== temporaryUser.id),
          );

          setError(
            err.response?.data?.message ||
              err.message ||
              "RotomAI could not answer right now.",
          );
        }

        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [loading],
  );

  /* =====================================================
       CLEAR
    ===================================================== */

  const clearHistory = useCallback(async () => {
    if (loading) {
      return false;
    }

    setError("");

    try {
      await clearRotomAIHistory();

      if (mountedRef.current) {
        setMessages([]);
      }

      return true;
    } catch (err) {
      console.error("RotomAI clear history error:", err);

      if (mountedRef.current) {
        setError(
          err.response?.data?.message || "Unable to clear RotomAI history.",
        );
      }

      return false;
    }
  }, [loading]);

  /* =====================================================
       RETURN
    ===================================================== */

  return {
    messages,

    loading,

    historyLoading,

    error,

    setError,

    sendMessage,

    clearHistory,

    reloadHistory: loadHistory,
  };
};

export default useRotomAIChat;
