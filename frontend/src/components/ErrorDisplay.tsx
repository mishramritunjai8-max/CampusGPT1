"use client";

import React from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorDisplay({ message, onRetry, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-300">{message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button onClick={onRetry} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all" title="Retry">
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all" title="Dismiss">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
