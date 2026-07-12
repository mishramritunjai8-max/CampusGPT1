"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";

interface ChatContextType {
  sessions: api.ChatSession[];
  activeSessionId: string | null;
  messages: api.Message[];
  isStreaming: boolean;
  streamingContent: string;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  citations: api.Citation[];
  useRag: boolean;
  setUseRag: (v: boolean) => void;
  setActiveSessionId: (id: string) => void;
  createSession: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  togglePinSession: (id: string) => Promise<void>;
  searchSessions: (q: string) => Promise<api.ChatSession[]>;
  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
  regenerate: () => Promise<void>;
  suggestions: string[];
  loadSuggestions: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [sessions, setSessions] = useState<api.ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<api.Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [citations, setCitations] = useState<api.Citation[]>([]);
  const [useRag, setUseRag] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setIsLoadingSessions(true);
    try {
      const data = await api.getSessions();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingSessions(false);
    }
  }, [token, activeSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadMessages = useCallback(async () => {
    if (!token || !activeSessionId) return;
    setIsLoadingMessages(true);
    try {
      const session = await api.getSession(activeSessionId);
      setMessages(session.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [token, activeSessionId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const createSessionFn = useCallback(async () => {
    if (!token) return;
    try {
      const sess = await api.createSession();
      setSessions((prev) => [sess, ...prev]);
      setActiveSessionId(sess.id);
      setMessages([]);
    } catch {
      const mockId = `session-${Date.now()}`;
      const mock: api.ChatSession = {
        id: mockId,
        title: "New Chat",
        is_pinned: "false",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSessions((prev) => [mock, ...prev]);
      setActiveSessionId(mockId);
      setMessages([]);
    }
  }, [token]);

  const deleteSessionFn = useCallback(async (id: string) => {
    try {
      await api.deleteSession(id);
    } catch { /* ignore */ }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  }, [activeSessionId, sessions]);

  const renameSessionFn = useCallback(async (id: string, title: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
    try { await api.updateSession(id, { title }); } catch { /* ignore */ }
  }, []);

  const togglePinSessionFn = useCallback(async (id: string) => {
    const s = sessions.find((s) => s.id === id);
    const newPin = s?.is_pinned === "true" ? "false" : "true";
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, is_pinned: newPin } : s)));
    try { await api.updateSession(id, { is_pinned: newPin }); } catch { /* ignore */ }
  }, [sessions]);

  const searchSessionsFn = useCallback(async (q: string): Promise<api.ChatSession[]> => {
    if (!q.trim()) { loadSessions(); return sessions; }
    try {
      const results = await api.searchSessions(q);
      setSessions(results);
      return results;
    } catch {
      return sessions.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));
    }
  }, [loadSessions, sessions]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: api.Message = {
        id: `msg-${Date.now()}`,
        sender: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent("");
      setCitations([]);
      setError(null);

      const historyPayload = messages.map((m) => ({
        role: m.sender,
        content: m.content,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      let sessionId = activeSessionId || "";
      let accumulated = "";

      if (useRag) {
        api.streamRagAsk(
          { message: text, session_id: sessionId || undefined, history: historyPayload, top_k: 5 },
          (token) => { accumulated += token; setStreamingContent(accumulated); },
          (sid, ragCitations) => {
            sessionId = sid;
            const assistantMsg: api.Message = {
              id: `msg-${Date.now()}-ai`,
              sender: "assistant",
              content: accumulated,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setCitations(ragCitations);
            setStreamingContent("");
            setIsStreaming(false);
            setActiveSessionId(sessionId);
            loadSessions();
          },
          (err) => { setError(err.message); setIsStreaming(false); setStreamingContent(""); },
          controller.signal
        );
      } else {
        api.streamAssistant(
          { message: text, session_id: sessionId || undefined, history: historyPayload },
          (token) => { accumulated += token; setStreamingContent(accumulated); },
          (sid) => {
            sessionId = sid;
            const assistantMsg: api.Message = {
              id: `msg-${Date.now()}-ai`,
              sender: "assistant",
              content: accumulated,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setStreamingContent("");
            setIsStreaming(false);
            setActiveSessionId(sessionId);
            loadSessions();
          },
          (err) => { setError(err.message); setIsStreaming(false); setStreamingContent(""); },
          controller.signal
        );
      }
    },
    [messages, activeSessionId, isStreaming, loadSessions, useRag]
  );

  const regenerate = useCallback(async () => {
    if (!activeSessionId || isStreaming) return;
    try {
      await api.regenerateResponse({ session_id: activeSessionId });
      const session = await api.getSession(activeSessionId);
      setMessages(session.messages || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, [activeSessionId, isStreaming]);

  const loadSuggestions = useCallback(async () => {
    try {
      const data = await api.getSuggestions();
      setSuggestions(data.suggestions);
    } catch { setSuggestions([]); }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        sessions, activeSessionId, messages, isStreaming, streamingContent,
        isLoadingSessions, isLoadingMessages, error, citations, useRag, setUseRag,
        setActiveSessionId, createSession: createSessionFn, deleteSession: deleteSessionFn,
        renameSession: renameSessionFn, togglePinSession: togglePinSessionFn,
        searchSessions: searchSessionsFn, sendMessage, stopStreaming, regenerate,
        suggestions, loadSuggestions,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}
