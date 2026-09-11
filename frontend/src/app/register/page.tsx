"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { UserPlus, Mail, Lock, User as UserIcon, Shield, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CANDIDATE" | "ADMIN">("CANDIDATE");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // 1. Signup user
      await fetchApi("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      // 2. Automatically log in
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/login`, {
        method: "POST",
        body: formData,
      });

      if (!loginRes.ok) throw new Error("Account created, but automatic sign in failed.");

      const loginData = await loginRes.json();
      login(loginData.access_token, loginData.user);

      if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="glass-card p-8 rounded-3xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create your Account</h2>
          <p className="text-xs text-slate-400">Join METI Assessment Platform as Candidate or Evaluator</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@organization.org"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("CANDIDATE")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  role === "CANDIDATE"
                    ? "bg-brand-600/30 border-brand-500 text-white shadow-sm"
                    : "bg-slate-900/50 border-slate-800 text-slate-400"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Candidate / Student</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  role === "ADMIN"
                    ? "bg-cyan-600/30 border-cyan-500 text-cyan-200 shadow-sm"
                    : "bg-slate-900/50 border-slate-800 text-slate-400"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin / Evaluator</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-glow transition-all"
          >
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-brand-400 hover:underline font-semibold">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
