"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { fetchApi, getAuthToken } from "@/lib/api";
import { 
  FileUp, Sparkles, UploadCloud, CheckCircle2, 
  ArrowRight, ShieldCheck, Cpu, FileText, Play 
} from "lucide-react";

interface ResumeProfile {
  resume_filename?: string;
  parsed_skills: string[];
  resume_text_snippet?: string;
}

export default function ResumeUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto redirect to landing page if logged out
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadResumeProfile() {
      try {
        const data = await fetchApi<ResumeProfile>("/resume/my-resume");
        setProfile(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResumeProfile();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      setError("Please select a resume file (PDF/TXT) or paste resume text.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (rawText.trim()) {
        formData.append("raw_text", rawText.trim());
      }

      const authToken = getAuthToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/resume/upload`, {
        method: "POST",
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Resume upload failed");
      }

      const data: ResumeProfile = await res.json();
      setProfile(data);
      setFile(null);
      setRawText("");
    } catch (err: any) {
      setError(err.message || "Failed to parse resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      const sessionData = await fetchApi("/adaptive/start", { method: "POST" });
      router.push(`/assessment/adaptive?session_id=${sessionData.session_id}`);
    } catch (err: any) {
      alert(err.message || "Failed to initialize AI Adaptive Interview.");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Header */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Resume Skill Analyzer & Adaptive Evaluator</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white">Upload Resume & Personalize AI Assessment</h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Our AI parser extracts your core technical skills (e.g. Python, FastAPI, React, SQL, Docker) from your resume. The AI interviewer will tailor questions directly to your experience and adapt in real time!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Upload Form */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              <span>Resume Source</span>
            </h2>
            <p className="text-xs text-slate-400">Upload PDF / TXT document or paste raw text</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl p-6 text-center space-y-2 bg-slate-900/40 transition-colors">
              <FileText className="w-8 h-8 text-brand-400 mx-auto" />
              <div className="text-slate-300 font-medium">
                {file ? (
                  <span className="text-emerald-400 font-bold">{file.name}</span>
                ) : (
                  <span>Select a PDF or TXT Resume File</span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
              />
            </div>

            <div className="text-center text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              — OR PASTE RESUME TEXT —
            </div>

            <div>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your skills, experience, or resume summary here... (e.g. Senior Developer skilled in Python, FastAPI, Next.js, PostgreSQL, Docker)"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-glow transition-all"
            >
              {uploading ? "Analyzing Resume Skills..." : "Analyze & Save Resume"}
            </button>
          </form>
        </div>

        {/* Right Column: Parsed Skills & AI Start CTA */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Extracted Resume Skills</span>
              </h2>
              <p className="text-xs text-slate-400">Target topics identified by the AI Evaluator</p>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400">Loading parsed resume profile...</p>
            ) : profile && profile.parsed_skills.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 pt-2">
                  {profile.parsed_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600/20 to-indigo-600/20 border border-brand-500/40 text-brand-200 text-xs font-semibold shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {profile.resume_filename && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-white flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Active Resume File: {profile.resume_filename}</span>
                    </div>
                    {profile.resume_text_snippet && (
                      <p className="text-[11px] text-slate-400 line-clamp-3 italic">
                        "{profile.resume_text_snippet}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                No resume uploaded yet. Upload a PDF or paste text to see extracted skills.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleStartInterview}
              disabled={!profile || profile.parsed_skills.length === 0}
              className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-glow transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch AI Adaptive Resume Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
