"use client";

import React from "react";
import WallERobot from "./WallERobot";
import { User as UserIcon } from "lucide-react";

export interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.sender === "bot";

  return (
    <div
      className={`flex items-start space-x-2.5 my-3 ${
        isBot ? "justify-start" : "justify-end flex-row-reverse space-x-reverse"
      }`}
    >
      {/* Sender Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isBot ? (
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-brand-500/30 flex items-center justify-center shadow-sm">
            <WallERobot size={28} robotState="idle" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Bubble Content */}
      <div
        className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
          isBot
            ? "bg-slate-900/90 text-slate-100 border border-slate-800 rounded-tl-none"
            : "bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <span
          className={`block text-[10px] mt-1.5 opacity-60 text-right font-mono ${
            isBot ? "text-slate-400" : "text-indigo-100"
          }`}
        >
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
