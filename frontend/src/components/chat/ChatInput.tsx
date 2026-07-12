"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 bg-secondary/35 border border-border rounded-2xl p-2 focus-within:ring-1 focus-within:ring-purple-600 focus-within:border-transparent transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask CampusGPT anything..."
          rows={1}
          disabled={isStreaming || disabled}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[200px] disabled:opacity-50"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-xl bg-red-600 hover:bg-red-500 p-2.5 text-white transition-all shrink-0 flex items-center justify-center"
            title="Stop generating"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="rounded-xl bg-purple-600 hover:bg-purple-500 p-2.5 text-white transition-all disabled:opacity-50 shrink-0 flex items-center justify-center"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-2">
        CampusGPT may produce inaccurate information. Verify important facts.
      </p>
    </form>
  );
}
