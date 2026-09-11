"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import WallERobot, { RobotState } from "./WallERobot";

interface ChatbotButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  robotState: RobotState;
  setRobotState: (state: RobotState) => void;
}

const PROXIMITY_RADIUS = 150; // pixels (120px-160px zone)

export default function ChatbotButton({
  isOpen,
  onToggle,
  robotState,
  setRobotState,
}: ChatbotButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headRotation, setHeadRotation] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Smooth lerp tracking state targets
  const targetEyeRef = useRef({ x: 0, y: 0 });
  const targetHeadRef = useRef(0);
  const currentEyeRef = useRef({ x: 0, y: 0 });
  const currentHeadRef = useRef(0);

  // Proximity mouse tracking callback using requestAnimationFrame & Lerp
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isOpen || !buttonRef.current) return;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      animFrameRef.current = requestAnimationFrame(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < PROXIMITY_RADIUS) {
          // Calculate clamped target offsets
          const maxEyeX = 3.5;
          const maxEyeY = 2.5;
          targetEyeRef.current = {
            x: (deltaX / PROXIMITY_RADIUS) * maxEyeX,
            y: (deltaY / PROXIMITY_RADIUS) * maxEyeY,
          };
          targetHeadRef.current = Math.max(-10, Math.min(10, (deltaX / PROXIMITY_RADIUS) * 10));

          // Smooth lerp interpolation (factor 0.2)
          currentEyeRef.current = {
            x: currentEyeRef.current.x + (targetEyeRef.current.x - currentEyeRef.current.x) * 0.2,
            y: currentEyeRef.current.y + (targetEyeRef.current.y - currentEyeRef.current.y) * 0.2,
          };
          currentHeadRef.current =
            currentHeadRef.current + (targetHeadRef.current - currentHeadRef.current) * 0.2;

          setEyeOffset({ ...currentEyeRef.current });
          setHeadRotation(currentHeadRef.current);

          if (distance < rect.width / 2 + 15) {
            setRobotState("hover");
          } else {
            setRobotState("noticed");
          }

          if (!hasInteracted && !showTooltip) {
            setShowTooltip(true);
          }
        } else {
          // Return smoothly to 0
          targetEyeRef.current = { x: 0, y: 0 };
          targetHeadRef.current = 0;

          currentEyeRef.current = {
            x: currentEyeRef.current.x * 0.8,
            y: currentEyeRef.current.y * 0.8,
          };
          currentHeadRef.current = currentHeadRef.current * 0.8;

          setEyeOffset({ ...currentEyeRef.current });
          setHeadRotation(currentHeadRef.current);

          if (robotState !== "idle" && robotState !== "click" && !isOpen) {
            setRobotState("idle");
          }
        }
      });
    },
    [isOpen, robotState, setRobotState, hasInteracted, showTooltip]
  );

  // Attach controlled passive mousemove listener
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [handleMouseMove]);

  const handleClick = () => {
    setHasInteracted(true);
    setShowTooltip(false);

    // Trigger excited CLICK state animation before opening chat
    setRobotState("click");
    setTimeout(() => {
      onToggle();
    }, 200);
  };

  return (
    <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 flex flex-col items-end">
      {/* Premium Glass Proximity Tooltip */}
      {showTooltip && !isOpen && (
        <div className="mb-2.5 px-3.5 py-1.5 rounded-xl bg-slate-950/95 border border-cyan-500/40 text-xs text-white shadow-[0_0_20px_rgba(56,189,248,0.25)] backdrop-blur-md animate-bounce">
          <span>Need help? Ask EVE! 👋</span>
        </div>
      )}

      {/* Floating 3D EVE Circular Container */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={() => {
          setRobotState("hover");
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          if (!isOpen && robotState !== "click") setRobotState("idle");
        }}
        aria-label="Open Application Assistant Chatbot"
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950/85 border-2 border-brand-500/60 hover:border-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] backdrop-blur-md hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-cyan-500/40"
      >
        <WallERobot
          size={56}
          eyeOffset={eyeOffset}
          headRotation={headRotation}
          robotState={isOpen ? "chat_open" : robotState}
        />
      </button>
    </div>
  );
}

