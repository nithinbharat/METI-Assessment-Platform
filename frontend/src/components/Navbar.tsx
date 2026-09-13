"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { Award, Shield, User as UserIcon, LogOut, LayoutDashboard, FileUp, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#080c14]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo - Always leads back to Home/Landing page */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              METI
            </span>
            <span className="text-xs uppercase tracking-widest text-brand-500 font-semibold block -mt-1">
              Assessment Platform
            </span>
          </div>
        </Link>

        {/* Role-Based Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>

          {user?.role === "ADMIN" ? (
            <>
              {/* Admin Exclusive Navigation */}
              <Link href="/admin" className="hover:text-white transition-colors flex items-center space-x-1.5 text-cyan-400 font-semibold">
                <Shield className="w-4 h-4" />
                <span>Admin Control Center</span>
              </Link>

              <Link href="/dashboard" className="hover:text-white transition-colors flex items-center space-x-1.5 text-slate-400">
                <LayoutDashboard className="w-4 h-4 text-brand-400" />
                <span>Candidate View</span>
              </Link>
            </>
          ) : user?.role === "CANDIDATE" ? (
            <>
              {/* Candidate Navigation */}
              <Link href="/dashboard" className="hover:text-white transition-colors flex items-center space-x-1.5">
                <LayoutDashboard className="w-4 h-4 text-brand-400" />
                <span>Dashboard</span>
              </Link>

              <Link href="/resume" className="hover:text-white transition-colors flex items-center space-x-1.5 text-indigo-300">
                <FileUp className="w-4 h-4 text-cyan-400" />
                <span>AI Resume Interview</span>
              </Link>
            </>
          ) : null}

          {/* Candidate / Admin Navigation items end */}
        </nav>

        {/* User Account Controls & Theme Switcher */}
        <div className="flex items-center space-x-3">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500 text-slate-300 hover:text-white transition-all"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-slate-200">{user.full_name}</span>
                <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                  user.role === "ADMIN" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => logout(true)}
                title="Sign Out & Return Home"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-glow transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
