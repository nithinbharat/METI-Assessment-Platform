"use client";

import React from "react";

export type RobotState =
  | "idle"
  | "noticed"
  | "hover"
  | "click"
  | "chat_open"
  | "thinking"
  | "answering";

interface WallERobotProps {
  eyeOffset?: { x: number; y: number };
  headRotation?: number; // angle in degrees
  robotState?: RobotState;
  className?: string;
  size?: number;
}

/**
 * Ultra-Realistic 3D-Rendered EVE Virtual Assistant Vector Avatar
 */
export default function WallERobot({
  eyeOffset = { x: 0, y: 0 },
  headRotation = 0,
  robotState = "idle",
  className = "",
  size = 72,
}: WallERobotProps) {
  // Clamp eye offset within safe optical range
  const pupilX = Math.max(-3.5, Math.min(3.5, eyeOffset.x));
  const pupilY = Math.max(-2.5, Math.min(2.5, eyeOffset.y));

  // Determine state postures
  const isIdle = robotState === "idle";
  const isNoticed = robotState === "noticed";
  const isHover = robotState === "hover";
  const isClick = robotState === "click";
  const isChatOpen = robotState === "chat_open";
  const isThinking = robotState === "thinking";
  const isAnswering = robotState === "answering";

  const isWaving = isHover || isNoticed;
  const isAttentive = isChatOpen || isAnswering;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        isClick ? "animate-wall-e-click" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full transition-transform duration-300 ${
          isIdle ? "animate-wall-e-bob" : ""
        } ${isNoticed ? "scale-105" : ""}`}
      >
        <defs>
          {/* 3D Glossy White Body Hull Gradient */}
          <linearGradient id="eveBody3D" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F8FAFC" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* 3D Spherical Head Gradient */}
          <radialGradient id="eveHead3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F1F5F9" />
            <stop offset="80%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </radialGradient>

          {/* Curved Glass Visor 3D Gradient */}
          <radialGradient id="eveVisor3D" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="35%" stopColor="#0F172A" />
            <stop offset="80%" stopColor="#020617" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Specular Highlight Glare Gradient */}
          <linearGradient id="visorGlareGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Blue Eye Emission Aura Filter */}
          <filter id="eyeGlow3D" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.22  0 0 0 0 0.74  0 0 0 0 0.97  0 0 0 1 0"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Head Cast Shadow on Body */}
          <filter id="headCastShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="1.8" floodColor="#0F172A" floodOpacity="0.5" />
          </filter>

          {/* Anti-Gravity Energy Aura Filter */}
          <filter id="auraGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g>
          {/* ================= 1. ANTI-GRAVITY HOVER AURA & AMBIENT SHADOW ================= */}
          {/* Soft Ground Contact Shadow */}
          <ellipse cx="50" cy="90" rx="16" ry="2.5" fill="#020617" opacity="0.35" filter="blur(1.5px)" />
          {/* Glowing Cyan Hover Energy Ring */}
          <ellipse
            cx="50"
            cy="88"
            rx={isThinking ? "19" : "15"}
            ry="3.5"
            fill="#38BDF8"
            opacity={isThinking ? "0.85" : "0.5"}
            className={isThinking ? "animate-pulse" : "transition-opacity duration-300"}
            filter="url(#auraGlow)"
          />

          {/* ================= 2. AERODYNAMIC 3D BODY HULL ================= */}
          <g id="eve-3d-body">
            {/* Main White Metallic Body Shell */}
            <path
              d="M32 44 C32 40 40 38 50 38 C60 38 68 40 68 44 C71 58 64 78 50 82 C36 78 29 58 32 44 Z"
              fill="url(#eveBody3D)"
              stroke="#64748B"
              strokeWidth="0.5"
            />
            {/* Body Left Rim Light Highlight */}
            <path
              d="M32.5 45 C30.5 58 36.5 76 49.5 81.5 C36 77 30.5 58 32.5 45 Z"
              fill="#FFFFFF"
              opacity="0.6"
            />
            {/* Body Right Ambient Shadow */}
            <path
              d="M67.5 45 C69.5 58 63.5 76 50.5 81.5 C64 77 69.5 58 67.5 45 Z"
              fill="#475569"
              opacity="0.25"
            />
            {/* Subtle Horizontal Armor Contour Lines */}
            <path
              d="M38 68 C44 71 56 71 62 68"
              stroke="#94A3B8"
              strokeWidth="0.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </g>

          {/* ================= 3. SLIM FUTURISTIC ROBOTIC ARMS ================= */}
          {/* Left Arm */}
          <g id="eve-3d-left-arm">
            {/* Arm Shell */}
            <path
              d={
                isAttentive
                  ? "M28 47 C23 53 21 60 24 64 C26 65 28 63 29 58 C30 54 29 48 28 47 Z"
                  : "M29 46 C24 54 23 64 25 68 C27 69 29 67 30 60 C31 54 29 47 29 46 Z"
              }
              fill="url(#eveBody3D)"
              stroke="#64748B"
              strokeWidth="0.5"
            />
            {/* Magnetic Joint Gap */}
            <path d="M28 47 L30 48" stroke="#334155" strokeWidth="1" />
          </g>

          {/* Right Arm (Waving / Interactive) */}
          <g
            id="eve-3d-right-arm"
            className={isWaving ? "animate-wall-e-wave origin-[71px_46px]" : "transition-all duration-300"}
          >
            <path
              d={
                isWaving
                  ? "M71 46 C78 40 85 33 83 29 C81 28 77 31 73 37 C71 41 70 45 71 46 Z"
                  : isAttentive
                  ? "M72 47 C77 53 79 60 76 64 C74 65 72 63 71 58 C70 54 71 48 72 47 Z"
                  : "M71 46 C76 54 77 64 75 68 C73 69 71 67 70 60 C69 54 71 47 71 46 Z"
              }
              fill="url(#eveBody3D)"
              stroke="#64748B"
              strokeWidth="0.5"
            />
            {/* Magnetic Joint Gap */}
            <path d="M71 46 L73 47" stroke="#334155" strokeWidth="1" />
          </g>

          {/* ================= 4. SPHERICAL HEAD ASSEMBLY (FLOATING & TRACKING) ================= */}
          <g
            id="eve-3d-head-assembly"
            filter="url(#headCastShadow)"
            className={isThinking ? "animate-wall-e-thinking origin-[50px_24px]" : ""}
            style={{
              transform: isThinking ? undefined : `rotate(${headRotation}deg)`,
              transformOrigin: "50px 24px",
              transition: "transform 0.15s ease-out",
            }}
          >
            {/* Outer White Spherical Head Shell */}
            <ellipse
              cx="50"
              cy="24"
              rx="24"
              ry="18"
              fill="url(#eveHead3D)"
              stroke="#64748B"
              strokeWidth="0.5"
            />

            {/* Top Curved Specular Highlight Arc */}
            <path
              d="M31 16 C38 9 62 9 69 16 C61 12 39 12 31 16 Z"
              fill="url(#visorGlareGrad)"
            />

            {/* Glossy Black Visor Screen */}
            <ellipse
              cx="50"
              cy="25"
              rx="18.5"
              ry="12.5"
              fill="url(#eveVisor3D)"
              stroke="#1E293B"
              strokeWidth="0.6"
            />

            {/* Curved Visor Glass Reflection */}
            <path
              d="M34.5 19.5 C41.5 15.5 58.5 15.5 65.5 19.5 C58.5 17.5 41.5 17.5 34.5 19.5 Z"
              fill="url(#visorGlareGrad)"
            />

            {/* ================= 5. DYNAMIC 3D GLOWING CYAN EYES ================= */}
            <g
              id="eve-3d-eyes"
              className={isIdle ? "animate-wall-e-blink origin-[50px_25px]" : ""}
            >
              {/* Left Eye Base Glow */}
              <ellipse
                cx={40.5 + pupilX}
                cy={25 + (isThinking ? -1.5 : pupilY)}
                rx={isWaving ? "4.8" : "4.2"}
                ry={isWaving ? "3.8" : "5.2"}
                fill="#38BDF8"
                filter="url(#eyeGlow3D)"
              />
              {/* Left Eye Bright Center */}
              <ellipse
                cx={40.5 + pupilX}
                cy={25 + (isThinking ? -1.5 : pupilY)}
                rx={isWaving ? "3.2" : "2.8"}
                ry={isWaving ? "2.4" : "3.6"}
                fill="#E0F2FE"
              />
              {/* Left Eye Catchlight Specular Dot */}
              <circle
                cx={39 + pupilX}
                cy={23 + (isThinking ? -1.5 : pupilY)}
                r="1"
                fill="#FFFFFF"
              />

              {/* Right Eye Base Glow */}
              <ellipse
                cx={59.5 + pupilX}
                cy={25 + (isThinking ? -1.5 : pupilY)}
                rx={isWaving ? "4.8" : "4.2"}
                ry={isWaving ? "3.8" : "5.2"}
                fill="#38BDF8"
                filter="url(#eyeGlow3D)"
              />
              {/* Right Eye Bright Center */}
              <ellipse
                cx={59.5 + pupilX}
                cy={25 + (isThinking ? -1.5 : pupilY)}
                rx={isWaving ? "3.2" : "2.8"}
                ry={isWaving ? "2.4" : "3.6"}
                fill="#E0F2FE"
              />
              {/* Right Eye Catchlight Specular Dot */}
              <circle
                cx={58 + pupilX}
                cy={23 + (isThinking ? -1.5 : pupilY)}
                r="1"
                fill="#FFFFFF"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
