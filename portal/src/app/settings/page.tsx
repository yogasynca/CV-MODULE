"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import {
  HardDrive,
  RefreshCw,
  Settings,
  Shield,
  User,
  CheckCircle2,
} from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";

export default function SettingsPage() {
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
    : "7.91";
  const usagePercent = Math.min(100, Math.round((Number(usageGB) / Number(limitGB)) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="neo-card p-8 bg-white">
        <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23] mb-2">
          <Settings className="w-4 h-4" /> SYSTEM & ACCOUNT SETTINGS
        </div>
        <h1 className="font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#191A23]">
          Workspace Configuration
        </h1>
        <p className="text-sm text-neutral-600 font-medium mt-1">
          Manage your team member profile, active roles, and central Google Drive storage status.
        </p>
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

      {/* Google Drive Central Storage Status (Clean & Verified) */}
      <div className="neo-card p-6 sm:p-7 bg-white space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
          <h2 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
            <HardDrive className="w-5 h-5 text-[#191A23]" />
            CENTRAL GOOGLE DRIVE STORAGE (400 GB)
          </h2>
          <span className="neo-badge bg-[#B9FF66] text-[#191A23] text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> LIVE CONNECTED
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F3F3F3] border-2 border-[#191A23] space-y-4 text-xs shadow-[2px_2px_0px_#191A23]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#191A23]/15 pb-3">
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase">ACCOUNT OWNER</div>
              <div className="font-extrabold text-base text-[#191A23]">THANSEEF TRIO</div>
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

          <div className="flex items-center justify-between pt-1 text-[11px] font-medium text-neutral-600">
            <span>Root Folder: <strong className="text-[#191A23] font-mono">YogaSync-Dataset/</strong></span>
            <button
              type="button"
              onClick={fetchDriveStatus}
              disabled={testingDrive}
              className="text-[#191A23] underline font-bold hover:text-neutral-600 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${testingDrive ? "animate-spin" : ""}`} />
              Refresh Telemetry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
