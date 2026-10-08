import React from "react";
import { DatasetStats } from "@/types";
import ProgressBar from "@/components/ui/ProgressBar";
import { Activity } from "lucide-react";

interface DatasetHealthProps {
  stats: DatasetStats;
}

export default function DatasetHealth({ stats }: DatasetHealthProps) {
  const targetTotal = Object.values(stats.pose_breakdown).reduce((acc, p) => acc + p.target, 0) || 3200;
  const currentTotal = stats.total_samples;
  const healthPercent = Math.min(100, Math.round((stats.total_approved / (currentTotal || 1)) * 100));

  return (
    <div className="neo-card p-6 sm:p-7 bg-white space-y-6">
      <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
        <h3 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
          <Activity className="w-5 h-5 text-[#191A23]" />
          DATASET HEALTH & QUALITY
        </h3>
        <span className="neo-badge bg-[#B9FF66] text-[#191A23] text-[10px]">8 / 8 ACTIVE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Collection Progress */}
        <div className="bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] p-4 space-y-2 shadow-[2px_2px_0px_#191A23]">
          <div className="text-[11px] font-bold text-neutral-600 uppercase">
            TARGET PROGRESS
          </div>
          <div className="font-extrabold text-2xl text-[#191A23]">
            {currentTotal} <span className="text-xs text-neutral-500 font-mono">/ {targetTotal}</span>
          </div>
          <ProgressBar
            value={currentTotal}
            max={targetTotal}
            color="bg-[#B9FF66]"
            showPercent={false}
          />
        </div>

        {/* Approval Rate */}
        <div className="bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] p-4 space-y-2 shadow-[2px_2px_0px_#191A23]">
          <div className="text-[11px] font-bold text-neutral-600 uppercase">
            APPROVAL RATE
          </div>
          <div className="font-extrabold text-2xl text-emerald-700">
            {healthPercent}% <span className="text-xs text-[#191A23] font-mono">APPROVED</span>
          </div>
          <ProgressBar
            value={stats.total_approved}
            max={currentTotal || 1}
            color="bg-[#B9FF66]"
            showPercent={false}
          />
        </div>

        {/* Pending Triage Queue */}
        <div className="bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] p-4 space-y-2 shadow-[2px_2px_0px_#191A23]">
          <div className="text-[11px] font-bold text-neutral-600 uppercase">
            TRIAGE QUEUE
          </div>
          <div className="font-extrabold text-2xl text-[#191A23]">
            {stats.total_pending} <span className="text-xs text-neutral-600 font-mono">PENDING</span>
          </div>
          <ProgressBar
            value={stats.total_pending}
            max={currentTotal || 1}
            color="bg-[#FFE600]"
            showPercent={false}
          />
        </div>
      </div>
    </div>
  );
}
