"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { 
  Clock, AlertTriangle, CheckCircle, Flag, ChevronLeft, 
  ChevronRight, Send, CheckCircle2, AlertCircle, Code, 
  Play, FileUp, Terminal, FileCheck, Maximize, Camera,
  UserCheck, UserX, Users, ShieldAlert 
} from "lucide-react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

interface Option {
  id: number;
  option_text: string;
}

interface Question {
  id: number;
  text: string;
  question_type: "MCQ" | "TRUE_FALSE" | "SHORT_TEXT" | "CODING" | "FILE_UPLOAD";
  points: number;
  code_template?: string;
  programming_language?: string;
  options: Option[];
}

interface AttemptStartData {
  attempt_id: number;
  assessment_id: number;
  assessment_title: string;
  started_at: string;
  time_limit_minutes: number;
  is_proctored?: boolean;
  tab_monitoring_enabled?: boolean;
  fullscreen_required?: boolean;
  webcam_monitoring_enabled?: boolean;
  face_monitoring_enabled?: boolean;
  questions: Question[];
}

export default function TakeAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id;

  const [attemptData, setAttemptData] = useState<AttemptStartData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected_option_id?: number; text_response?: string; file_path?: string }>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Sandbox Execution State
  const [runningCode, setRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<{ stdout: string; stderr: string; execution_time_ms: number; status: string } | null>(null);
  
  // File Upload State
  const [uploadingFile, setUploadingFile] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Webcam Proctoring State & Refs
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "active" | "error">("idle");
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [showWebcamModal, setShowWebcamModal] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const requestWebcamAccess = async () => {
    setCameraStatus("requesting");
    setCameraErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam access is not supported by your browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      setMediaStream(stream);
      setCameraStatus("active");
      setShowWebcamModal(false);
    } catch (err: any) {
      console.warn("Webcam access error:", err);
      setCameraStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraErrorMessage("Camera permission was not granted.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraErrorMessage("No camera device was found on your system.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setCameraErrorMessage("Unable to access your camera. It may be in use by another application.");
      } else {
        setCameraErrorMessage("Unable to access your camera. Please check browser permissions.");
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Clean up webcam stream tracks on component unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn("Error stopping track:", e);
          }
        });
      }
    };
  }, [mediaStream]);

  // AI Face Presence Detection State & Refs
  const [faceState, setFaceState] = useState<"ONE_FACE" | "NO_FACE" | "MULTIPLE_FACES" | "DETECTION_ERROR">("ONE_FACE");
  const [faceNoticeMessage, setFaceNoticeMessage] = useState<string | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noFaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noFaceEventSentRef = useRef<boolean>(false);
  const multipleFacesEventSentRef = useRef<boolean>(false);
  const errorEventSentRef = useRef<boolean>(false);



  useEffect(() => {
    async function initTest() {
      try {
        const data = await fetchApi<AttemptStartData>(`/attempts/start/${assessmentId}`, {
          method: "POST",
        });
        setAttemptData(data);
        setTimeLeftSeconds(data.time_limit_minutes * 60);

        if (data.webcam_monitoring_enabled || data.is_proctored) {
          setShowWebcamModal(true);
        }

        if (data.fullscreen_required) {
          setShowFullscreenModal(true);
        } else {
          setShowFullscreenModal(false);
        }

        // Pre-populate coding templates if present
        const initialAnswers: Record<number, { text_response?: string }> = {};
        data.questions.forEach((q) => {
          if (q.question_type === "CODING" && q.code_template) {
            initialAnswers[q.id] = { text_response: q.code_template };
          }
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        setError(err.message || "Failed to initialize test room.");
      } finally {
        setLoading(false);
      }
    }
    if (assessmentId) initTest();
  }, [assessmentId]);

  // Security Event Monitoring State & Refs
  const [securityBanner, setSecurityBanner] = useState<{ type: "warning" | "info"; message: string } | null>(null);
  const isTabHiddenRef = useRef<boolean>(false);
  const lastTabSwitchTimeRef = useRef<number>(0);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fullscreen Enforcement State & Refs
  const [showFullscreenModal, setShowFullscreenModal] = useState<boolean>(false);
  const isFullscreenRef = useRef<boolean>(false);

  const checkIsFullscreen = (): boolean => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  const requestBrowserFullscreen = async () => {
    const elem = document.documentElement as any;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      isFullscreenRef.current = true;
      setShowFullscreenModal(false);
    } catch (err) {
      console.warn("Fullscreen request error:", err);
      setShowFullscreenModal(false);
    }
  };

  const showSecurityNotice = (type: "warning" | "info", message: string) => {
    setSecurityBanner({ type, message });
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setSecurityBanner(null);
    }, 4500);
  };

  const dispatchSecurityEvent = async (eventType: string, details?: string) => {
    if (!attemptData?.attempt_id) return;
    try {
      await fetchApi(`/attempts/${attemptData.attempt_id}/security-event`, {
        method: "POST",
        body: JSON.stringify({
          event_type: eventType,
          details: details || `Route: /assessment/${assessmentId}/take`,
        }),
      });
    } catch (err) {
      console.warn("Security event dispatch failed:", err);
    }
  };

  useEffect(() => {
    if (!attemptData?.attempt_id) return;
    if (!attemptData?.tab_monitoring_enabled && !attemptData?.is_proctored) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isTabHiddenRef.current = true;
        lastTabSwitchTimeRef.current = Date.now();
        dispatchSecurityEvent("TAB_SWITCH", "Candidate switched tab or hidden window");
        showSecurityNotice("warning", "Warning: You have left the assessment window. This activity has been recorded.");
      } else if (document.visibilityState === "visible") {
        isTabHiddenRef.current = false;
        dispatchSecurityEvent("VISIBILITY_VISIBLE", "Candidate returned to assessment window");
        showSecurityNotice("info", "Assessment focus restored.");
      }
    };

    const handleBlur = () => {
      if (isTabHiddenRef.current || Date.now() - lastTabSwitchTimeRef.current < 400) return;
      dispatchSecurityEvent("WINDOW_BLUR", "Candidate window lost focus");
      showSecurityNotice("warning", "Warning: You have left the assessment window. This activity has been recorded.");
    };

    const handleFocus = () => {
      if (isTabHiddenRef.current || Date.now() - lastTabSwitchTimeRef.current < 400) return;
      dispatchSecurityEvent("WINDOW_FOCUS", "Candidate window focus restored");
      showSecurityNotice("info", "Assessment focus restored.");
    };

    const handleFullscreenChange = () => {
      const activeFS = checkIsFullscreen();
      if (!activeFS && isFullscreenRef.current) {
        isFullscreenRef.current = false;
        dispatchSecurityEvent("FULLSCREEN_EXIT", "Candidate exited browser fullscreen mode");
        showSecurityNotice("warning", "Warning: Fullscreen mode has been exited. Please return to fullscreen to continue the assessment.");
        setShowFullscreenModal(true);
      } else if (activeFS) {
        isFullscreenRef.current = true;
        setShowFullscreenModal(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [attemptData?.attempt_id]);

  // AI Face Presence Monitoring Effect (with Grace Period & Event Deduplication)
  useEffect(() => {
    if ((!attemptData?.face_monitoring_enabled && !attemptData?.is_proctored) || cameraStatus !== "active" || !mediaStream) {
      return;
    }

    let isMounted = true;

    async function initFaceDetector() {
      try {
        let detector: any = null;
        if (typeof window !== "undefined" && (window as any).FaceDetector) {
          detector = new (window as any).FaceDetector({ maxFaces: 5, fastMode: true });
        } else {
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm"
          );
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
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
            dispatchSecurityEvent("FACE_DETECTION_ERROR", "Face detection initialization unavailable");
          }
        }
      }
    }

    initFaceDetector();

    // Periodic detection every 1000ms
    faceIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !faceDetectorRef.current) {
        return;
      }

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
                dispatchSecurityEvent("NO_FACE_DETECTED", "Candidate absent from camera feed for >4 seconds");
              }
            }, 4000);
          }
        } else if (detectedCount > 1) {
          setFaceState("MULTIPLE_FACES");
          setFaceNoticeMessage("Multiple faces detected. Please ensure only the candidate is visible.");
          if (noFaceTimerRef.current) {
            clearTimeout(noFaceTimerRef.current);
            noFaceTimerRef.current = null;
          }

          if (!multipleFacesEventSentRef.current) {
            multipleFacesEventSentRef.current = true;
            dispatchSecurityEvent("MULTIPLE_FACES_DETECTED", `Multiple faces (${detectedCount}) detected in camera feed`);
          }
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
        try {
          faceDetectorRef.current.close();
        } catch (e) {}
      }
    };
  }, [attemptData?.is_proctored, cameraStatus, mediaStream, attemptData?.attempt_id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeftSeconds]);

  const handleAutoSubmit = () => {
    alert("⏳ Time has expired! Submitting your answers automatically...");
    submitExam();
  };

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selected_option_id: optionId },
    }));
  };

  const handleTextChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text_response: text },
    }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Run Code in Live Sandbox
  const handleRunCode = async (question: Question) => {
    const code = answers[question.id]?.text_response || question.code_template || "";
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
            language: question.programming_language || "python",
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

  // Upload Solution File
  const handleFileUpload = async (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("meti_token") : null;

      const res = await fetch(`${apiUrl}/api/v1/assessments/upload-solution`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "File upload failed");
      }

      const data = await res.json();
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], file_path: data.file_path },
      }));
    } catch (err: any) {
      alert(err.message || "Failed to upload file solution.");
    } finally {
      setUploadingFile(false);
    }
  };

  const submitExam = async () => {
    if (!attemptData) return;
    setSubmitting(true);

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping track:", e);
        }
      });
    }

    if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
    if (faceDetectorRef.current && typeof faceDetectorRef.current.close === "function") {
      try {
        faceDetectorRef.current.close();
      } catch (e) {}
    }

    try {
      const payloadAnswers = attemptData.questions.map((q) => {
        const ans = answers[q.id];
        return {
          question_id: q.id,
          selected_option_id: ans?.selected_option_id || null,
          text_response: ans?.text_response || null,
          file_path: ans?.file_path || null,
        };
      });

      const result = await fetchApi(`/attempts/${attemptData.attempt_id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: payloadAnswers }),
      });

      router.push(`/assessment/${assessmentId}/result?attempt_id=${attemptData.attempt_id}`);
    } catch (err: any) {
      alert(err.message || "Error submitting test");
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm font-medium">Entering Secure Test Room...</p>
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error || "Unable to load test"}
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!attemptData.questions || attemptData.questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="p-6 rounded-3xl glass-card border border-amber-500/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h3 className="text-lg font-bold text-white">No Questions Available</h3>
          <p className="text-xs text-slate-300">
            This assessment does not contain any questions yet. Please contact your instructor or administrator.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = attemptData.questions[currentIndex] || attemptData.questions[0];

  if (!currentQ) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          Selected question is unavailable.
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter(
    (k) =>
      answers[Number(k)]?.selected_option_id ||
      answers[Number(k)]?.text_response ||
      answers[Number(k)]?.file_path
  ).length;

  const isLowTime = (timeLeftSeconds || 0) <= 120;

  return (
    <div className="space-y-6">
      
      {/* Fullscreen Security Enforcement Modal */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl text-center space-y-5 border border-amber-500/40 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <Maximize className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Fullscreen Mode Required</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                To begin and maintain this assessment, active browser fullscreen mode is required. Exiting fullscreen or switching windows is recorded.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={requestBrowserFullscreen}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-glow uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <Maximize className="w-4 h-4" />
                <span>{checkIsFullscreen() ? "Return to Fullscreen" : "Enter Fullscreen & Start"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Event Warning / Focus Banner */}
      {securityBanner && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xl transition-all ${
          securityBanner.type === "warning"
            ? "bg-amber-500/20 text-amber-200 border-amber-500/50"
            : "bg-emerald-500/20 text-emerald-200 border-emerald-500/50"
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${securityBanner.type === "warning" ? "text-amber-400" : "text-emerald-400"}`} />
            <span>{securityBanner.message}</span>
          </div>
          <button
            onClick={() => setSecurityBanner(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-900/60"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Top Exam Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center justify-between sticky top-20 z-40 bg-[#080c14]/90">
        <div>
          <h1 className="text-lg font-bold text-white line-clamp-1">{attemptData.assessment_title}</h1>
          <p className="text-xs text-slate-400">
            Question <span className="text-white font-semibold">{currentIndex + 1}</span> of {attemptData.questions.length} • {answeredCount} Answered
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Live Timer Badge */}
          <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold ${
            isLowTime
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
              : "bg-slate-900 text-indigo-300 border-indigo-500/30"
          }`}>
            <Clock className={`w-4 h-4 ${isLowTime ? "text-rose-400" : "text-indigo-400"}`} />
            <span>{timeLeftSeconds !== null ? formatTime(timeLeftSeconds) : "--:--"}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Assessment</span>
          </button>
        </div>
      </div>

      {/* Webcam Permission Required Modal */}
      {attemptData?.is_proctored && showWebcamModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl text-center space-y-5 border border-cyan-500/40 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
              <Camera className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Webcam Required</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This assessment uses live webcam monitoring to verify candidate presence during the examination. Please grant camera access to proceed.
              </p>
            </div>

            {cameraErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {cameraErrorMessage}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={requestWebcamAccess}
                disabled={cameraStatus === "requesting"}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-glow uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>{cameraStatus === "requesting" ? "Connecting Camera..." : "Allow Camera & Continue"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Question Navigation Matrix */}
        <div className="glass-card p-5 rounded-2xl space-y-4 lg:col-span-1 h-fit">
          
          {/* Proctored Live Webcam Preview Widget */}
          {attemptData?.is_proctored && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center space-x-1">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Proctoring Feed</span>
                </span>

                {cameraStatus === "active" ? (
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    faceState === "ONE_FACE"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : faceState === "NO_FACE"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : faceState === "MULTIPLE_FACES"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      faceState === "ONE_FACE"
                        ? "bg-emerald-400 animate-pulse"
                        : faceState === "NO_FACE"
                        ? "bg-amber-400 animate-ping"
                        : faceState === "MULTIPLE_FACES"
                        ? "bg-rose-400 animate-pulse"
                        : "bg-slate-400"
                    }`} />
                    <span>
                      {faceState === "ONE_FACE"
                        ? "● Face detected"
                        : faceState === "NO_FACE"
                        ? "⚠ Face not detected"
                        : faceState === "MULTIPLE_FACES"
                        ? "⚠ Multiple faces"
                        : "⚠ Detection limited"}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Camera inactive</span>
                  </span>
                )}
              </div>

              {cameraStatus === "active" ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  </div>

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
                <button
                  type="button"
                  onClick={requestWebcamAccess}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-slate-400 text-xs hover:text-white transition-all flex items-center justify-center space-x-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Enable Webcam</span>
                </button>
              )}
            </div>
          )}

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Matrix</h3>
          
          <div className="grid grid-cols-5 gap-2">
            {attemptData.questions.map((q, idx) => {
              const isAnswered =
                !!answers[q.id]?.selected_option_id ||
                !!answers[q.id]?.text_response ||
                !!answers[q.id]?.file_path;
              const isFlagged = !!flagged[q.id];
              const isCurrent = idx === currentIndex;

              let btnStyle = "bg-slate-900/60 text-slate-400 border-slate-800";
              if (isCurrent) btnStyle = "bg-brand-600 text-white border-brand-400 ring-2 ring-brand-500/40";
              else if (isFlagged) btnStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40";
              else if (isAnswered) btnStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setCodeOutput(null);
                  }}
                  className={`w-full aspect-square rounded-xl text-xs font-bold border transition-all flex items-center justify-center relative ${btnStyle}`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
              <span>Flagged for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>

        {/* Right Side: Active Question Display */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl lg:col-span-3 space-y-6 flex flex-col justify-between min-h-[440px]">
          
          <div className="space-y-6">
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    Question {currentIndex + 1} of {attemptData.questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono uppercase">
                    {currentQ.question_type}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug">{currentQ.text}</h2>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
                  {currentQ.points} {currentQ.points === 1 ? "Point" : "Points"}
                </span>

                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center space-x-1 transition-all ${
                    flagged[currentQ.id]
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MCQ / TRUE_FALSE OPTIONS LIST */}
            {(currentQ.question_type === "MCQ" || currentQ.question_type === "TRUE_FALSE") && (
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id]?.selected_option_id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-brand-600/20 border-brand-500 text-white shadow-glow"
                          : "glass-card text-slate-300 hover:bg-slate-800/40"
                      }`}
                    >
                      <span>{opt.option_text}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? "border-brand-400 bg-brand-500 text-white" : "border-slate-700"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* AI NLP SHORT TEXT QUESTION */}
            {currentQ.question_type === "SHORT_TEXT" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                  Enter your short text response:
                </label>
                <textarea
                  rows={4}
                  value={answers[currentQ.id]?.text_response || ""}
                  onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                  placeholder="Type your response here... (Graded using AI NLP semantic similarity)"
                  className="w-full glass-input rounded-xl p-4 text-sm"
                />
              </div>
            )}

            {/* INTERACTIVE CODING SANDBOX (Python / JS / C++ / SQL) */}
            {currentQ.question_type === "CODING" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-xl border-t border-x border-slate-800">
                  <div className="flex items-center space-x-2 text-xs font-mono text-cyan-300">
                    <Code className="w-4 h-4 text-brand-400" />
                    <span className="uppercase">{currentQ.programming_language || "python"} Sandbox</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunCode(currentQ)}
                    disabled={runningCode}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{runningCode ? "Executing..." : "Run Code"}</span>
                  </button>
                </div>

                <textarea
                  rows={10}
                  value={answers[currentQ.id]?.text_response ?? (currentQ.code_template || "")}
                  onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                  className="w-full bg-slate-950 font-mono text-xs text-slate-100 p-4 border border-slate-800 rounded-b-xl focus:outline-none focus:border-brand-500 leading-relaxed"
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
            )}

            {/* FILE UPLOADS QUESTION */}
            {currentQ.question_type === "FILE_UPLOAD" && (
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase">
                  Upload Solution Attachment (.zip, .py, .js, .txt, .pdf):
                </label>
                
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
                  <FileUp className="w-8 h-8 text-brand-400 mx-auto" />
                  <p className="text-xs text-slate-300">
                    {uploadingFile ? "Uploading attachment..." : "Select or drag file to attach solution"}
                  </p>
                  
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(currentQ.id, e)}
                    disabled={uploadingFile}
                    className="block mx-auto text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500"
                  />
                </div>

                {answers[currentQ.id]?.file_path && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                    <FileCheck className="w-4 h-4" />
                    <span>Attached Solution: <strong>{answers[currentQ.id].file_path}</strong></span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
                setCodeOutput(null);
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < attemptData.questions.length - 1 ? (
              <button
                onClick={() => {
                  setCurrentIndex((prev) => Math.min(attemptData.questions.length - 1, prev + 1));
                  setCodeOutput(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-glow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Finish & Submit</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl space-y-5 border border-indigo-500/30">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Ready to Submit?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have answered <strong className="text-white">{answeredCount}</strong> out of <strong className="text-white">{attemptData.questions.length}</strong> questions.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Continue Exam
              </button>
              <button
                onClick={submitExam}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow"
              >
                {submitting ? "Evaluating..." : "Confirm & Grade"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
