"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Trash2,
  Search,
  File,
  FileSpreadsheet,
  FileImage,
  Loader2,
  Check,
  AlertCircle,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import * as api from "@/lib/api";

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-red-400" />,
  docx: <FileText className="h-5 w-5 text-blue-400" />,
  txt: <File className="h-5 w-5 text-gray-400" />,
  pptx: <FileSpreadsheet className="h-5 w-5 text-orange-400" />,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<api.DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listDocuments();
      setDocuments(data);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      loadDocuments();
      return;
    }
    try {
      const results = await api.searchDocuments(q);
      setDocuments(results);
    } catch {
      // fallback
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await api.uploadDocument(file);
        setUploadSuccess(`"${file.name}" uploaded successfully.`);
      } catch (err: any) {
        setUploadError(err.message || `Failed to upload "${file.name}".`);
        break;
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadDocuments();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to delete document.");
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Document Library</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload PDF, DOCX, TXT, or PPTX files. CampusGPT will index them for AI-powered Q&A.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const droppedFiles = e.dataTransfer.files;
          if (droppedFiles.length === 0) return;
          setIsUploading(true);
          setUploadError(null);
          setUploadSuccess(null);
          for (let i = 0; i < droppedFiles.length; i++) {
            try {
              await api.uploadDocument(droppedFiles[i]);
              setUploadSuccess(`"${droppedFiles[i].name}" uploaded.`);
            } catch (err: any) {
              setUploadError(err.message);
              break;
            }
          }
          setIsUploading(false);
          loadDocuments();
        }}
        className="glass-panel border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.pptx"
          multiple
          onChange={handleUpload}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-purple-600/10 border border-purple-500/25 flex items-center justify-center group-hover:bg-purple-600/20 transition-all">
            {isUploading ? (
              <Loader2 className="h-7 w-7 text-purple-400 animate-spin" />
            ) : (
              <Upload className="h-7 w-7 text-purple-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {isUploading ? "Processing..." : "Drop files here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, TXT, PPTX &mdash; Max 50MB each
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {uploadError}
            <button onClick={() => setUploadError(null)} className="ml-auto hover:text-red-300">Dismiss</button>
          </motion.div>
        )}
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl"
          >
            <Check className="h-4 w-4 shrink-0" />
            {uploadSuccess}
            <button onClick={() => setUploadSuccess(null)} className="ml-auto hover:text-emerald-300">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search documents by filename..."
          className="w-full bg-secondary/35 border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-600"
        />
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-panel border border-border rounded-2xl p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-bold text-foreground mb-1">No documents yet</p>
          <p className="text-xs text-muted-foreground">
            Upload your first document to start asking questions about its content.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border border-border rounded-xl p-4 flex items-center gap-4 group hover:border-purple-500/30 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                {FILE_ICONS[doc.file_type] || <File className="h-5 w-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{doc.filename}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span>{formatSize(doc.file_size)}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>{doc.page_count > 0 ? `${doc.page_count} pages` : `${doc.chunk_count} chunks`}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>{formatDate(doc.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {deleteConfirm === doc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-2 py-1 text-[10px] bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 text-[10px] bg-secondary/50 text-muted-foreground rounded-lg hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(doc.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center pb-4">
        Documents are processed locally. Text is extracted, chunked, and embedded using AI for semantic search.
      </p>
    </div>
  );
}
