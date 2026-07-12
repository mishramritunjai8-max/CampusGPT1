"use client";

import { Sparkles } from "lucide-react";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center pt-2">
      {suggestions.map((chip, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(chip)}
          className="text-[10px] px-3 py-1.5 bg-secondary/35 border border-border hover:bg-secondary rounded-xl text-muted-foreground hover:text-white transition-all text-left flex items-center gap-1.5"
        >
          <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />
          {chip}
        </button>
      ))}
    </div>
  );
}
