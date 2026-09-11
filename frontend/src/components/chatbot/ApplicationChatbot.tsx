"use client";

import React, { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import ChatbotButton from "./ChatbotButton";
import ChatbotWindow from "./ChatbotWindow";
import { Message } from "./ChatMessage";
import { RobotState } from "./WallERobot";
import {
  getChatbotResponse,
  getSuggestedQuestionsForRoute,
} from "./chatbotUtils";

export default function ApplicationChatbot() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();

  // Exclude EVE Chatbot completely from:
  // 1. Authentication pages
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/signin" ||
    pathname.startsWith("/signin/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/");

  // 2. Active assessment test-taking pages (Fullstack, Data Science, AI/ML assessments when candidate is writing)
  const isAssessmentTakingPage =
    pathname.includes("/take");

  // 3. AI Resume Evaluator & Adaptive Evaluation sections
  const isResumeOrEvaluationPage =
    pathname === "/resume" ||
    pathname.startsWith("/resume/") ||
    pathname === "/assessment/adaptive" ||
    pathname.startsWith("/assessment/adaptive");

  const shouldHideChatbot =
    !user ||
    isAuthPage ||
    isAssessmentTakingPage ||
    isResumeOrEvaluationPage;

  const [isOpen, setIsOpen] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>("idle");
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Stop speech synthesis when navigating to excluded pages or on unmount
  useEffect(() => {
    if (shouldHideChatbot && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [shouldHideChatbot]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "bot",
      text: "Hi! I'm EVE, your METI Assessment Platform assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  // Text-to-Speech (Speaking back to user)
  const speakText = useCallback(
    (text: string) => {
      if (isMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel(); // Stop prior speech utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.15; // Friendly female robot pitch

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.name.includes("Female") ||
            v.name.includes("Google US English") ||
            v.name.includes("Samantha") ||
            v.name.includes("Zira")
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          setRobotState("answering");
        };

        utterance.onend = () => {
          setRobotState("chat_open");
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Fallback silently if speech synthesis fails
      }
    },
    [isMuted]
  );

  // Hide chatbot completely when user is not signed in or on excluded pages
  if (shouldHideChatbot) {
    return null;
  }

  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setRobotState("chat_open");
    } else {
      setIsOpen(false);
      setRobotState("idle");
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setRobotState("thinking");

    // Simulate small realistic thinking delay
    setTimeout(async () => {
      const { text: botResponseText } = await getChatbotResponse(text, {
        page: pathname,
        role: user?.role,
      });

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);
      setRobotState("answering");

      // Speak response back out loud
      speakText(botResponseText);

      setTimeout(() => {
        setRobotState("chat_open");
      }, 1000);
    }, 450);
  };

  const suggestedQuestions = getSuggestedQuestionsForRoute(pathname, user?.role);

  return (
    <>
      <ChatbotButton
        isOpen={isOpen}
        onToggle={handleToggleOpen}
        robotState={robotState}
        setRobotState={setRobotState}
      />
      <ChatbotWindow
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setRobotState("idle");
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
        }}
        onMinimize={() => {
          setIsOpen(false);
          setRobotState("idle");
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
        }}
        messages={messages}
        isThinking={isThinking}
        onSendMessage={handleSendMessage}
        suggestedQuestions={suggestedQuestions}
        robotState={robotState}
        isMuted={isMuted}
        onToggleMute={() => {
          if (!isMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          setIsMuted(!isMuted);
        }}
      />
    </>
  );
}
