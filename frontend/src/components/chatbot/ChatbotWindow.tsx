"use client";

import React, { useState, useRef, useEffect } from "react";
import WallERobot, { RobotState } from "./WallERobot";
import ChatMessage, { Message } from "./ChatMessage";
import SuggestedQuestions from "./SuggestedQuestions";
import { X, Minus, Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface ChatbotWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  messages: Message[];
  isThinking: boolean;
  onSendMessage: (text: string) => void;
  suggestedQuestions: string[];
  robotState: RobotState;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function ChatbotWindow({
  isOpen,
  onClose,
  onMinimize,
  messages,
  isThinking,
  onSendMessage,
  suggestedQuestions,
  robotState,
  isMuted,
  onToggleMute,
}: ChatbotWindowProps) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, isOpen]);

  // Focus input on window open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onMinimize();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onMinimize]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleChipSelect = (q: string) => {
    if (isThinking) return;
    onSendMessage(q);
  };

  // Toggle Microphone Speech-to-Text Voice Input
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported by your browser. Try Chrome or Edge!");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInputText(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Application Assistant Chatbot Window"
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] h-[520px] max-h-[82vh] rounded-3xl glass-panel border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 opacity-100 translate-y-0"
    >
      {/* HEADER */}
      <div className="px-4 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center p-0.5 shadow-md">
            <WallERobot size={32} robotState={robotState} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
              <span>Application Assistant</span>
            </h3>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EVE Online Voice AI</span>
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center space-x-1">
          {/* Mute/Unmute Speech Output Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute EVE Voice" : "Mute EVE Voice"}
            aria-label={isMuted ? "Unmute EVE Voice" : "Mute EVE Voice"}
            className={`p-1.5 rounded-lg transition-colors ${
              isMuted ? "text-slate-500 hover:text-slate-300" : "text-cyan-400 hover:text-cyan-300"
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onMinimize}
            title="Minimize Chat"
            aria-label="Minimize Chat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Close Chat"
            aria-label="Close Chat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-xs">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Thinking State Indicator */}
        {isThinking && (
          <div className="flex items-center space-x-2 my-3 text-slate-400">
            <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <WallERobot size={24} robotState="thinking" />
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2">
              <span className="text-xs italic text-slate-400">EVE is thinking...</span>
              <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        {/* Suggested Questions Quick Action Chips */}
        {!isThinking && suggestedQuestions.length > 0 && (
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelectQuestion={handleChipSelect}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER INPUT FORM WITH SPEECH-TO-TEXT MIC BUTTON */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? "Listening... Speak now!" : "Ask EVE or click mic to speak..."}
          disabled={isThinking}
          aria-label="Chatbot input question"
          className={`flex-1 px-4 py-2.5 rounded-xl bg-slate-950/80 border text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
            isListening
              ? "border-rose-500/80 ring-2 ring-rose-500/30 text-rose-200"
              : "border-slate-800 focus:border-brand-500"
          }`}
        />

        {/* Voice Input Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={isThinking}
          title={isListening ? "Stop Listening" : "Speak to EVE"}
          aria-label={isListening ? "Stop Listening" : "Speak to EVE"}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? "bg-rose-600 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]"
              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Submit Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          aria-label="Send message"
          className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-brand-500 hover:to-indigo-500 transition-all shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
