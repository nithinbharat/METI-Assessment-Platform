"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
}

export default function SuggestedQuestions({
  questions,
  onSelectQuestion,
}: SuggestedQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-400 px-1">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="text-xs text-left px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/60 hover:bg-slate-800/90 text-slate-300 hover:text-white transition-all shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
