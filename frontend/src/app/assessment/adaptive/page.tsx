"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import {
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight,
  HelpCircle, Cpu, Trophy, Check,
  Camera, Maximize, Shield, ShieldAlert, VideoOff,
  UserCheck, UserX, Users, Code, Play, Terminal
} from "lucide-react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  question_id: number;
  topic: string;
  question_text: string;
  question_type?: "MCQ" | "CODING";
  programming_language?: string;
  code_template?: string;
  options: string[];
  is_followup: boolean;
}

interface AnswerFeedback {
  previous_evaluation_status: "CONFIDENT" | "NEEDS_CLARIFICATION";
  previous_confidence_score: number;
  previous_ai_feedback: string;
  is_session_completed: boolean;
  next_question: Question | null;
}

interface SessionTrace {
  question_id: number;
  topic: string;
  question_text: string;
  question_type?: "MCQ" | "CODING";
  programming_language?: string;
  code_template?: string;
  options: string[];
  candidate_answer: string;
  confidence_score: number;
  evaluation_status: "PENDING" | "CONFIDENT" | "NEEDS_CLARIFICATION";
  ai_feedback: string;
  is_followup: boolean;
}

interface SessionDetail {
  session_id: number;
  status: string;
  started_at: string;
  completed_at?: string;
  target_skills: string[];
  total_questions_asked: number;
  confident_count: number;
  questions: SessionTrace[];
}

type SecurityStep = "idle" | "webcam" | "fullscreen" | "interview";
type FaceState = "ONE_FACE" | "NO_FACE" | "MULTIPLE_FACES" | "DETECTION_ERROR";

// ─── Main Component ───────────────────────────────────────────────────────────

function AdaptiveAssessmentContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const router = useRouter();

  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<AnswerFeedback | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Coding Sandbox execution state
  const [runningCode, setRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<{ stdout: string; stderr: string; execution_time_ms: number; status: string } | null>(null);

  const handleRunCode = async () => {
    const code = candidateAnswer || currentQuestion?.code_template || "";
    if (!code.trim()) return;

    setRunningCode(true);
    setCodeOutput(null);

    try {
      const res = await fetchApi<{ stdout: string; stderr: string; execution_time_ms: number; status: string }>(
        "/assessments/run-code",
        {
          method: "POST",
          body: JSON.stringify({
            code,
            language: currentQuestion?.programming_language || "python",
          }),
        }
      );
      setCodeOutput(res);
    } catch (err: any) {
      setCodeOutput({
        stdout: "",
        stderr: err.message || "Code execution failed",
        execution_time_ms: 0,
        status: "ERROR",
      });
    } finally {
      setRunningCode(false);
    }
  };

  // Security flow: webcam → fullscreen → interview (sequential)
  const [securityStep, setSecurityStep] = useState<SecurityStep>("idle");
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  // Webcam
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "active" | "denied">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ── Face Detection State & Refs ───────────────────────────────────────────
  const [faceState, setFaceState] = useState<FaceState>("ONE_FACE");
  const [faceNoticeMessage, setFaceNoticeMessage] = useState<string | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noFaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noFaceEventSentRef = useRef<boolean>(false);
  const multipleFacesEventSentRef = useRef<boolean>(false);
  const errorEventSentRef = useRef<boolean>(false);

  // ── Fullscreen helpers ────────────────────────────────────────────────────
  const isFullscreen = () =>
    !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement
    );

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement as any;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch {
      // Some browsers block programmatic fullscreen — proceed anyway
    }
    setSecurityStep("interview");
  };

  // ── Webcam: request access ────────────────────────────────────────────────
  const requestWebcam = useCallback(async () => {
    setCameraStatus("requesting");
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setCameraStatus("active");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setSecurityStep("fullscreen");
    } catch (err: any) {
      setCameraStatus("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setCameraError("Unable to access camera. Please ensure no other app is using it.");
      }
    }
  }, []);

  // Attach stream to video element when both are ready
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [securityStep]);

  // ── Cleanup webcam on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch { } });
        mediaStreamRef.current = null;
      }
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
      if (faceDetectorRef.current && typeof faceDetectorRef.current.close === "function") {
        try { faceDetectorRef.current.close(); } catch { }
      }
    };
  }, []);

  // Stop webcam when interview completes
  useEffect(() => {
    if (isCompleted) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      setCameraStatus("idle");
    }
  }, [isCompleted]);

  // ── Face Detection Effect ─────────────────────────────────────────────────
  useEffect(() => {
    // Only run face detection when camera is active and interview has started
    if (cameraStatus !== "active" || !mediaStreamRef.current || securityStep !== "interview" || isCompleted) {
      return;
    }

    let isMounted = true;

    async function initFaceDetector() {
      try {
        let detector: any = null;
        if (typeof window !== "undefined" && (window as any).FaceDetector) {
          // Use native browser FaceDetector if available
          detector = new (window as any).FaceDetector({ maxFaces: 5, fastMode: true });
        } else {
          // Use MediaPipe Tasks Vision
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm"
          );
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
              delegate: "GPU",
            },
            runningMode: "IMAGE",
          });
        }
        if (isMounted) {
          faceDetectorRef.current = detector;
        }
      } catch (err) {
        console.warn("Face detector init fallback:", err);
        if (isMounted) {
          setFaceState("DETECTION_ERROR");
          setFaceNoticeMessage("Face detection is temporarily unavailable.");
          if (!errorEventSentRef.current) {
            errorEventSentRef.current = true;
          }
        }
      }
    }

    initFaceDetector();

    // Poll every 1000ms
    faceIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !faceDetectorRef.current) return;

      try {
        let detectedCount = 0;
        const detector = faceDetectorRef.current;

        if (typeof detector.detect === "function") {
          const results = detector.detect(videoRef.current);
          detectedCount = results.detections ? results.detections.length : 0;
        } else if (typeof detector.detectFaces === "function") {
          const faces = await detector.detectFaces(videoRef.current);
          detectedCount = faces ? faces.length : 0;
        }

        if (!isMounted) return;

        if (detectedCount === 1) {
          setFaceState("ONE_FACE");
          setFaceNoticeMessage(null);
          if (noFaceTimerRef.current) {
            clearTimeout(noFaceTimerRef.current);
            noFaceTimerRef.current = null;
          }
          noFaceEventSentRef.current = false;
          multipleFacesEventSentRef.current = false;
        } else if (detectedCount === 0) {
          setFaceState("NO_FACE");
          setFaceNoticeMessage("Please remain visible to the camera.");
          if (!noFaceTimerRef.current && !noFaceEventSentRef.current) {
            noFaceTimerRef.current = setTimeout(() => {
              if (!noFaceEventSentRef.current) {
                noFaceEventSentRef.current = true;
                // Could log security event here if adaptive sessions support it
              }
            }, 4000);
          }
        } else if (detectedCount > 1) {
          setFaceState("MULTIPLE_FACES");
          setFaceNoticeMessage("Multiple faces detected. Please ensure only you are visible.");
          if (noFaceTimerRef.current) {
            clearTimeout(noFaceTimerRef.current);
            noFaceTimerRef.current = null;
          }
          multipleFacesEventSentRef.current = true;
        }
      } catch (err) {
        console.warn("Face detection frame error:", err);
      }
    }, 1000);

    return () => {
      isMounted = false;
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
      if (faceDetectorRef.current && typeof faceDetectorRef.current.close === "function") {
        try { faceDetectorRef.current.close(); } catch { }
      }
    };
  }, [cameraStatus, securityStep, isCompleted]);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    if (isCompleted) return;

    const onFsChange = () => {
      if (!isFullscreen() && securityStep === "interview") {
        setSecurityWarning("⚠️ Fullscreen mode was exited. Please return to fullscreen to continue your interview.");
        setSecurityStep("fullscreen");
      }
    };

    const onVisibility = () => {
      if (document.hidden && securityStep === "interview") {
        setSecurityWarning("⚠️ Tab switch detected during your AI Resume Interview. Please keep this tab active.");
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isCompleted, securityStep]);

  // ── Load/restore session on mount ─────────────────────────────────────────
  useEffect(() => {
    async function initOrFetch() {
      if (!sessionId) return;
      try {
        const detail = await fetchApi<SessionDetail>(`/adaptive/session/${sessionId}`);
        setSessionSummary(detail);
        setTargetSkills(detail.target_skills);

        if (detail.status === "COMPLETED") {
          setIsCompleted(true);
          setSecurityStep("interview");
        } else {
          const pendingQ = detail.questions.find((q) => q.evaluation_status === "PENDING");
          if (pendingQ) {
            setCurrentQuestion({
              question_id: pendingQ.question_id,
              topic: pendingQ.topic,
              question_text: pendingQ.question_text,
              question_type: pendingQ.question_type || (pendingQ.options && pendingQ.options.length > 0 ? "MCQ" : "CODING"),
              programming_language: pendingQ.programming_language,
              code_template: pendingQ.code_template,
              options: pendingQ.options || [],
              is_followup: pendingQ.is_followup,
            });
            if (pendingQ.code_template) {
              setCandidateAnswer(pendingQ.code_template);
            }
          }
          setSecurityStep("webcam");
        }
      } catch (err: any) {
        console.error("Session load error:", err);
      } finally {
        setLoading(false);
      }
    }
    initOrFetch();
  }, [sessionId]);

  // ── Submit answer ─────────────────────────────────────────────────────────
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !sessionId || !candidateAnswer.trim()) return;

    setSubmitting(true);
    try {
      const data: AnswerFeedback = await fetchApi("/adaptive/answer", {
        method: "POST",
        body: JSON.stringify({
          session_id: Number(sessionId),
          question_id: currentQuestion.question_id,
          candidate_answer: candidateAnswer.trim(),
        }),
      });

      setLastFeedback(data);
      setCandidateAnswer("");

      if (data.is_session_completed) {
        setIsCompleted(true);
        const summary = await fetchApi<SessionDetail>(`/adaptive/session/${sessionId}`);
        setSessionSummary(summary);
      } else if (data.next_question) {
        setCurrentQuestion(data.next_question);
        setCandidateAnswer(data.next_question.code_template || "");
        setCodeOutput(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to evaluate answer.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        <Cpu className="w-8 h-8 mx-auto mb-3 text-cyan-400 animate-spin" />
        Restoring AI Interview session...
      </div>
    );
  }

  // ─── Face status badge helper ─────────────────────────────────────────────
  const FaceStatusBadge = () => {
    if (cameraStatus !== "active") return null;
    const configs: Record<FaceState, { color: string; dot: string; label: string; Icon: any }> = {
      ONE_FACE:        { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400 animate-pulse", label: "Face detected",       Icon: UserCheck },
      NO_FACE:         { color: "bg-amber-500/20 text-amber-300 border-amber-500/30",       dot: "bg-amber-400 animate-ping",  label: "Face not detected",    Icon: UserX },
      MULTIPLE_FACES:  { color: "bg-rose-500/20 text-rose-300 border-rose-500/30",          dot: "bg-rose-400 animate-pulse",  label: "Multiple faces",        Icon: Users },
      DETECTION_ERROR: { color: "bg-slate-800 text-slate-400 border-slate-700",             dot: "bg-slate-400",               label: "Detection limited",     Icon: ShieldAlert },
    };
    const c = configs[faceState];
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        <span>{faceState === "ONE_FACE" ? "● " : "⚠ "}{c.label}</span>
      </span>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 relative">

      {/* ── STEP 1: Webcam Permission Modal ─────────────────────────────── */}
      {!isCompleted && securityStep === "webcam" && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-6 border border-cyan-500/40 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Camera & Face Detection Required</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                This AI Resume Interview requires live webcam monitoring with <strong className="text-cyan-300">AI face presence detection</strong> to verify your identity throughout the session.
              </p>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Camera feed is used only for live proctoring. Video is not recorded or stored.</span>
            </div>
            {cameraError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
                {cameraError}
              </div>
            )}
            <button
              type="button"
              onClick={requestWebcam}
              disabled={cameraStatus === "requesting"}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 text-white font-bold shadow-glow uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>{cameraStatus === "requesting" ? "Connecting Camera..." : "Allow Camera & Continue"}</span>
            </button>
            {cameraStatus === "denied" && (
              <button
                type="button"
                onClick={() => setSecurityStep("fullscreen")}
                className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs transition-all"
              >
                Continue without camera (proctoring disabled)
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Fullscreen Modal ─────────────────────────────────────── */}
      {!isCompleted && securityStep === "fullscreen" && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-6 border border-amber-500/40 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto">
              <Maximize className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {securityWarning ? "Return to Fullscreen" : "Fullscreen Required"}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {securityWarning || "The AI Resume Interview must run in fullscreen mode. Exiting fullscreen will trigger a security warning."}
              </p>
            </div>
            {securityWarning && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{securityWarning}</span>
              </div>
            )}
            <button
              type="button"
              onClick={async () => { setSecurityWarning(null); await enterFullscreen(); }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-glow uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
            >
              <Maximize className="w-4 h-4" />
              <span>{isFullscreen() ? "Resume Interview" : "Enter Fullscreen & Begin"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── COMPLETED SCREEN ─────────────────────────────────────────────── */}
      {isCompleted && sessionSummary ? (
        <div className="glass-card p-8 rounded-3xl space-y-6 text-center border border-emerald-500/40 shadow-glow">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Trophy className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">AI Interview Completed!</h1>
            <p className="text-xs text-slate-300">
              Completed on{" "}
              {sessionSummary.completed_at
                ? new Date(sessionSummary.completed_at).toLocaleString()
                : "Just now"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Questions</span>
              <span className="text-2xl font-bold text-white">{sessionSummary.total_questions_asked}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Confident</span>
              <span className="text-2xl font-bold text-emerald-400">{sessionSummary.confident_count}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Mastery</span>
              <span className="text-2xl font-bold text-brand-300">
                {sessionSummary.total_questions_asked > 0
                  ? Math.round((sessionSummary.confident_count / sessionSummary.total_questions_asked) * 100)
                  : 0}%
              </span>
            </div>
          </div>
          <div className="text-left space-y-3 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Adaptive Evaluation Trace</span>
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {sessionSummary.questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-indigo-300">
                      Q{idx + 1} · {q.topic}
                      {q.is_followup && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/30">
                          Follow-up
                        </span>
                      )}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      q.evaluation_status === "CONFIDENT"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : q.evaluation_status === "PENDING"
                        ? "bg-slate-700/60 text-slate-400 border border-slate-700"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {q.evaluation_status} ({Math.round(q.confidence_score * 100)}%)
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium">{q.question_text}</p>
                  {q.candidate_answer && (
                    <div className="text-[11px] text-slate-400">
                      <strong className="text-slate-300">Your Answer:</strong> &ldquo;{q.candidate_answer}&rdquo;
                    </div>
                  )}
                  {q.ai_feedback && (
                    <div className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
                      {q.ai_feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 flex flex-wrap gap-3 justify-center">
            <Link
              href="/resume"
              className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-glow text-xs transition-all"
            >
              <span>Start New Attempt</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : securityStep === "interview" && currentQuestion ? (
        /* ── ACTIVE INTERVIEW ──────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── LEFT: Webcam + Face Detection Panel ────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-4 rounded-2xl space-y-3 border border-slate-800">
              {/* Header */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Proctoring Feed</span>
                </span>
                <FaceStatusBadge />
              </div>

              {/* Video feed */}
              {cameraStatus === "active" ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center space-x-1 bg-black/70 rounded-md px-1.5 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] text-emerald-300 font-bold uppercase">Live</span>
                    </div>
                  </div>

                  {/* Face notice */}
                  {faceNoticeMessage && (
                    <div className={`p-2 rounded-xl border text-[11px] font-medium leading-tight flex items-start space-x-1.5 ${
                      faceState === "MULTIPLE_FACES"
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                        : faceState === "NO_FACE"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                        : "bg-slate-800/80 border-slate-700 text-slate-300"
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span>{faceNoticeMessage}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-slate-950 border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-2">
                  <VideoOff className="w-6 h-6 text-slate-600" />
                  <span className="text-xs text-slate-500">Camera not active</span>
                </div>
              )}

              {/* Skills progress */}
              <div className="pt-1 space-y-1.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Resume Skills</span>
                <div className="flex flex-wrap gap-1">
                  {targetSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        s === currentQuestion.topic
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-400"
                          : "bg-slate-900 border-slate-800 text-slate-500"
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Question Area ────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header bar */}
            <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <h2 className="text-base font-bold text-white">AI Resume Interviewer</h2>
                  {currentQuestion.is_followup && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase">
                      Follow-up
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Topic: <strong className="text-cyan-300">{currentQuestion.topic}</strong>
                </p>
              </div>
            </div>

            {/* Last feedback */}
            {lastFeedback && (
              <div className={`p-4 rounded-2xl border text-xs space-y-1 transition-all ${
                lastFeedback.previous_evaluation_status === "CONFIDENT"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-200"
              }`}>
                <div className="font-bold flex items-center space-x-2">
                  {lastFeedback.previous_evaluation_status === "CONFIDENT" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {lastFeedback.previous_evaluation_status === "CONFIDENT"
                      ? "Strong Answer! Advancing to next topic."
                      : "Needs clarification — follow-up question generated."}
                  </span>
                </div>
                <p className="pl-6 text-slate-300">{lastFeedback.previous_ai_feedback}</p>
              </div>
            )}

            {/* Security warning */}
            {securityWarning && (
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{securityWarning}</span>
                </div>
                <button
                  onClick={() => setSecurityWarning(null)}
                  className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900/60 text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Question card */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                  Interview Question
                </span>
                <h1 className="text-xl font-bold text-white leading-snug">
                  {currentQuestion.question_text}
                </h1>
              </div>

              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                {currentQuestion.question_type === "CODING" || !currentQuestion.options || currentQuestion.options.length === 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-xl border-t border-x border-slate-800">
                      <div className="flex items-center space-x-2 text-xs font-mono text-cyan-300">
                        <Code className="w-4 h-4 text-cyan-400" />
                        <span className="uppercase">{(currentQuestion.programming_language || "python")} Sandbox</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={runningCode}
                        className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{runningCode ? "Executing..." : "Run Code"}</span>
                      </button>
                    </div>

                    <textarea
                      rows={10}
                      value={candidateAnswer}
                      onChange={(e) => setCandidateAnswer(e.target.value)}
                      placeholder="# Type your technical code solution here..."
                      className="w-full bg-slate-950 font-mono text-xs text-slate-100 p-4 border border-slate-800 rounded-b-xl focus:outline-none focus:border-cyan-500 leading-relaxed"
                    />

                    {/* Sandbox Terminal Output Panel */}
                    {codeOutput && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                          <span className="flex items-center space-x-1">
                            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Execution Output</span>
                          </span>
                          <span>{codeOutput.execution_time_ms} ms</span>
                        </div>
                        {codeOutput.stdout && (
                          <pre className="text-emerald-400 whitespace-pre-wrap">{codeOutput.stdout}</pre>
                        )}
                        {codeOutput.stderr && (
                          <pre className="text-rose-400 whitespace-pre-wrap">{codeOutput.stderr}</pre>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = candidateAnswer === opt;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCandidateAnswer(opt)}
                          className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-brand-600/20 border-brand-500 text-white shadow-glow"
                              : "glass-card text-slate-300 hover:bg-slate-800/40 border-slate-700"
                          }`}
                        >
                          <span>{opt}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-brand-400 bg-brand-500" : "border-slate-600"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !candidateAnswer.trim()}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl shadow-glow transition-all text-xs"
                  >
                    <span>{submitting ? "AI Evaluating..." : "Submit Answer"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : securityStep !== "webcam" && securityStep !== "fullscreen" ? (
        <div className="py-12 text-center text-slate-400 text-sm space-y-3">
          <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
          <p>No active question.</p>
          <Link href="/resume" className="text-brand-400 hover:underline text-xs">
            ← Return to Resume Upload
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function AdaptiveAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 text-sm">
          <Cpu className="w-8 h-8 mx-auto mb-3 text-cyan-400 animate-spin" />
          Loading AI Interviewer...
        </div>
      }
    >
      <AdaptiveAssessmentContent />
    </Suspense>
  );
}
