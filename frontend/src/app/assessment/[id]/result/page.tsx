"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { 
  Award, CheckCircle2, XCircle, ArrowLeft, 
  HelpCircle, RefreshCw, Sparkles, Check, X 
} from "lucide-react";

interface AnswerDetail {
  question_id: number;
  question_text: string;
  selected_option_id: number | null;
  text_response: string | null;
  is_correct: boolean;
  score_awarded: number;
  max_points: number;
  explanation: string | null;
  correct_option_id: number | null;
  topic?: string | null;
}

interface AttemptResult {
  attempt_id: number;
  assessment_id: number;
  assessment_title: string;
  score_obtained: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  status: string;
  completed_at: string;
  answers: AnswerDetail[];
  security_events_count?: number;
  tab_switch_count?: number;
  window_blur_count?: number;
  integrity_status?: string;
}

export default function AssessmentResultPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt_id");
  const router = useRouter();

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) return;
      try {
        const data = await fetchApi<AttemptResult>(`/attempts/${attemptId}/result`);
        setResult(data);
      } catch (err: any) {
        setError(err.message || "Failed to load score report.");
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Generating Score Report & Analytics...
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error || "Score report not found"}
        </div>
        <Link href="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const correctCount = result.answers.filter((a) => a.is_correct).length;
  const incorrectCount = result.answers.length - correctCount;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs text-slate-500 font-mono">
          Attempt #{result.attempt_id}
        </span>
      </div>

      {/* Main Scorecard Banner */}
      <div className={`glass-card p-8 rounded-3xl relative overflow-hidden text-center space-y-6 ${
        result.passed
          ? "bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 shadow-glow"
          : "bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40"
      }`}>
        
        <div className="space-y-2">
          <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            result.passed
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
          }`}>
            {result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{result.passed ? "Assessment Passed" : "Assessment Failed"}</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white">{result.assessment_title}</h1>
          <p className="text-xs text-slate-400">
            Completed on {new Date(result.completed_at).toLocaleString()}
          </p>
        </div>

        {/* Big Score Display */}
        <div className="flex justify-center items-baseline space-x-2">
          <span className="text-6xl font-extrabold text-white">{result.percentage}%</span>
          <span className="text-slate-400 text-sm font-semibold">
            ({result.score_obtained} / {result.max_score} Points)
          </span>
        </div>

        {/* Breakdown Metric Bar */}
        <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto pt-4 border-t border-slate-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 block font-medium">Correct</span>
            <span className="text-lg font-bold text-emerald-400">{correctCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 block font-medium">Incorrect</span>
            <span className="text-lg font-bold text-rose-400">{incorrectCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 block font-medium">Total Questions</span>
            <span className="text-lg font-bold text-slate-200">{result.answers.length}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 block font-medium">Integrity Status</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
              result.integrity_status === "Review Recommended"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}>
              {result.integrity_status || "Normal"}
            </span>
          </div>
        </div>

      </div>

      {/* Question-by-Question Detailed Review */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-brand-400" />
          <span>Detailed Answer Breakdown</span>
        </h2>

        <div className="space-y-4">
          {result.answers.map((ans, idx) => (
            <div key={ans.question_id} className="glass-card p-6 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    ans.is_correct
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    {ans.topic && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold tracking-wide">
                        {ans.topic}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-white leading-snug">{ans.question_text}</h3>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  ans.is_correct
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {ans.score_awarded} / {ans.max_points} pts
                </span>
              </div>

              {/* Status Badge */}
              <div className="text-xs text-slate-300 pl-10 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-medium">Result:</span>
                  {ans.is_correct ? (
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Correct Answer</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center space-x-1">
                      <X className="w-3.5 h-3.5" />
                      <span>Incorrect Answer</span>
                    </span>
                  )}
                </div>

                {ans.explanation && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs leading-relaxed flex items-start space-x-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-300 block mb-0.5">Explanation:</strong>
                      <span>{ans.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
