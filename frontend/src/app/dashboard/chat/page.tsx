"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import SuggestionChips from "@/components/chat/SuggestionChips";
import { motion } from "framer-motion";
import { Bot, PanelLeftClose, PanelLeft, BookOpenCheck, BookOpen, FileText } from "lucide-react";
import Link from "next/link";

export default function ChatAssistantPage() {
  const { user } = useAuth();
  const {
    sessions,
    activeSessionId,
    messages,
    isStreaming,
    streamingContent,
    isLoadingMessages,
    error,
    citations,
    useRag,
    setUseRag,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
    togglePinSession,
    searchSessions,
    sendMessage,
    stopStreaming,
    regenerate,
    suggestions,
    loadSuggestions,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isStreaming]);

  const displayMessages = isStreaming
    ? [
        ...messages,
        {
          id: "streaming-msg",
          sender: "assistant" as const,
          content: streamingContent,
          created_at: new Date().toISOString(),
        },
      ]
    : messages;

  const lastAssistantMessage =
    messages.length > 0
      ? [...messages].reverse().find((m) => m.sender === "assistant")
      : null;

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-6 relative overflow-hidden">
      <motion.div
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className={`overflow-hidden shrink-0 ${sidebarOpen ? "min-w-[240px]" : "min-w-0"}`}
      >
        <div className="glass-panel border border-border rounded-2xl h-full p-4 overflow-hidden">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={setActiveSessionId}
            onCreate={createSession}
            onDelete={deleteSession}
            onRename={renameSession}
            onTogglePin={togglePinSession}
            onSearch={searchSessions}
          />
        </div>
      </motion.div>

      <div className="flex-1 glass-panel border border-border rounded-2xl flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border bg-card/25 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <span className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
              {user.role}
            </span>
            <span className="text-xs font-bold text-foreground truncate max-w-xs">
              {sessions.find((s) => s.id === activeSessionId)?.title || "AI Chat"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseRag(!useRag)}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-xl font-semibold transition-all border ${
                useRag
                  ? "bg-purple-600/15 text-purple-400 border-purple-500/30"
                  : "bg-secondary/35 text-muted-foreground border-border hover:text-foreground"
              }`}
              title={useRag ? "Answer from uploaded documents" : "General chat mode"}
            >
              {useRag ? <BookOpenCheck className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
              {useRag ? "RAG On" : "RAG Off"}
            </button>

            <Link
              href="/dashboard/documents"
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-xl font-semibold bg-secondary/35 text-muted-foreground hover:text-foreground border border-border transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              Documents
            </Link>

            {error && (
              <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">{error}</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {displayMessages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-purple-600/10 border border-purple-500/25 flex items-center justify-center">
                  <Bot className="h-7 w-7 text-purple-400" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-base font-bold text-foreground">
                    {useRag ? "Ask about your documents" : "How can I help you today?"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {useRag
                      ? "RAG mode is active. Ask questions about your uploaded documents. Answers are based only on your files."
                      : "Ask me questions about your courses, get help with assignments, draft study plans, or explore campus resources."}
                  </p>
                </div>
                {useRag ? (
                  <Link
                    href="/dashboard/documents"
                    className="text-[10px] px-3 py-1.5 bg-purple-600/10 border border-purple-500/25 hover:bg-purple-600/20 rounded-xl text-purple-400 transition-all flex items-center gap-1.5"
                  >
                    <FileText className="h-3 w-3" />
                    Upload documents to get started
                  </Link>
                ) : (
                  <SuggestionChips suggestions={suggestions} onSelect={(text) => sendMessage(text)} />
                )}
              </div>
            ) : (
              <>
                {displayMessages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    citations={
                      idx === displayMessages.length - 1 && msg.sender === "assistant" ? citations : undefined
                    }
                    isLast={idx === displayMessages.length - 1 && msg.sender === "assistant" && !isStreaming}
                    onRegenerate={
                      idx === displayMessages.length - 1 &&
                      msg.sender === "assistant" &&
                      !isStreaming &&
                      lastAssistantMessage?.id === msg.id
                        ? regenerate
                        : undefined
                    }
                  />
                ))}

                {isStreaming && !streamingContent && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
                    <div className="h-8 w-8 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-secondary/35 border border-border/80 rounded-2xl rounded-tl-none p-4 flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border bg-card/10 shrink-0">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={sendMessage}
              onStop={stopStreaming}
              isStreaming={isStreaming}
              disabled={isLoadingMessages}
            />
            {useRag && (
              <p className="text-[10px] text-purple-400/70 text-center mt-1">
                RAG mode active &mdash; answers drawn from your uploaded documents only
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
