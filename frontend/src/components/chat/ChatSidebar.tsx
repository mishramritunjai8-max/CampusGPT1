"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Trash2,
  Pin,
  PinOff,
  Search,
  X,
  Check,
  Pencil,
} from "lucide-react";

interface Session {
  id: string;
  title: string;
  is_pinned: string;
  created_at: string;
}

interface ChatSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onSearch: (q: string) => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onTogglePin,
  onSearch,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    onSearch(q);
  };

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const submitRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const pinnedSessions = sessions.filter((s) => s.is_pinned === "true");
  const unpinnedSessions = sessions.filter((s) => s.is_pinned !== "true");

  return (
    <div className="h-full flex flex-col">
      <button
        onClick={onCreate}
        className="w-full flex items-center justify-center gap-2 p-3 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl text-xs font-semibold text-purple-400 transition-all mb-4"
      >
        <Plus className="h-4 w-4" /> New Chat
      </button>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search chats..."
          className="w-full bg-secondary/35 border border-border rounded-xl py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-600"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {pinnedSessions.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
              Pinned
            </p>
            {pinnedSessions.map((sess) => (
              <SessionItem
                key={sess.id}
                session={sess}
                isActive={activeSessionId === sess.id}
                isEditing={editingId === sess.id}
                editTitle={editTitle}
                onSelect={() => onSelect(sess.id)}
                onDelete={() => onDelete(sess.id)}
                onStartRename={() => startRename(sess.id, sess.title)}
                onRename={submitRename}
                onEditTitleChange={setEditTitle}
                onTogglePin={() => onTogglePin(sess.id)}
              />
            ))}
          </div>
        )}

        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
          Recent
        </p>
        {unpinnedSessions.map((sess) => (
          <SessionItem
            key={sess.id}
            session={sess}
            isActive={activeSessionId === sess.id}
            isEditing={editingId === sess.id}
            editTitle={editTitle}
            onSelect={() => onSelect(sess.id)}
            onDelete={() => onDelete(sess.id)}
            onStartRename={() => startRename(sess.id, sess.title)}
            onRename={submitRename}
            onEditTitleChange={setEditTitle}
            onTogglePin={() => onTogglePin(sess.id)}
          />
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onDelete,
  onStartRename,
  onRename,
  onEditTitleChange,
  onTogglePin,
}: {
  session: Session;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onRename: () => void;
  onEditTitleChange: (v: string) => void;
  onTogglePin: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between p-2.5 rounded-xl text-xs text-left cursor-pointer transition-all ${
        isActive
          ? "bg-purple-600 text-white font-bold"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
      }`}
    >
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRename();
          }}
          className="flex-1 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border border-purple-500 rounded px-1 py-0.5 text-xs text-foreground focus:outline-none"
            onBlur={onRename}
          />
          <button type="submit" className="p-0.5 text-purple-400">
            <Check className="h-3 w-3" />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2 truncate pr-2 flex-1">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{session.title}</span>
        </div>
      )}

      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="p-1 rounded hover:bg-black/25 transition-colors"
          >
            {session.is_pinned === "true" ? (
              <PinOff className="h-3 w-3 text-amber-400" />
            ) : (
              <Pin className="h-3 w-3 text-muted-foreground hover:text-amber-400" />
            )}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            className="p-1 rounded hover:bg-black/25 transition-colors"
          >
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-blue-400" />
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-black/25 transition-colors"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
          </span>
        </div>
      )}
    </div>
  );
}
