"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Award, Clock, ShieldCheck, Zap, ArrowRight, BarChart3, CheckCircle2, Sparkles, Key } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { login } = useAuth();
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const quickDemoLogin = async (email: string, role: string) => {
    setLoadingRole(role);
    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", role === "ADMIN" ? "admin123" : "student123");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/login`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Demo login failed. Make sure backend is running & seeded.");

      const data = await res.json();
      login(data.access_token, data.user);
      
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      alert(err.message || "Failed to sign in via demo shortcut.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="space-y-16 py-6">
      
      {/* Hero Section */}
      <section className="text-center relative py-12 px-4 rounded-3xl bg-glow-radial border border-slate-800/60 glass-card">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Enterprise Evaluation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Evaluate Skills with <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Precision & Speed</span>
        </h1>

        <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-base sm:text-lg">
          An asynchronous full-stack assessment system powered by <strong>FastAPI</strong> and <strong>Next.js 14</strong>. Conduct real-time online exams, timed evaluations, and automated score analytics.
        </p>

        {/* Demo Login Quick Shortcuts */}
        <div className="mt-8 max-w-xl mx-auto p-4 rounded-2xl glass-panel border border-indigo-500/30">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>1-Click Demo Login Shortcuts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => quickDemoLogin("student@meti.org", "CANDIDATE")}
              disabled={!!loadingRole}
              className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium transition-all hover:border-brand-500/50"
            >
              <Award className="w-4 h-4 text-brand-400" />
              <span>{loadingRole === "CANDIDATE" ? "Signing In..." : "Demo Candidate"}</span>
            </button>

            <button
              onClick={() => quickDemoLogin("admin@meti.org", "ADMIN")}
              disabled={!!loadingRole}
              className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 text-cyan-200 text-sm font-medium transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{loadingRole === "ADMIN" ? "Signing In..." : "Demo Admin"}</span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-glow transition-all"
          >
            <span>Explore Assessments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Timed Live Exams</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Distraction-free assessment room equipped with real-time countdown timer, question matrix, draft auto-saving, and auto-submit timeouts.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Automated Grading</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Instant evaluation engine supporting Multiple Choice (MCQ), True/False, and Short Text response formats with detailed explanations.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Analytics & Reports</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Comprehensive score reports, candidate history, pass/fail percentage metrics, and assessment leaderboards.
          </p>
        </div>

      </section>

      {/* Tech Stack Banner */}
      <section className="glass-panel p-8 rounded-2xl text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-300">Engineered with Production-Grade Technologies</h3>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-400">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-300">FastAPI (Python)</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">Next.js 14 App Router</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-300">PostgreSQL</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300">SQLAlchemy 2.0 Async</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300">Docker Compose</span>
        </div>
      </section>

    </div>
  );
}
