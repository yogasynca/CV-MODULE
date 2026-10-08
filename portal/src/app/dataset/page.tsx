"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DatasetStats } from "@/types";
import { INITIAL_POSES } from "@/lib/constants";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  Database,
  Download,
  FolderUp,
} from "lucide-react";

export default function DatasetPage() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportJSON = () => {
    if (!stats) return;
    const jsonBlob = new Blob([JSON.stringify(stats, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yogasync_dataset_stats_v0.1.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="neo-card p-8 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23]">
            <Database className="w-4 h-4" /> ASANA TARGET ENGINE
          </div>
          <h1 className="font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#191A23]">
            8-Asana Pose Library
          </h1>
          <p className="text-sm text-neutral-600 font-medium max-w-xl">
            Audit collection density, target sample completion, and verified distribution across all 8 canonical yoga postures.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJSON}
            className="neo-btn bg-white px-5 py-3 text-xs font-bold flex items-center gap-1.5 text-[#191A23]"
          >
            <Download className="w-4 h-4" /> EXPORT MANIFEST
          </button>
          <Link
            href="/upload"
            className="neo-btn neo-btn-primary px-5 py-3 text-xs font-extrabold flex items-center gap-1.5"
          >
            <FolderUp className="w-4 h-4" /> + UPLOAD SAMPLES
          </Link>
        </div>
      </div>

      {/* 8 Asana Breakdown Grid */}
      <div className="space-y-6">
        {INITIAL_POSES.map((pose, index) => {
          const poseStat = stats?.pose_breakdown[pose.id];
          const total = poseStat?.total || 0;
          const target = pose.target_samples;
          const images = poseStat?.images || 0;
          const videos = poseStat?.videos || 0;
          const approved = poseStat?.approved || 0;
          const pending = poseStat?.pending || 0;
          const rejected = poseStat?.rejected || 0;

          return (
            <div key={pose.id} className="neo-card p-6 sm:p-7 bg-white space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#191A23]/20 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl border-3 border-[#191A23] bg-[#B9FF66] flex items-center justify-center font-extrabold text-xl shadow-[3px_3px_0px_#191A23] shrink-0 text-[#191A23]">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="neo-badge text-[10px] bg-[#F3F3F3] text-[#191A23]">
                        {pose.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-neutral-500">
                        ID: {pose.id}
                      </span>
                    </div>
                    <h2 className="font-extrabold text-2xl uppercase tracking-tight text-[#191A23] mt-1">
                      {pose.display_name}
                    </h2>
                    <div className="text-xs font-semibold text-neutral-600">
                      {pose.sanskrit_name} ({pose.name})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/upload?pose=${pose.id}`}
                    className="neo-btn neo-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    + UPLOAD {pose.id.toUpperCase()}
                  </Link>
                </div>
              </div>

              {/* Description & Target Progress Bar */}
              <div className="space-y-3">
                <p className="text-xs text-neutral-700 leading-relaxed max-w-3xl font-medium">
                  {pose.description}
                </p>

                <div className="bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] p-4 space-y-2 shadow-[2px_2px_0px_#191A23]">
                  <ProgressBar
                    value={total}
                    max={target}
                    label={`COLLECTION PROGRESS: ${total} OF ${target} TARGET SAMPLES`}
                    color="bg-[#B9FF66]"
                  />
                </div>
              </div>

              {/* Sub-counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
                <div className="p-3.5 rounded-xl border-2 border-[#191A23] bg-white shadow-[2px_2px_0px_#191A23]">
                  <div className="text-neutral-500 text-[10px] font-bold uppercase">IMAGES</div>
                  <div className="font-extrabold text-xl text-[#191A23] mt-0.5">{images}</div>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-[#191A23] bg-white shadow-[2px_2px_0px_#191A23]">
                  <div className="text-neutral-500 text-[10px] font-bold uppercase">VIDEOS</div>
                  <div className="font-extrabold text-xl text-[#191A23] mt-0.5">{videos}</div>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-[#191A23] bg-[#B9FF66]/30 shadow-[2px_2px_0px_#191A23]">
                  <div className="text-emerald-900 text-[10px] font-bold uppercase">APPROVED</div>
                  <div className="font-extrabold text-xl text-emerald-950 mt-0.5">{approved}</div>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-[#191A23] bg-[#FFE600]/30 shadow-[2px_2px_0px_#191A23]">
                  <div className="text-amber-900 text-[10px] font-bold uppercase">PENDING</div>
                  <div className="font-extrabold text-xl text-amber-950 mt-0.5">{pending}</div>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-[#191A23] bg-[#FF6B4A]/30 shadow-[2px_2px_0px_#191A23]">
                  <div className="text-red-900 text-[10px] font-bold uppercase">REJECTED</div>
                  <div className="font-extrabold text-xl text-red-950 mt-0.5">{rejected}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
