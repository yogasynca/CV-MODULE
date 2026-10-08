"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import {
  ArrowRight,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  Mail,
  User,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRoleDestination = (role: UserRole) => {
    switch (role) {
      case "reviewer":
        return "/review";
      case "admin":
        return "/admin";
      case "contributor":
      default:
        return "/upload";
    }
  };

  const handleLogin = async (userKey: string, pass: string) => {
    setLoading(true);
    setErrorMsg(null);
    const res = await signIn(userKey, pass);
    if (res.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      const lower = userKey.toLowerCase();
      const role: UserRole = lower.includes("manasa")
        ? "admin"
        : lower.includes("faizan") || lower.includes("nidhi")
        ? "reviewer"
        : "contributor";
      router.push(getRoleDestination(role));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8">
      {/* Brand & Gate Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl border-3 border-[#191A23] bg-white shadow-[4px_4px_0px_#191A23] flex items-center justify-center p-2">
          <Image
            src="/logo.png"
            alt="YogaSync Emblem"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23] mb-2">
            <Sparkles className="w-3.5 h-3.5" /> SECURE DATASET PORTAL
          </div>
          <h1 className="font-black text-3xl uppercase tracking-tight text-[#191A23]">
            YogaSync AI
          </h1>
          <p className="text-xs text-neutral-600 font-bold mt-1 max-w-xs mx-auto">
            Please enter your assigned team username and password to unlock the workspace.
          </p>
        </div>
      </div>

      {/* Gated Login Form */}
      <form onSubmit={handleSubmit} className="neo-card p-8 bg-white space-y-5">
        <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
          <h2 className="font-extrabold text-base tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
            <ShieldCheck className="w-5 h-5 text-[#191A23]" />
            MEMBER AUTHENTICATION
          </h2>
          <span className="neo-badge bg-[#191A23] text-[#B9FF66] text-[9px]">
            REQUIRED
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#FF6B4A] text-white rounded-xl border-2 border-[#191A23] font-bold text-xs shadow-[2px_2px_0px_#191A23]">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block font-black text-xs uppercase tracking-wider mb-1.5 text-[#191A23]">
            USERNAME
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="neo-input pl-10 text-sm"
              required
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block font-black text-xs uppercase tracking-wider mb-1.5 text-[#191A23]">
            PASSWORD
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="neo-input pl-10 text-sm"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full neo-btn neo-btn-primary py-4 text-sm font-black flex items-center justify-center gap-2 mt-3 cursor-pointer"
        >
          {loading ? "VERIFYING CREDENTIALS..." : "ENTER WORKSPACE →"}
        </button>

        {/* Security / System Badges */}
        <div className="pt-2 border-t-2 border-[#191A23]/10 flex flex-col items-center gap-1.5 text-[11px] text-neutral-500 font-semibold text-center">
          <div className="flex items-center gap-2 font-bold text-neutral-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>400 GB Central Cloud Storage Connected</span>
          </div>
          <div>Role-Based Access Control Enabled</div>
        </div>
      </form>
    </div>
  );
}
