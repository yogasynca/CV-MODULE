"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import {
  Shield,
  Users,
  HardDrive,
  Database,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  uploads_count: number;
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "user_001",
    name: "Manasa",
    email: "manasa@yogasync.ai",
    role: "admin",
    uploads_count: 14,
  },
  {
    id: "user_002",
    name: "Faizan",
    email: "faizan@yogasync.ai",
    role: "reviewer",
    uploads_count: 38,
  },
  {
    id: "user_003",
    name: "Nidhishree",
    email: "nidhishree@yogasync.ai",
    role: "reviewer",
    uploads_count: 29,
  },
  {
    id: "user_004",
    name: "Ifraaz",
    email: "ifraaz@yogasync.ai",
    role: "contributor",
    uploads_count: 64,
  },
  {
    id: "user_005",
    name: "Pavani",
    email: "pavani@yogasync.ai",
    role: "contributor",
    uploads_count: 52,
  },
];

export default function AdminPage() {
  const { role, switchDemoRole } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
    );
    setFeedback(`Updated role to ${newRole === "admin" ? "PROJECT MENTOR" : newRole === "contributor" ? "TEAM MEMBER" : "REVIEWER"} for user.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Permission Guard: Only Project Mentor (admin) can access this page
  if (role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto neo-card p-10 bg-white text-center space-y-5 my-12">
        <div className="w-16 h-16 mx-auto bg-[#191A23] rounded-2xl border-3 border-[#191A23] flex items-center justify-center shadow-[3px_3px_0px_#191A23]">
          <Shield className="w-8 h-8 text-[#B9FF66]" />
        </div>
        <div className="space-y-1.5">
          <span className="neo-badge bg-[#191A23] text-[#B9FF66] text-xs">MENTOR ONLY</span>
          <h2 className="font-extrabold text-2xl uppercase tracking-tight text-[#191A23]">
            Mentor Console Restricted
          </h2>
          <p className="text-sm text-neutral-600 font-medium max-w-md mx-auto">
            You are currently browsing as a <strong>{role === "contributor" ? "Team Member" : "Reviewer"}</strong>. Managing team roles and central storage permissions requires the Project Mentor role.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => switchDemoRole("admin")}
            className="neo-btn neo-btn-primary px-6 py-3 text-xs font-extrabold"
          >
            SWITCH TO PROJECT MENTOR ROLE →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="neo-card p-8 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23]">
            <Shield className="w-4 h-4" /> PROJECT MENTOR CONSOLE
          </div>
          <h1 className="font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#191A23]">
            Team & Dataset Management
          </h1>
          <p className="text-sm text-neutral-600 font-medium">
            Assign team member roles, manage Google Drive storage quotas, and audit dataset permissions.
          </p>
        </div>

        <span className="neo-badge bg-[#191A23] text-[#B9FF66] px-4 py-2 text-xs font-extrabold shrink-0">
          PROJECT MENTOR AUTHORIZED
        </span>
      </div>

      {feedback && (
        <div className="p-3.5 bg-[#B9FF66] text-[#191A23] rounded-xl border-2 border-[#191A23] font-bold text-xs shadow-[3px_3px_0px_#191A23]">
          {feedback}
        </div>
      )}

      {/* Team Member Role Assignment */}
      <div className="neo-card p-6 sm:p-7 bg-white space-y-5">
        <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
          <h2 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
            <Users className="w-5 h-5 text-[#191A23]" />
            TEAM ROSTER & ROLE ASSIGNMENTS
          </h2>
          <span className="text-xs text-neutral-500 font-bold">
            {team.length} ACTIVE MEMBERS
          </span>
        </div>

        <div className="divide-y-2 divide-[#191A23]/10">
          {team.map((member) => (
            <div
              key={member.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-extrabold text-sm text-[#191A23] uppercase">{member.name}</div>
                <div className="text-neutral-500 font-medium">{member.email}</div>
                <div className="text-[11px] text-neutral-600 mt-0.5 font-medium">
                  Submissions: <span className="font-bold text-[#191A23]">{member.uploads_count} files</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500 uppercase font-bold">Role:</span>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                  className="neo-input py-2 px-3 text-xs bg-[#F3F3F3] font-bold"
                >
                  <option value="contributor">TEAM MEMBER</option>
                  <option value="reviewer">REVIEWER</option>
                  <option value="admin">PROJECT MENTOR</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage & Quality Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="neo-card p-6 sm:p-7 bg-white space-y-3">
          <div className="font-extrabold text-lg uppercase flex items-center gap-2 border-b-2 border-[#191A23] pb-2 text-[#191A23]">
            <HardDrive className="w-5 h-5 text-[#191A23]" />
            CENTRAL STORAGE POOL
          </div>
          <p className="text-xs text-neutral-600 font-medium">
            Project Owner's Google One Account: <span className="font-bold text-[#191A23]">400 GB allocation</span>.
          </p>
          <div className="p-3.5 bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] text-xs space-y-1.5 shadow-[2px_2px_0px_#191A23]">
            <div className="flex justify-between font-medium">
              <span>Estimated Usage:</span>
              <span className="font-bold font-mono">~120 MB / 400 GB</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Drive Folders Created:</span>
              <span className="font-bold text-emerald-800">8 asana folders</span>
            </div>
          </div>
        </div>

        <div className="neo-card p-6 sm:p-7 bg-white space-y-3">
          <div className="font-extrabold text-lg uppercase flex items-center gap-2 border-b-2 border-[#191A23] pb-2 text-[#191A23]">
            <Database className="w-5 h-5 text-[#191A23]" />
            DATASET SCHEMA ACTIONS
          </div>
          <p className="text-xs text-neutral-600 font-medium">
            Export dataset manifest or sync local samples with central Google Drive.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => alert("Dataset manifest JSON generated.")}
              className="neo-btn neo-btn-primary py-2.5 px-4 text-xs font-bold"
            >
              SYNC MANIFEST →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
