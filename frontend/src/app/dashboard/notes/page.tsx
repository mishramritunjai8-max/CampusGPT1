"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BookOpen,
  RotateCcw,
  HelpCircle,
  Layers,
  GitBranch,
  Sigma,
  Zap,
  FolderTree,
  Sparkles,
  Download,
  Search,
  Trash2,
  Clock,
  ChevronLeft,
  Loader2,
  Check,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import * as api from "@/lib/api";

const NOTE_TYPE_ICONS: Record<string, React.ReactNode> = {
  short: <FileText className="h-5 w-5" />,
  detailed: <BookOpen className="h-5 w-5" />,
  revision: <RotateCcw className="h-5 w-5" />,
  questions: <HelpCircle className="h-5 w-5" />,
  flashcards: <Layers className="h-5 w-5" />,
  mindmap: <GitBranch className="h-5 w-5" />,
  formula: <Sigma className="h-5 w-5" />,
  cheat: <Zap className="h-5 w-5" />,
  "topic-wise": <FolderTree className="h-5 w-5" />,
};

const NOTE_TYPE_COLORS: Record<string, string> = {
  short: "from-blue-500 to-blue-600",
  detailed: "from-indigo-500 to-indigo-600",
  revision: "from-green-500 to-green-600",
  questions: "from-amber-500 to-amber-600",
  flashcards: "from-purple-500 to-purple-600",
  mindmap: "from-rose-500 to-rose-600",
  formula: "from-cyan-500 to-cyan-600",
  cheat: "from-orange-500 to-orange-600",
  "topic-wise": "from-teal-500 to-teal-600",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Create tab state
  const [documents, setDocuments] = useState<api.DocumentInfo[]>([]);
  const [noteTypes, setNoteTypes] = useState<api.NoteTypeMeta[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<api.NoteInfo | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [genStatus, setGenStatus] = useState("");

  // History tab state
  const [notes, setNotes] = useState<api.NoteInfo[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<api.NoteInfo | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getNoteTypes().then(setNoteTypes).catch(() => {});
    api.listDocuments().then(setDocuments).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      loadNotes();
    }
  }, [activeTab, typeFilter]);

  const loadNotes = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.listNotes(undefined, typeFilter || undefined);
      setNotes(data);
    } catch {
      // ignore
    }
    setHistoryLoading(false);
  };

  const handleGenerate = async () => {
    if (!selectedDocId || !selectedType) return;
    setIsGenerating(true);
    setStreamingContent("");
    setGeneratedNote(null);
    setGenStatus("Generating your notes...");

    const controller = new AbortController();
    abortRef.current = controller;

    api.streamNoteGenerate(
      { document_id: selectedDocId, note_type: selectedType, custom_topic: customTopic || undefined },
      (token) => {
        setStreamingContent((prev) => prev + token);
      },
      (noteId) => {
        setGenStatus("Notes generated successfully!");
        api.getNote(noteId).then((note) => {
          setGeneratedNote(note);
          setStreamingContent(note.content);
          setIsGenerating(false);
        });
      },
      (err) => {
        setGenStatus(`Error: ${err.message}`);
        setIsGenerating(false);
      },
      controller.signal
    );
  };

  const handleExport = async (format: "pdf" | "docx" | "md") => {
    if (!generatedNote) return;
    try {
      await api.downloadNoteExport(generatedNote.id, format);
    } catch (err: any) {
      setGenStatus(`Export failed: ${err.message}`);
    }
  };

  const handleHistoryExport = async (noteId: string, format: "pdf" | "docx" | "md") => {
    try {
      await api.downloadNoteExport(noteId, format);
    } catch {
      // ignore
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch {
      // ignore
    }
    setDeleteConfirm(null);
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      loadNotes();
      return;
    }
    try {
      const data = await api.searchNotes(q);
      setNotes(data);
    } catch {
      // ignore
    }
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setGenStatus("Cancelled");
  };

  const noteTypeLabel = noteTypes.find((t) => t.key === selectedType)?.label || selectedType;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            AI Notes Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Uploaded documents + AI = perfect study notes
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "create"
                ? "bg-purple-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4 inline mr-1.5" />
            Create
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-purple-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-4 w-4 inline mr-1.5" />
            History
          </button>
        </div>
      </div>

      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Document Selector */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                Source Document
              </h3>
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No documents uploaded. Go to{" "}
                  <a href="/dashboard/documents" className="text-purple-400 underline">
                    Document Library
                  </a>{" "}
                  to upload.
                </p>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="">Select a document...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Note Type Selector */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Note Type
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {noteTypes.map((nt) => {
                  const isSelected = selectedType === nt.key;
                  const colorClass = NOTE_TYPE_COLORS[nt.key] || "from-purple-500 to-purple-600";
                  return (
                    <button
                      key={nt.key}
                      onClick={() => setSelectedType(nt.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all border ${
                        isSelected
                          ? `bg-gradient-to-r ${colorClass} text-white border-transparent shadow`
                          : "bg-secondary/20 border-border hover:bg-secondary/40 text-foreground"
                      }`}
                    >
                      <div className={`shrink-0 ${isSelected ? "text-white" : "text-muted-foreground"}`}>
                        {NOTE_TYPE_ICONS[nt.key] || <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{nt.label}</div>
                        <div className={`text-[10px] truncate ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                          {nt.description}
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Topic */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-400" />
                Focus Topic (optional)
              </h3>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Neural Networks, Chapter 3..."
                className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedDocId || !selectedType || isGenerating}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate {noteTypeLabel || "Notes"}
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Output */}
          <div className="lg:col-span-2 space-y-4">
            {!streamingContent && !isGenerating && !generatedNote && (
              <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Ready to Generate Notes</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a source document and note type from the left panel, then click Generate to create AI-powered study notes.
                </p>
              </div>
            )}

            {isGenerating && streamingContent === "" && (
              <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-purple-600/10 flex items-center justify-center">
                    <div className="w-14 h-14 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-purple-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Analyzing Document...</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="ml-2">Generating {noteTypeLabel}...</span>
                </div>
                <button
                  onClick={cancelGeneration}
                  className="mt-6 text-xs text-muted-foreground hover:text-red-400 transition-colors underline"
                >
                  Cancel generation
                </button>
              </div>
            )}

            {streamingContent && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Toolbar */}
                {generatedNote && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/10">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                        {generatedNote.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white bg-gradient-to-r ${
                        NOTE_TYPE_COLORS[generatedNote.note_type] || "from-purple-500 to-purple-600"
                      }`}>
                        {noteTypes.find((t) => t.key === generatedNote.note_type)?.label || generatedNote.note_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExport("pdf")}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Export PDF"
                      >
                        <Download className="h-4 w-4" />
                        <span className="ml-1 text-xs hidden sm:inline">PDF</span>
                      </button>
                      <button
                        onClick={() => handleExport("docx")}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Export DOCX"
                      >
                        <Download className="h-4 w-4" />
                        <span className="ml-1 text-xs hidden sm:inline">DOCX</span>
                      </button>
                      <button
                        onClick={() => handleExport("md")}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Export Markdown"
                      >
                        <Download className="h-4 w-4" />
                        <span className="ml-1 text-xs hidden sm:inline">MD</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div ref={contentRef} className="p-6 prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[70vh]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-0.5" />
                  )}
                </div>

                {genStatus && generatedNote && (
                  <div className="px-4 py-2 border-t border-border bg-green-500/5 text-xs text-green-400 flex items-center gap-2">
                    <Check className="h-3 w-3" />
                    {genStatus}
                  </div>
                )}
              </div>
            )}

            {!isGenerating && genStatus && genStatus.includes("Error") && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {genStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600 min-w-[140px]"
            >
              <option value="">All Types</option>
              {noteTypes.map((nt) => (
                <option key={nt.key} value={nt.key}>{nt.label}</option>
              ))}
            </select>
            <button
              onClick={loadNotes}
              className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Notes Grid */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Notes Yet</h3>
              <p className="text-sm text-muted-foreground">
                Generate your first notes from the Create tab.
              </p>
            </div>
          ) : selectedNote ? (
            /* Detailed view */
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <button
                  onClick={() => setSelectedNote(null)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to list
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHistoryExport(selectedNote.id, "pdf")}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    title="Export PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleHistoryExport(selectedNote.id, "docx")}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    title="Export DOCX"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleHistoryExport(selectedNote.id, "md")}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    title="Export Markdown"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-6 prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[70vh]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                >
                  {selectedNote.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            /* Card grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => {
                const typeMeta = noteTypes.find((t) => t.key === note.note_type);
                const colorClass = NOTE_TYPE_COLORS[note.note_type] || "from-purple-500 to-purple-600";
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-purple-600/5 transition-all group"
                  >
                    <div className={`h-2 bg-gradient-to-r ${colorClass}`} />
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`text-${colorClass.split(" ")[0].replace("from-", "")}`}>
                            {NOTE_TYPE_ICONS[note.note_type] || <FileText className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => setSelectedNote(note)}
                              className="text-sm font-bold text-foreground hover:text-purple-400 transition-colors text-left truncate block w-full"
                            >
                              {note.title}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleHistoryExport(note.id, "pdf")}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                            title="Export PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(note.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {note.source_document_name && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {note.source_document_name}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white bg-gradient-to-r ${colorClass}`}>
                          {typeMeta?.label || note.note_type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Delete confirmation */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                onClick={() => setDeleteConfirm(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Delete Note</h3>
                      <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/70 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteNote(deleteConfirm)}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
