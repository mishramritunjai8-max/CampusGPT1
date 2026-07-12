"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";
import { Bot, User, Clipboard, Check, RotateCcw, BookOpen, ExternalLink } from "lucide-react";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";

interface Citation {
  document_id: string;
  document_name: string;
  page_number: number;
  chunk_text: string;
  relevance_score: number;
}

interface ChatMessageProps {
  message: {
    id: string;
    sender: "user" | "assistant";
    content: string;
    created_at: string;
  };
  citations?: Citation[];
  onRegenerate?: () => void;
  isLast?: boolean;
}

export default function ChatMessage({ message, citations, onRegenerate, isLast }: ChatMessageProps) {
  const isUser = message.sender === "user";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCitations, setShowCitations] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center shrink-0 mt-1">
          <Bot className="h-4 w-4 text-purple-400" />
        </div>
      )}

      <div className={`relative group max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-purple-600 text-white shadow shadow-purple-600/15 rounded-tr-none"
              : "bg-secondary/35 border border-border/80 text-foreground rounded-tl-none"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-code:text-purple-300">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeStr = String(children).replace(/\n$/, "");
                    if (match) {
                      return (
                        <div className="my-3 rounded-lg border border-border bg-[#1e1e1e] overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-border">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                              {match[1]}
                            </span>
                            <button
                              onClick={() => copyToClipboard(codeStr, `code-${message.id}`)}
                              className="text-muted-foreground hover:text-white transition-colors"
                            >
                              {copiedId === `code-${message.id}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Clipboard className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px" }}
                          >
                            {codeStr}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    return (
                      <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-purple-300 text-xs" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Citations */}
              {citations && citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <button
                    onClick={() => setShowCitations(!showCitations)}
                    className="flex items-center gap-1.5 text-[10px] text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                  >
                    <BookOpen className="h-3 w-3" />
                    {citations.length} source{citations.length > 1 ? "s" : ""} cited
                    <ExternalLink className={`h-2.5 w-2.5 transition-transform ${showCitations ? "rotate-180" : ""}`} />
                  </button>
                  {showCitations && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 space-y-1.5"
                    >
                      {citations.map((cit, idx) => (
                        <div
                          key={idx}
                          className="text-[10px] bg-secondary/30 rounded-lg p-2 border border-border/50"
                        >
                          <span className="font-bold text-purple-400">
                            [{idx + 1}] {cit.document_name}
                          </span>
                          {cit.page_number > 0 && (
                            <span className="text-muted-foreground"> &middot; Page {cit.page_number}</span>
                          )}
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 italic">
                            &ldquo;{cit.chunk_text}&rdquo;
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {!isUser && isLast && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-all p-1"
              title="Regenerate"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 mt-1">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
