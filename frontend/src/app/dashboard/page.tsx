"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { 
  Award, Clock, CheckCircle2, XCircle, Play, 
  BarChart2, Shield, ArrowRight, Sparkles, FileUp 
} from "lucide-react";

interface Assessment {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score_percentage: number;
  total_questions: number;
  category?: { name: string };
}

interface Attempt {
  attempt_id: number;
  assessment_id: number;
  assessment_title: string;
  score_obtained: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  status: string;
  completed_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [myAttempts, setMyAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto redirect to landing page if logged out
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [assessData, attemptsData] = await Promise.all([
          fetchApi<Assessment[]>("/assessments/"),
          fetchApi<Attempt[]>("/analytics/my-attempts").catch(() => []),
        ]);
        
        // Filter out any incomplete or unsubmitted default 0% attempts
        const completedAttempts = (attemptsData || []).filter(
          (a) => a.status === "COMPLETED" || a.completed_at !== null
        );

        setAssessments(assessData);
        setMyAttempts(completedAttempts);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Compute metrics EXCLUSIVELY on actual submitted completed attempts
  const totalAttempted = myAttempts.length;
  const totalPassed = myAttempts.filter((a) => a.passed).length;
  const avgPercentage = totalAttempted > 0
    ? (myAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempted).toFixed(1)
    : "0";

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400">Loading candidate dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header Banner: Tailored for Admin vs Candidate */}
      {user?.role === "ADMIN" ? (
        <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Evaluator Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Administrator Preview Mode
            </h1>
            <p className="text-sm text-slate-300">
              You are signed in as <strong className="text-cyan-300">{user.full_name}</strong>. Manage assessments, question banks, and candidate results in the Admin Portal.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-glow text-xs"
          >
            <Shield className="w-4 h-4" />
            <span>Open Admin Control Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Candidate Performance Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.full_name || "Candidate"} 👋
            </h1>
            <p className="text-sm text-slate-300">
              Select an assessment to test your knowledge or launch your personalized AI Resume Assessment.
            </p>
          </div>

          {/* Candidate Metrics Cards */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="glass-panel p-3.5 rounded-2xl text-center">
                <span className="text-xs text-slate-400 block font-medium">Attempted</span>
                <span className="text-xl font-bold text-white">{totalAttempted}</span>
              </div>
              <div className="glass-panel p-3.5 rounded-2xl text-center">
                <span className="text-xs text-slate-400 block font-medium">Passed</span>
                <span className="text-xl font-bold text-emerald-400">{totalPassed}</span>
              </div>
              <div className="glass-panel p-3.5 rounded-2xl text-center">
                <span className="text-xs text-slate-400 block font-medium">Avg Score</span>
                <span className="text-xl font-bold text-indigo-400">{avgPercentage}%</span>
              </div>
            </div>

            <Link
              href="/resume"
              className="hidden lg:inline-flex items-center space-x-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white font-semibold px-4 py-3 rounded-2xl shadow-glow text-xs"
            >
              <FileUp className="w-4 h-4 text-cyan-300" />
              <span>AI Resume Assessment</span>
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Loading assessments & metrics...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
          {error} (Ensure FastAPI backend is running at http://localhost:8000)
        </div>
      ) : (
        <>
          {/* Available Assessments Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-brand-400" />
                <h2 className="text-xl font-bold text-white">Available Assessments</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {assessments.length} Active Tests
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((test) => (
                <div key={test.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                        {test.category?.name || "General"}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{test.time_limit_minutes} mins</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white line-clamp-1">{test.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {test.description || "Comprehensive skills evaluation."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="text-slate-400">
                      Pass mark: <strong className="text-slate-200">{test.passing_score_percentage}%</strong>
                    </div>

                    <Link
                      href={`/assessment/${test.id}/take`}
                      className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow-glow text-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Test</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Past Attempts Section (For Candidate users - Only COMPLETED attempts) */}
          {user?.role !== "ADMIN" && myAttempts.length > 0 && (
            <section className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Your Attempt History</h2>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5">Assessment</th>
                        <th className="px-6 py-3.5">Completed Date</th>
                        <th className="px-6 py-3.5">Score</th>
                        <th className="px-6 py-3.5">Percentage</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {myAttempts.map((att) => (
                        <tr key={att.attempt_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">
                            {att.assessment_title}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {att.completed_at ? new Date(att.completed_at).toLocaleString() : "Completed"}
                          </td>
                          <td className="px-6 py-4 font-mono font-medium">
                            {att.score_obtained} / {att.max_score}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {att.percentage}%
                          </td>
                          <td className="px-6 py-4">
                            {att.passed ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Passed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                                <XCircle className="w-3 h-3" />
                                <span>Failed</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/assessment/${att.assessment_id}/result?attempt_id=${att.attempt_id}`}
                              className="inline-flex items-center space-x-1 text-brand-400 hover:text-brand-300 font-semibold hover:underline"
                            >
                              <span>View Score Report</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}

    </div>
  );
}
