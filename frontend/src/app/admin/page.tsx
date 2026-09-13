"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { fetchApi } from "@/lib/api";
import {
  Shield, Plus, Trash2, BookOpen, Users, BarChart3,
  HelpCircle, CheckCircle2, Sparkles, X, Trophy, Eye,
  Check, AlertCircle, XCircle
} from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score_percentage: number;
  total_questions: number;
  is_proctored?: boolean;
  tab_monitoring_enabled?: boolean;
  fullscreen_required?: boolean;
  webcam_monitoring_enabled?: boolean;
  face_monitoring_enabled?: boolean;
  category?: Category;
}

interface AnalyticsSummary {
  total_assessments: number;
  total_candidates: number;
  total_attempts: number;
  pass_rate_percentage: number;
}

interface LeaderboardEntry {
  user_name: string;
  user_email: string;
  score_obtained: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
}

interface AdminCandidateAttemptSummary {
  attempt_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  score_obtained: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  status: string;
  completed_at: string;
}

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

interface SecurityEventLog {
  id: number;
  attempt_id: number;
  event_type: string;
  timestamp: string;
  details?: string | null;
}

interface AttemptResultResponse {
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
  security_events?: SecurityEventLog[];
  security_events_count?: number;
  tab_switch_count?: number;
  window_blur_count?: number;
  fullscreen_exit_count?: number;
  no_face_count?: number;
  multiple_faces_count?: number;
  face_detection_error_count?: number;
  integrity_status?: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto redirect to landing page if logged out or not an admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/");
      } else if (user.role !== "ADMIN") {
        router.replace("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Modal States
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTimeLimit, setNewTimeLimit] = useState(20);
  const [newPassPercentage, setNewPassPercentage] = useState(70);
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);

  // Granular Security Settings State (Default OFF)
  const [newTabMonitoring, setNewTabMonitoring] = useState(false);
  const [newFullscreenRequired, setNewFullscreenRequired] = useState(false);
  const [newWebcamMonitoring, setNewWebcamMonitoring] = useState(false);
  const [newFaceMonitoring, setNewFaceMonitoring] = useState(false);

  const openCreateModal = () => {
    setEditingAssessmentId(null);
    setNewTitle("");
    setNewDesc("");
    setNewTimeLimit(20);
    setNewPassPercentage(70);
    setNewTabMonitoring(false);
    setNewFullscreenRequired(false);
    setNewWebcamMonitoring(false);
    setNewFaceMonitoring(false);
    setShowCreateAssessment(true);
  };

  const openEditModal = (test: Assessment) => {
    setEditingAssessmentId(test.id);
    setNewTitle(test.title);
    setNewDesc(test.description || "");
    setNewTimeLimit(test.time_limit_minutes);
    setNewPassPercentage(test.passing_score_percentage);
    setSelectedCatId(test.category?.id);
    setNewTabMonitoring(test.tab_monitoring_enabled ?? false);
    setNewFullscreenRequired(test.fullscreen_required ?? false);
    setNewWebcamMonitoring(test.webcam_monitoring_enabled ?? false);
    setNewFaceMonitoring(test.webcam_monitoring_enabled ? (test.face_monitoring_enabled ?? false) : false);
    setShowCreateAssessment(true);
  };

  // Question Modal States
  const [showAddQuestion, setShowAddQuestion] = useState<number | null>(null);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"MCQ" | "TRUE_FALSE" | "SHORT_TEXT">("MCQ");
  const [qPoints, setQPoints] = useState(1);
  const [qExplanation, setQExplanation] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctOptIdx, setCorrectOptIdx] = useState(0);

  // Leaderboard Modal State
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState<number | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  // Admin Submissions & Detailed Answers Score Inspector State
  const [selectedSubmissionsAssessment, setSelectedSubmissionsAssessment] = useState<Assessment | null>(null);
  const [candidateAttempts, setCandidateAttempts] = useState<AdminCandidateAttemptSummary[]>([]);
  const [inspectAttemptResult, setInspectAttemptResult] = useState<AttemptResultResponse | null>(null);
  const [loadingAttemptDetail, setLoadingAttemptDetail] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadAdminData();
    }
  }, [user]);

  async function loadAdminData() {
    try {
      const [assessData, catData, summaryData] = await Promise.all([
        fetchApi<Assessment[]>("/assessments/"),
        fetchApi<Category[]>("/assessments/categories"),
        fetchApi<AnalyticsSummary>("/analytics/summary").catch(() => null),
      ]);
      setAssessments(assessData);
      setCategories(catData);
      setSummary(summaryData);
      if (catData.length > 0) setSelectedCatId(catData[0].id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const isWebcam = newWebcamMonitoring;
    const isFace = isWebcam ? newFaceMonitoring : false;
    const isProctored = isWebcam || isFace || newTabMonitoring || newFullscreenRequired;

    const payload = {
      category_id: selectedCatId,
      title: newTitle,
      description: newDesc,
      time_limit_minutes: Number(newTimeLimit),
      passing_score_percentage: Number(newPassPercentage),
      is_proctored: isProctored,
      tab_monitoring_enabled: newTabMonitoring,
      fullscreen_required: newFullscreenRequired,
      webcam_monitoring_enabled: isWebcam,
      face_monitoring_enabled: isFace,
    };

    try {
      if (editingAssessmentId) {
        await fetchApi(`/assessments/${editingAssessmentId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/assessments/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowCreateAssessment(false);
      setEditingAssessmentId(null);
      setNewTitle("");
      setNewDesc("");
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to save assessment configuration");
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assessment?")) return;
    try {
      await fetchApi(`/assessments/${id}`, { method: "DELETE" });
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete assessment");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddQuestion) return;

    let options = [];
    if (qType === "MCQ") {
      options = [
        { option_text: opt1, is_correct: correctOptIdx === 0 },
        { option_text: opt2, is_correct: correctOptIdx === 1 },
        { option_text: opt3, is_correct: correctOptIdx === 2 },
        { option_text: opt4, is_correct: correctOptIdx === 3 },
      ].filter((o) => o.option_text.trim() !== "");
    } else if (qType === "TRUE_FALSE") {
      options = [
        { option_text: "True", is_correct: correctOptIdx === 0 },
        { option_text: "False", is_correct: correctOptIdx === 1 },
      ];
    } else {
      options = [{ option_text: opt1, is_correct: true }];
    }

    try {
      await fetchApi(`/questions/${showAddQuestion}`, {
        method: "POST",
        body: JSON.stringify({
          text: qText,
          question_type: qType,
          points: Number(qPoints),
          explanation: qExplanation,
          options,
        }),
      });
      setShowAddQuestion(null);
      setQText("");
      setOpt1("");
      setOpt2("");
      setOpt3("");
      setOpt4("");
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to add question");
    }
  };

  const openLeaderboard = async (assessmentId: number) => {
    setSelectedLeaderboardId(assessmentId);
    try {
      const data = await fetchApi<LeaderboardEntry[]>(`/analytics/leaderboard/${assessmentId}`);
      setLeaderboardEntries(data);
    } catch (err) {
      setLeaderboardEntries([]);
    }
  };

  const openCandidateSubmissions = async (assessment: Assessment) => {
    setSelectedSubmissionsAssessment(assessment);
    setInspectAttemptResult(null);
    try {
      const attempts = await fetchApi<AdminCandidateAttemptSummary[]>(`/analytics/admin/attempts/${assessment.id}`);
      setCandidateAttempts(attempts);
    } catch (err) {
      setCandidateAttempts([]);
    }
  };

  const inspectCandidateAnswers = async (attemptId: number) => {
    setLoadingAttemptDetail(true);
    try {
      const result = await fetchApi<AttemptResultResponse>(`/attempts/${attemptId}/result`);
      setInspectAttemptResult(result);
    } catch (err: any) {
      alert(err.message || "Failed to inspect candidate answers.");
    } finally {
      setLoadingAttemptDetail(false);
    }
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400">Verifying administrator access...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400">Loading control center data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin & Evaluator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Platform Control Center</h1>
          <p className="text-sm text-slate-400">Manage assessments, question banks, candidate evaluations, and detailed score analyses.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assessment</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Assessments</span>
            <div className="text-2xl font-extrabold text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>{summary.total_assessments}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Candidates</span>
            <div className="text-2xl font-extrabold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>{summary.total_candidates}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Attempts</span>
            <div className="text-2xl font-extrabold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>{summary.total_attempts}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Platform Pass Rate</span>
            <div className="text-2xl font-extrabold text-brand-300">
              {summary.pass_rate_percentage}%
            </div>
          </div>
        </div>
      )}

      {/* Assessments Management Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-brand-400" />
          <span>Active Question & Test Registry</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((test) => (
            <div key={test.id} className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
                    {test.category?.name || "General"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {test.total_questions} Questions
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{test.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {test.description || "Skill evaluation module."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddQuestion(test.id)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>

                  <button
                    onClick={() => openCandidateSubmissions(test)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Score Analysis</span>
                  </button>

                  <button
                    onClick={() => openLeaderboard(test.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Leaderboard</span>
                  </button>

                  <button
                    onClick={() => openEditModal(test)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Settings</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteAssessment(test.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal: Submissions & Detailed Score Analysis Inspector */}
      {selectedSubmissionsAssessment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-3xl w-full p-6 sm:p-8 rounded-3xl space-y-5 border border-cyan-500/40 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Candidate Score Analysis & Answer Inspector</h3>
                </div>
                <p className="text-xs text-slate-400 font-medium">{selectedSubmissionsAssessment.title}</p>
              </div>
              <button onClick={() => setSelectedSubmissionsAssessment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectAttemptResult ? (
              /* Detailed Candidate Answer Inspector View */
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-base font-bold text-white">Detailed Score Breakdown</h4>
                    <p className="text-xs text-slate-400">Attempt ID #{inspectAttemptResult.attempt_id}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-extrabold text-white">{inspectAttemptResult.percentage}%</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${inspectAttemptResult.passed ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}>
                      {inspectAttemptResult.passed ? "Passed" : "Failed"}
                    </span>
                    <button
                      onClick={() => setInspectAttemptResult(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Back to Candidate List
                    </button>
                  </div>
                </div>

                {/* Exam Security & Face Monitoring Summary */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>Exam Security & Face Monitoring Summary</span>
                    </h5>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      inspectAttemptResult.integrity_status === "Review Recommended"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}>
                      {inspectAttemptResult.integrity_status || "Normal"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-slate-300">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tab Switches / Blur</span>
                      <span className="text-sm font-bold text-white">{(inspectAttemptResult.tab_switch_count || 0) + (inspectAttemptResult.window_blur_count || 0)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Fullscreen Exits</span>
                      <span className="text-sm font-bold text-white">{inspectAttemptResult.fullscreen_exit_count || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">No Face Events</span>
                      <span className="text-sm font-bold text-amber-400">{inspectAttemptResult.no_face_count || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Multiple Faces Events</span>
                      <span className="text-sm font-bold text-rose-400">{inspectAttemptResult.multiple_faces_count || 0}</span>
                    </div>
                  </div>

                  {/* Security Events Timeline */}
                  {inspectAttemptResult.security_events && inspectAttemptResult.security_events.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <h6 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Recorded Security Event Timeline ({inspectAttemptResult.security_events.length} Events)
                      </h6>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
                        {inspectAttemptResult.security_events.map((evt) => {
                          const timeStr = new Date(evt.timestamp).toLocaleTimeString();
                          let badgeColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
                          if (evt.event_type === "NO_FACE_DETECTED") badgeColor = "text-amber-300 bg-amber-500/10 border-amber-500/30";
                          else if (evt.event_type === "MULTIPLE_FACES_DETECTED") badgeColor = "text-rose-300 bg-rose-500/10 border-rose-500/30";
                          else if (evt.event_type === "TAB_SWITCH" || evt.event_type === "FULLSCREEN_EXIT") badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";

                          return (
                            <div key={evt.id} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-400 font-semibold">{timeStr}</span>
                                <span className="text-slate-600">—</span>
                                <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${badgeColor}`}>
                                  {evt.event_type}
                                </span>
                              </div>
                              {evt.details && (
                                <span className="text-slate-400 text-[10px] truncate max-w-[220px]" title={evt.details}>
                                  {evt.details}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {inspectAttemptResult.answers.map((ans, idx) => (
                    <div key={ans.question_id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-2">
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-bold shrink-0 ${ans.is_correct ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                            }`}>
                            {idx + 1}
                          </span>
                          <div className="space-y-0.5">
                            {ans.topic && (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-semibold">
                                {ans.topic}
                              </span>
                            )}
                            <h5 className="font-semibold text-white leading-snug">{ans.question_text}</h5>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded font-bold shrink-0 ${ans.is_correct ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                          {ans.is_correct ? "Correct" : "Incorrect"} ({ans.score_awarded} / {ans.max_points} pts)
                        </span>
                      </div>

                      {ans.text_response && (
                        <div className="pl-8 text-slate-300">
                          <strong className="text-slate-400">Candidate Text Response:</strong> "{ans.text_response}"
                        </div>
                      )}

                      {ans.explanation && (
                        <div className="pl-8 text-slate-400 italic pt-1 border-t border-slate-800/80">
                          <strong className="text-indigo-300 not-italic">Explanation:</strong> {ans.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : candidateAttempts.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">
                No candidates have completed this assessment yet.
              </p>
            ) : (
              /* Candidate Attempts Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Completed Date</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Percentage</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Inspect Answers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {candidateAttempts.map((att) => (
                      <tr key={att.attempt_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white">
                          <div>{att.user_name}</div>
                          <div className="text-[11px] text-slate-400">{att.user_email}</div>
                        </td>
                        <td className="p-3 text-slate-400">
                          {att.completed_at ? new Date(att.completed_at).toLocaleString() : "Completed"}
                        </td>
                        <td className="p-3 font-mono">{att.score_obtained} / {att.max_score}</td>
                        <td className="p-3 font-bold text-white">{att.percentage}%</td>
                        <td className="p-3">
                          {att.passed ? (
                            <span className="text-emerald-400 font-semibold">Passed</span>
                          ) : (
                            <span className="text-rose-400 font-semibold">Failed</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => inspectCandidateAnswers(att.attempt_id)}
                            disabled={loadingAttemptDetail}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Answers</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Assessment */}
      {showCreateAssessment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl space-y-5 border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white">
                {editingAssessmentId ? "Edit Assessment & Security Settings" : "Create New Assessment"}
              </h3>
              <button onClick={() => setShowCreateAssessment(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Advanced Python Coroutines & AsyncIO"
                  className="w-full glass-input rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(Number(e.target.value))}
                  className="w-full glass-input rounded-xl p-3 bg-slate-900"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed breakdown of what candidates will be tested on..."
                  className="w-full glass-input rounded-xl p-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={newTimeLimit}
                    onChange={(e) => setNewTimeLimit(Number(e.target.value))}
                    className="w-full glass-input rounded-xl p-3"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Passing Mark (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={newPassPercentage}
                    onChange={(e) => setNewPassPercentage(Number(e.target.value))}
                    className="w-full glass-input rounded-xl p-3"
                  />
                </div>
              </div>

              {/* EXAM SECURITY CONFIGURATION PANEL */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-800">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider">EXAM SECURITY</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Configure optional proctoring and security features for this assessment.
                </p>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center space-x-2.5 text-slate-300 font-semibold cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={newTabMonitoring}
                      onChange={(e) => setNewTabMonitoring(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500 bg-slate-900 border-slate-700"
                    />
                    <span>Tab & Focus Monitoring</span>
                  </label>

                  <label className="flex items-center space-x-2.5 text-slate-300 font-semibold cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={newFullscreenRequired}
                      onChange={(e) => setNewFullscreenRequired(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500 bg-slate-900 border-slate-700"
                    />
                    <span>Require Fullscreen</span>
                  </label>

                  <label className="flex items-center space-x-2.5 text-slate-300 font-semibold cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={newWebcamMonitoring}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewWebcamMonitoring(checked);
                        if (!checked) {
                          setNewFaceMonitoring(false);
                        }
                      }}
                      className="w-4 h-4 rounded accent-cyan-500 bg-slate-900 border-slate-700"
                    />
                    <span>Webcam Monitoring</span>
                  </label>

                  <div className="pl-6 space-y-0.5">
                    <label className={`flex items-center space-x-2.5 font-semibold text-xs ${
                      newWebcamMonitoring ? "text-slate-300 cursor-pointer" : "text-slate-600 cursor-not-allowed"
                    }`}>
                      <input
                        type="checkbox"
                        disabled={!newWebcamMonitoring}
                        checked={newFaceMonitoring}
                        onChange={(e) => setNewFaceMonitoring(e.target.checked)}
                        className="w-4 h-4 rounded accent-cyan-500 bg-slate-900 border-slate-700 disabled:opacity-40"
                      />
                      <span>Face Presence Monitoring</span>
                    </label>
                    <span className="text-[10px] text-slate-500 block pl-7">
                      Requires Webcam Monitoring to be enabled.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAssessment(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Question to Assessment */}
      {showAddQuestion && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl space-y-5 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add Question to Test #{showAddQuestion}</h3>
              <button onClick={() => setShowAddQuestion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Prompt</label>
                <input
                  type="text"
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Which command starts a Uvicorn ASGI server?"
                  className="w-full glass-input rounded-xl p-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full glass-input rounded-xl p-3 bg-slate-900"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_TEXT">Short Answer Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Points</label>
                  <input
                    type="number"
                    min={1}
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="w-full glass-input rounded-xl p-3"
                  />
                </div>
              </div>

              {/* Options Setup */}
              {qType === "MCQ" && (
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">Options (Select radio for correct answer)</label>
                  {[opt1, opt2, opt3, opt4].map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correct_opt"
                        checked={correctOptIdx === idx}
                        onChange={() => setCorrectOptIdx(idx)}
                        className="accent-brand-500"
                      />
                      <input
                        type="text"
                        required={idx < 2}
                        value={idx === 0 ? opt1 : idx === 1 ? opt2 : idx === 2 ? opt3 : opt4}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (idx === 0) setOpt1(val);
                          else if (idx === 1) setOpt2(val);
                          else if (idx === 2) setOpt3(val);
                          else setOpt4(val);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="w-full glass-input rounded-xl p-2.5"
                      />
                    </div>
                  ))}
                </div>
              )}

              {qType === "TRUE_FALSE" && (
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">Correct Option</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="tf_opt"
                        checked={correctOptIdx === 0}
                        onChange={() => setCorrectOptIdx(0)}
                        className="accent-brand-500"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="tf_opt"
                        checked={correctOptIdx === 1}
                        onChange={() => setCorrectOptIdx(1)}
                        className="accent-brand-500"
                      />
                      <span>False</span>
                    </label>
                  </div>
                </div>
              )}

              {qType === "SHORT_TEXT" && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Accepted Correct Answer</label>
                  <input
                    type="text"
                    required
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    placeholder="e.g. uvicorn main:app"
                    className="w-full glass-input rounded-xl p-3"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Explanation (Optional)</label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Provide context on why this answer is correct..."
                  className="w-full glass-input rounded-xl p-3"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddQuestion(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-glow"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {selectedLeaderboardId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl space-y-5 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Assessment Leaderboard</h3>
              </div>
              <button onClick={() => setSelectedLeaderboardId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {leaderboardEntries.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">
                No candidates have completed this assessment yet.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Percentage</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {leaderboardEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-amber-400">#{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{entry.user_name}</div>
                          <div className="text-[11px] text-slate-400">{entry.user_email}</div>
                        </td>
                        <td className="p-3 font-mono">{entry.score_obtained} / {entry.max_score}</td>
                        <td className="p-3 font-bold text-white">{entry.percentage}%</td>
                        <td className="p-3">
                          {entry.passed ? (
                            <span className="text-emerald-400 font-semibold">Passed</span>
                          ) : (
                            <span className="text-rose-400 font-semibold">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
