"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DatasetSample, DatasetStats } from "@/types";
import { INITIAL_POSES } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/ui/StatCard";
import DatasetHealth from "@/components/dashboard/DatasetHealth";
import TeamActivity from "@/components/dashboard/TeamActivity";
import {
  CheckCircle2,
  Clock,
  Database,
  FileVideo,
  FolderUp,
  Image as ImageIcon,
  Layers,
  Sparkles,
  XCircle,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function DashboardPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [recentSamples, setRecentSamples] = useState<DatasetSample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, samplesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/samples"),
      ]);

      const statsData = await statsRes.json();
      const samplesData = await samplesRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (samplesData.success) setRecentSamples(samplesData.samples);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalSamples = stats?.total_samples || 0;
  const totalImages = stats?.total_images || 0;
  const totalVideos = stats?.total_videos || 0;
  const totalApproved = stats?.total_approved || 0;
  const totalPending = stats?.total_pending || 0;
  const totalRejected = stats?.total_rejected || 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="neo-card p-8 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23]">
            <Sparkles className="w-4 h-4" /> TELEMETRY DASHBOARD
          </div>
          <h1 className="font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#191A23]">
            YogaSync Dataset Lab
          </h1>
          <p className="text-sm text-neutral-600 font-medium">
            Real-time biometric data collection, review triage, and Google Drive storage telemetry across 8 asanas.
          </p>
        </div>

        {role === "contributor" ? (
          <Link
            href="/upload"
            className="neo-btn neo-btn-primary px-6 py-3.5 text-sm font-extrabold flex items-center gap-2 shrink-0"
          >
            <FolderUp className="w-4 h-4" />
            + UPLOAD NEW SAMPLES
          </Link>
        ) : role === "reviewer" ? (
          <Link
            href="/review"
            className="neo-btn bg-[#191A23] text-white hover:bg-neutral-800 px-6 py-3.5 text-sm font-extrabold flex items-center gap-2 shrink-0 border-3 border-[#191A23] shadow-[3px_3px_0px_#191A23]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#B9FF66]" />
            GO TO REVIEW QUEUE ({totalPending} PENDING) →
          </Link>
        ) : (
          <Link
            href="/admin"
            className="neo-btn bg-[#FFE600] text-[#191A23] hover:bg-amber-400 px-6 py-3.5 text-sm font-extrabold flex items-center gap-2 shrink-0 border-3 border-[#191A23] shadow-[3px_3px_0px_#191A23]"
          >
            <Shield className="w-4 h-4 text-[#191A23]" />
            OPEN MENTOR CONSOLE →
          </Link>
        )}
      </div>

      {/* Top 6 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="TOTAL SAMPLES"
          value={totalSamples}
          icon={Layers}
          bgColor="bg-white"
        />
        <StatCard
          label="PHOTOS"
          value={totalImages}
          icon={ImageIcon}
          bgColor="bg-white"
        />
        <StatCard
          label="VIDEOS"
          value={totalVideos}
          icon={FileVideo}
          bgColor="bg-white"
        />
        <StatCard
          label="APPROVED"
          value={totalApproved}
          icon={CheckCircle2}
          bgColor="bg-[#B9FF66]"
        />
        <StatCard
          label="PENDING"
          value={totalPending}
          icon={Clock}
          bgColor="bg-white"
        />
        <StatCard
          label="REJECTED"
          value={totalRejected}
          icon={XCircle}
          bgColor="bg-white"
        />
      </div>

      {/* 8 Asana Cards Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
          <div>
            <h2 className="font-extrabold text-2xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
              <Database className="w-6 h-6 text-[#191A23]" />
              THE 8 CANONICAL ASANAS
            </h2>
            <p className="text-xs text-neutral-600 font-medium mt-0.5">
              Target goal: 400 verified samples per asana for training the YogaSync AI model.
            </p>
          </div>

          <Link href="/dataset" className="text-xs font-bold underline hover:text-[#191A23] flex items-center gap-1">
            VIEW TARGET AUDIT <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INITIAL_POSES.map((pose) => {
            const poseStat = stats?.pose_breakdown[pose.id];
            const sampleCount = poseStat?.total || 0;
            const approvedCount = poseStat?.approved || 0;
            const imagesCount = poseStat?.images || 0;
            const videosCount = poseStat?.videos || 0;

            return (
              <div
                key={pose.id}
                className="neo-card p-6 bg-white flex flex-col justify-between hover:bg-[#F8FFF0] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="neo-badge text-[10px] bg-[#F3F3F3] text-[#191A23]">
                      {pose.category}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-neutral-500">
                      ID: {pose.id}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xl uppercase leading-tight text-[#191A23]">
                    {pose.display_name}
                  </h3>
                  <div className="text-xs font-semibold text-neutral-500 mt-0.5">
                    {pose.sanskrit_name} ({pose.name})
                  </div>

                  {/* Sample Counters */}
                  <div className="mt-4 p-3.5 bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] font-mono text-xs space-y-1.5 shadow-[2px_2px_0px_#191A23]">
                    <div className="flex justify-between font-extrabold text-sm text-[#191A23] border-b border-[#191A23]/20 pb-1">
                      <span>TOTAL:</span>
                      <span>{sampleCount} SAMPLES</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 text-[11px] pt-0.5 font-medium">
                      <span>Media:</span>
                      <span className="font-bold text-[#191A23]">{imagesCount} img / {videosCount} vid</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-[#191A23]">Approved:</span>
                      <span className="text-emerald-700 bg-[#B9FF66]/50 px-1.5 py-0.5 rounded border border-[#191A23]/30">{approvedCount} verified</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t-2 border-[#191A23]/20">
                  {role === "contributor" ? (
                    <Link
                      href={`/upload?pose=${pose.id}`}
                      className="w-full neo-btn neo-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      COLLECT DATA →
                    </Link>
                  ) : role === "reviewer" ? (
                    <Link
                      href="/review"
                      className="w-full neo-btn bg-[#191A23] text-white hover:bg-neutral-800 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#191A23]"
                    >
                      AUDIT QUEUE →
                    </Link>
                  ) : (
                    <Link
                      href="/dataset"
                      className="w-full neo-btn bg-[#FFE600] text-[#191A23] hover:bg-amber-400 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#191A23]"
                    >
                      VIEW AUDIT →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dataset Health & Activity Grid */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <DatasetHealth stats={stats} />
          </div>
          <div className="lg:col-span-6">
            <TeamActivity recentSamples={recentSamples} />
          </div>
        </div>
      )}
    </div>
  );
}
