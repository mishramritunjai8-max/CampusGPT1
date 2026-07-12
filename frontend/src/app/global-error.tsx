"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Next.js Global Root ErrorBoundary]", error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex items-center justify-center bg-[#0a0514] text-foreground p-4">
        <div className="w-full max-w-md space-y-8 bg-[#130d22]/80 backdrop-blur-xl border border-purple-500/10 p-8 rounded-2xl text-center shadow-2xl">
          <div className="flex flex-col items-center justify-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-full p-4 mb-4">
              <AlertOctagon className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
              Application Crash
            </h2>
            <p className="text-sm text-gray-400 mt-2 max-w-xs leading-relaxed">
              A critical global exception occurred. The application root was forced to unmount.
            </p>
            {error.message && (
              <div className="bg-black/35 border border-purple-500/10 p-3.5 rounded-xl text-xs text-red-300 font-mono mt-4 max-w-sm overflow-x-auto text-left w-full">
                {error.message}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-3.5 text-sm font-semibold text-white transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
              id="global-error-reset"
              aria-label="Reload critical components"
            >
              <RefreshCw className="h-4 w-4 animate-spin-reverse" />
              Reset App State
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
