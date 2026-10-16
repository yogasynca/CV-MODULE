"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import { useSearchParams } from "next/navigation";
import {
  HardDrive,
  RefreshCw,
  Settings,
  Shield,
  User,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";

function SettingsNotifications() {
  const searchParams = useSearchParams();
  const gdriveSuccess = searchParams.get("gdrive_success");
  const gdriveError = searchParams.get("gdrive_error");
  const token = searchParams.get("token");
  const [copied, setCopied] = useState(false);

  if (!gdriveSuccess && !gdriveError && !token) return null;

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {gdriveSuccess && (
        <div className="neo-card p-5 bg-[#B9FF66] text-[#191A23] border-3 border-[#191A23] shadow-[4px_4px_0px_#191A23] space-y-3">
          <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base">
            <CheckCircle2 className="w-5 h-5 text-[#191A23]" />
            GOOGLE DRIVE SUCCESSFULLY CONNECTED!
          </div>
          <p className="text-xs font-semibold text-[#191A23]/80">
            A new Google OAuth refresh token has been granted for the 400 GB storage.
          </p>
          {token && (
            <div className="bg-white p-3.5 rounded-xl border-2 border-[#191A23] shadow-[2px_2px_0px_#191A23] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600">
                <span>NEW REFRESH TOKEN (FOR VERCEL ENVIRONMENT VARIABLES):</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="neo-btn bg-[#B9FF66] text-[#191A23] px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "COPIED!" : "COPY TOKEN"}
                </button>
              </div>
              <div className="font-mono text-[10px] bg-[#F3F3F3] p-2 rounded border border-[#191A23]/20 break-all select-all text-neutral-800 font-bold">
                {token}
              </div>
              <p className="text-[10px] text-neutral-500 font-medium">
                💡 Paste this value as <strong className="font-mono text-[#191A23]">GDRIVE_REFRESH_TOKEN</strong> in your <strong>Vercel Project Dashboard → Settings → Environment Variables</strong> so uploads on Vercel persist directly into Google Drive!
              </p>
            </div>
          )}
        </div>
      )}

      {gdriveError && (
        <div className="neo-card p-5 bg-[#FF6B4A] text-white border-3 border-[#191A23] shadow-[4px_4px_0px_#191A23] space-y-2">
          <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5 text-white" />
            GOOGLE DRIVE CONNECTION FAILED
          </div>
          <p className="text-xs font-mono bg-black/20 p-2.5 rounded-lg border border-white/20">
            {gdriveError}
          </p>
        </div>
      )}
    </div>
  );
}

