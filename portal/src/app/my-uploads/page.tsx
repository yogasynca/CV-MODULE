"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DatasetSample } from "@/types";
import { INITIAL_POSES } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import {
  Activity,
  ExternalLink,
  FileVideo,
  FolderUp,
  Image as ImageIcon,
  Search,
} from "lucide-react";

export default function MyUploadsPage() {
  const { profile } = useAuth();
  const [samples, setSamples] = useState<DatasetSample[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPose, setSelectedPose] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchSamples = async () => {
    try {
      const res = await fetch("/api/samples");
      const data = await res.json();
      if (data.success) {
        setSamples(data.samples);
      }
    } catch (err) {
      console.error("Failed to fetch samples:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const filteredSamples = samples.filter((sample) => {
    if (selectedPose !== "ALL" && sample.pose_id !== selectedPose) return false;
    if (selectedStatus !== "ALL" && sample.review_status !== selectedStatus) return false;
    if (selectedType !== "ALL" && sample.file_type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sample.file_name.toLowerCase().includes(q);
      const matchPose = sample.pose_id.toLowerCase().includes(q);
      const matchNotes = (sample.notes || "").toLowerCase().includes(q);
      if (!matchName && !matchPose && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="neo-card p-8 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23]">
            TEAM MEMBER TELEMETRY
          </div>
          <h1 className="font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#191A23]">
            My Submissions & Uploads
          </h1>
          <p className="text-sm text-neutral-600 font-medium">
            Audit and track the review status of your dataset samples across all 8 yoga asanas.
          </p>
        </div>

        <Link
          href="/upload"
          className="neo-btn neo-btn-primary px-6 py-3.5 text-sm font-extrabold flex items-center gap-2 shrink-0"
        >
          <FolderUp className="w-4 h-4" />
          + SUBMIT NEW SAMPLE
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="neo-card p-6 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Pose Filter */}
          <div>
            <label className="block font-bold text-[11px] uppercase mb-1.5 text-[#191A23]">POSE ASANA</label>
            <select
              value={selectedPose}
              onChange={(e) => setSelectedPose(e.target.value)}
              className="neo-input text-xs py-2 bg-white"
            >
              <option value="ALL">ALL 8 ASANAS</option>
              {INITIAL_POSES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name.toUpperCase()} ({p.id})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block font-bold text-[11px] uppercase mb-1.5 text-[#191A23]">REVIEW STATUS</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="neo-input text-xs py-2 bg-white"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Media Type Filter */}
          <div>
            <label className="block font-bold text-[11px] uppercase mb-1.5 text-[#191A23]">MEDIA TYPE</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="neo-input text-xs py-2 bg-white"
            >
              <option value="ALL">ALL TYPES (IMAGE & VIDEO)</option>
              <option value="image">IMAGES ONLY</option>
              <option value="video">VIDEOS ONLY</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block font-bold text-[11px] uppercase mb-1.5 text-[#191A23]">SEARCH FILENAME</label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="neo-input pl-9 py-2 text-xs bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-bold pt-3 border-t-2 border-[#191A23]/10 text-neutral-600">
          <span>SHOWING {filteredSamples.length} OF {samples.length} SAMPLES</span>
          {(selectedPose !== "ALL" || selectedStatus !== "ALL" || selectedType !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedPose("ALL");
                setSelectedStatus("ALL");
                setSelectedType("ALL");
                setSearchQuery("");
              }}
              className="underline font-bold text-[#191A23] hover:text-neutral-600"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Submissions Cards */}
      <div className="space-y-4">
        {filteredSamples.map((sample) => {
          const isVideo = sample.file_type === "video";
          const poseInfo = INITIAL_POSES.find((p) => p.id === sample.pose_id);

          return (
            <div
              key={sample.id}
              className="neo-card p-5 bg-white hover:bg-[#F8FFF0] transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
            >
              {/* Media Icon & Filename (5 cols) */}
              <div className="md:col-span-5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl border-2 border-[#191A23] bg-[#B9FF66] shadow-[2px_2px_0px_#191A23] flex items-center justify-center shrink-0">
                  {isVideo ? <FileVideo className="w-5 h-5 text-[#191A23]" /> : <ImageIcon className="w-5 h-5 text-[#191A23]" />}
                </div>
                <div className="overflow-hidden">
                  <div className="font-extrabold text-sm uppercase text-[#191A23] truncate">
                    {sample.file_name}
                  </div>
                  <div className="text-xs text-neutral-600 flex items-center gap-2 mt-0.5 font-mono">
                    <span>{(sample.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>•</span>
                    <span className="text-[#191A23] font-bold">v{sample.dataset_version}</span>
                  </div>
                </div>
              </div>

              {/* Asana (3 cols) */}
              <div className="md:col-span-3 text-xs">
                <div className="text-[10px] text-neutral-500 font-bold uppercase">ASANA:</div>
                <div className="font-extrabold text-sm uppercase text-[#191A23]">
                  {poseInfo?.display_name || sample.pose_id}
                </div>
                <div className="text-[11px] text-neutral-600 font-semibold">
                  {poseInfo?.sanskrit_name}
                </div>
              </div>

              {/* Date & Contributor (2 cols) */}
              <div className="md:col-span-2 text-xs text-neutral-600">
                <div className="text-[10px] text-neutral-500 font-bold uppercase">UPLOADED:</div>
                <div className="text-[#191A23] font-bold font-mono">
                  {new Date(sample.created_at).toLocaleDateString()}
                </div>
                <div className="text-[11px] truncate font-medium">
                  by {sample.contributor_name || "You"}
                </div>
              </div>

              {/* Status Badge & Actions (2 cols) */}
              <div className="md:col-span-2 flex flex-col items-start md:items-end gap-1.5 text-xs">
                <span
                  className={`neo-badge text-[10px] ${
                    sample.review_status === "APPROVED"
                      ? "neo-badge-approved"
                      : sample.review_status === "REJECTED"
                      ? "neo-badge-rejected"
                      : "neo-badge-pending"
                  }`}
                >
                  {sample.review_status}
                </span>

                {sample.rejection_reason && (
                  <div className="text-[10px] text-red-700 font-bold text-left md:text-right">
                    Reason: {sample.rejection_reason}
                  </div>
                )}

                {sample.gdrive_web_view_link && (
                  <a
                    href={sample.gdrive_web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#191A23] underline hover:text-neutral-600 font-bold text-[11px] flex items-center gap-1 mt-0.5"
                  >
                    Drive File <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {filteredSamples.length === 0 && (
          <div className="neo-card p-12 bg-white text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#B9FF66] rounded-2xl border-3 border-[#191A23] flex items-center justify-center shadow-[3px_3px_0px_#191A23]">
              <Activity className="w-8 h-8 text-[#191A23]" />
            </div>
            <h3 className="font-extrabold text-xl uppercase text-[#191A23]">NO MATCHING SUBMISSIONS FOUND</h3>
            <p className="text-sm text-neutral-600 max-w-sm mx-auto font-medium">
              No dataset samples match your current filter criteria.
            </p>
            <Link href="/upload" className="neo-btn neo-btn-primary px-6 py-3 text-xs font-extrabold inline-flex">
              + UPLOAD NEW SAMPLE
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
