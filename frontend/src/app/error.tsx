"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console or error tracking service
    console.error("[Next.js Page ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-red-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border border-border text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-full p-4 mb-4">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
            An error occurred
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            A runtime error occurred in this application module.
          </p>
          {error.message && (
            <div className="bg-secondary/40 border border-border p-3.5 rounded-xl text-xs text-red-300 font-mono mt-4 max-w-sm overflow-x-auto text-left w-full">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 py-3 text-sm font-semibold text-white transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
            id="error-reset-button"
            aria-label="Try recovery action"
          >
            <RefreshCw className="h-4 w-4" />
            Try recovery
          </button>
          
          <Link
            href="/"
            className="flex-1 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 py-3 text-sm font-semibold text-foreground transition-all flex items-center justify-center gap-2"
            id="error-home-button"
            aria-label="Navigate back to landing page"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