function SettingsContent() {
  const { profile, role, switchDemoRole } = useAuth();
  const [gdriveStatus, setGdriveStatus] = useState<any | null>(null);
  const [testingDrive, setTestingDrive] = useState(false);

  const fetchDriveStatus = async () => {
    setTestingDrive(true);
    try {
      const res = await fetch("/api/gdrive/test");
      const data = await res.json();
      setGdriveStatus(data);
    } catch (err: any) {
      setGdriveStatus({
        connected: false,
        message: `Error testing Google Drive: ${err.message || err}`,
      });
    } finally {
      setTestingDrive(false);
    }
  };

  useEffect(() => {
    fetchDriveStatus();
  }, []);

  const limitGB = gdriveStatus?.storageQuota?.limit
    ? (Number(gdriveStatus.storageQuota.limit) / (1024 * 1024 * 1024)).toFixed(0)
    : "400";
  const usageGB = gdriveStatus?.storageQuota?.usage
    ? (Number(gdriveStatus.storageQuota.usage) / (1024 * 1024 * 1024)).toFixed(2)
    : "0.00";
  const usagePercent = Math.min(100, Math.round((Number(usageGB) / Number(limitGB)) * 100));

  const isConnected = gdriveStatus?.connected === true;
  const isExpired = gdriveStatus?.tokenExpired === true;
  const needsSetup = gdriveStatus?.needsSetup === true || (!isConnected && !isExpired);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Param Feedback Notifications */}
      <Suspense fallback={null}>
        <SettingsNotifications />
      </Suspense>

      {/* Header */}
      <div className="neo-card p-8 bg-white">
        <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23] mb-2">
          <Settings className="w-4 h-4" /> SYSTEM & ACCOUNT SETTINGS
        </div>
        <h1 className="font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#191A23]">
          Workspace Configuration
        </h1>
        <p className="text-sm text-neutral-600 font-medium mt-1">
          Manage your team member profile, active roles, and central Google Drive storage synchronization.
        </p>
      </div>

      {/* Central Google Drive Storage Status Card */}
      <div className="neo-card p-6 sm:p-7 bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#191A23] pb-3 gap-2">
          <h2 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
            <HardDrive className="w-5 h-5 text-[#191A23]" />
            CENTRAL GOOGLE DRIVE STORAGE (400 GB)
          </h2>
          <div>
            {isConnected ? (
              <span className="neo-badge bg-[#B9FF66] text-[#191A23] text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> LIVE CONNECTED
              </span>
            ) : isExpired ? (
              <span className="neo-badge bg-[#FFE600] text-[#191A23] text-[10px] flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> TOKEN EXPIRED (7-DAY LIMIT)
              </span>
            ) : (
              <span className="neo-badge bg-[#FF6B4A] text-white text-[10px] flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> NOT CONNECTED
              </span>
            )}
          </div>
        </div>

        {/* Status Message Box */}
        {isConnected ? (
          <div className="p-5 rounded-2xl bg-[#F3F3F3] border-2 border-[#191A23] space-y-4 text-xs shadow-[2px_2px_0px_#191A23]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#191A23]/15 pb-3">
              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase">ACCOUNT OWNER</div>
                <div className="font-extrabold text-base text-[#191A23]">
                  {gdriveStatus?.user?.displayName || "THANSEEF TRIO"}
                </div>
                {gdriveStatus?.user?.emailAddress && (
                  <div className="text-[11px] font-mono text-neutral-600">
                    {gdriveStatus.user.emailAddress}
                  </div>
                )}
              </div>
              <div className="sm:text-right">
                <div className="text-[10px] font-bold text-neutral-500 uppercase">STORAGE PLAN</div>
                <div className="font-extrabold text-base text-emerald-800">400 GB GOOGLE ONE</div>
              </div>
            </div>

            {/* Live Storage Meter */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-[#191A23]">
                <span>STORAGE USAGE:</span>
                <span className="font-mono">{usageGB} GB / {limitGB} GB ({usagePercent}%)</span>
              </div>
              <ProgressBar value={Number(usageGB)} max={Number(limitGB)} color="bg-[#B9FF66]" showPercent={false} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] font-medium text-neutral-600">
              <span>Root Folder: <strong className="text-[#191A23] font-mono">YogaSync-Dataset/</strong></span>
              <div className="flex items-center gap-3">
                <a
                  href="/api/gdrive/auth"
                  className="neo-btn bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#191A23] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Re-Authorize
                </a>
                <button
                  type="button"
                  onClick={fetchDriveStatus}
                  disabled={testingDrive}
                  className="text-[#191A23] underline font-bold hover:text-neutral-600 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${testingDrive ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#FFF5F2] border-2 border-[#191A23] space-y-4 text-xs shadow-[2px_2px_0px_#191A23]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B4A] text-white border-2 border-[#191A23] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#191A23]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-extrabold text-sm text-[#191A23] uppercase">
                  {isExpired ? "OAuth Refresh Token Expired" : "Google Drive Not Connected"}
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  {gdriveStatus?.message || "Google Drive credentials must be authorized to enable live cloud storage for dataset uploads."}
                </p>
                {isExpired && (
                  <p className="text-[11px] text-neutral-500 font-medium pt-1">
                    ℹ️ <strong>Why did this happen?</strong> Google Cloud projects in <em>&quot;Testing&quot;</em> publishing mode automatically expire refresh tokens after 7 days. Reconnecting generates a fresh token. To make tokens permanent, switch your OAuth app to <em>&quot;In production&quot;</em> in Google Cloud Console.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="/api/gdrive/auth"
                className="neo-btn neo-btn-primary px-5 py-3 text-xs font-extrabold flex items-center gap-2 shadow-[3px_3px_0px_#191A23]"
              >
                <KeyRound className="w-4 h-4" />
                ⚡ CONNECT / RECONNECT GOOGLE DRIVE (1-CLICK)
              </a>

              <button
                type="button"
                onClick={fetchDriveStatus}
                disabled={testingDrive}
                className="neo-btn bg-white px-4 py-3 text-xs font-bold text-[#191A23] flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingDrive ? "animate-spin" : ""}`} />
                Check Status
              </button>
            </div>
          </div>
        )}

        {/* Vercel Environment Variables Instruction Guide */}
        <div className="p-4 rounded-xl border border-neutral-300 bg-[#FAFAFA] text-xs space-y-2">
          <div className="font-extrabold text-[#191A23] uppercase text-[11px] flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-[#191A23]" />
            HOSTING ON VERCEL (cv-module-ten.vercel.app)?
          </div>
          <p className="text-[11px] text-neutral-600 font-medium">
            For files uploaded on Vercel to reach Google Drive, add these environment variables in your <strong>Vercel Project Dashboard → Settings → Environment Variables</strong>:
          </p>
          <div className="font-mono text-[11px] space-y-1 bg-white p-2.5 rounded-lg border border-neutral-200">
            <div><strong>GDRIVE_CLIENT_ID</strong> = <span className="text-neutral-500">Your Google OAuth Client ID</span></div>
            <div><strong>GDRIVE_CLIENT_SECRET</strong> = <span className="text-neutral-500">Your Google OAuth Client Secret</span></div>
            <div><strong>GDRIVE_REFRESH_TOKEN</strong> = <span className="text-neutral-500">Your OAuth Refresh Token (Obtained when you click Connect)</span></div>
          </div>
        </div>
      </div>

      {/* Account Profile Card */}
      <div className="neo-card p-6 sm:p-7 bg-white space-y-5">
        <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
          <h2 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
            <User className="w-5 h-5 text-[#191A23]" />
            TEAM MEMBER PROFILE
          </h2>
          <span className="neo-badge bg-[#B9FF66] text-[#191A23] uppercase text-[10px]">
            {role === "admin" ? "Project Mentor" : role === "contributor" ? "Team Member" : role}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border-2 border-[#191A23] bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]">
            <div className="text-neutral-500 font-bold text-[10px] uppercase">FULL NAME:</div>
            <div className="font-extrabold text-sm text-[#191A23] mt-0.5">{profile?.full_name || "Team Member"}</div>
          </div>
          <div className="p-4 rounded-xl border-2 border-[#191A23] bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]">
            <div className="text-neutral-500 font-bold text-[10px] uppercase">EMAIL ADDRESS:</div>
            <div className="font-extrabold text-sm text-[#191A23] mt-0.5">{profile?.email || "teammate@yogasync.ai"}</div>
          </div>
          <div className="p-4 rounded-xl border-2 border-[#191A23] bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]">
            <div className="text-neutral-500 font-bold text-[10px] uppercase">SYSTEM USER ID:</div>
            <div className="font-bold text-neutral-800 truncate mt-0.5 font-mono">{profile?.id || "demo_user"}</div>
          </div>
          <div className="p-4 rounded-xl border-2 border-[#191A23] bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]">
            <div className="text-neutral-500 font-bold text-[10px] uppercase">ROLE PERMISSION:</div>
            <div className="font-extrabold text-[#191A23] uppercase mt-0.5">
              {role === "admin" ? "Project Mentor" : role === "contributor" ? "Team Member" : role}
            </div>
          </div>
        </div>
      </div>

      {/* Role Switcher Sandbox */}
      <div className="neo-card p-6 sm:p-7 bg-white space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
          <h2 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
            <Shield className="w-5 h-5 text-[#191A23]" />
            TEST ROLE SWITCHER (DEVELOPMENT MODE)
          </h2>
          <span className="neo-badge bg-[#B9FF66] text-[#191A23] text-[10px]">HOT SWAP</span>
        </div>
        <p className="text-xs text-neutral-600 font-medium">
          Switch roles on the fly to test team member, reviewer, and mentor capabilities:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["contributor", "reviewer", "admin"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => switchDemoRole(r)}
              className={`p-4 rounded-2xl border-3 border-[#191A23] text-left transition-all ${
                role === r
                  ? "bg-[#B9FF66] shadow-[4px_4px_0px_#191A23] -translate-y-1"
                  : "bg-white hover:bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]"
              }`}
            >
              <div className="font-extrabold text-sm uppercase text-[#191A23]">
                {r === "admin" ? "Project Mentor" : r === "contributor" ? "Team Member" : "Reviewer"}
              </div>
              <div className="text-[11px] text-neutral-600 mt-1 font-medium">
                {r === "admin"
                  ? "Manage roles & storage"
                  : r === "reviewer"
                  ? "Approve/reject submissions"
                  : "Upload and view own data"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-medium">Loading Workspace Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
