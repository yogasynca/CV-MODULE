"use client";

import React, { useEffect, useState } from "react";
import { DatasetSample } from "@/types";
import { INITIAL_POSES } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import ReviewCard from "@/components/review/ReviewCard";
import {
  CheckCircle2,
  Filter,
  ShieldCheck,
  Lock,
  ArrowRight,
  FolderUp,
} from "lucide-react";
import Link from "next/link";

export default function ReviewQueuePage() {
  const { profile, role, switchDemoRole } = useAuth();
  const [samples, setSamples] = useState<DatasetSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [selectedPose, setSelectedPose] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const fetchSamples = async () => {
    try {
      const res = await fetch("/api/samples");
      const data = await res.json();
      if (data.success) {
        setSamples(data.samples);
      }
    } catch (err) {
      console.error("Failed to load review queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const handleReview = async (
    sampleId: string,
    status: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    try {
      const res = await fetch(`/api/samples/${sampleId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewer_id: profile?.id || "demo_reviewer_001",
          reviewer_name: profile?.full_name || "Dr. Priya Patel (Reviewer)",
          rejection_reason: reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSamples((prev) =>
          prev.map((s) => (s.id === sampleId ? data.sample : s))
        );
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  // Permission Guard: Team Members (contributors) cannot review
  if (role === "contributor") {
    return (
      <div className="max-w-3xl mx-auto neo-card p-10 bg-white text-center space-y-5 my-12">
        <div className="w-16 h-16 mx-auto bg-[#FFE600] rounded-2xl border-3 border-[#191A23] flex items-center justify-center shadow-[3px_3px_0px_#191A23]">
          <Lock className="w-8 h-8 text-[#191A23]" />
        </div>
        <div className="space-y-1.5">
          <span className="neo-badge bg-[#F3F3F3] text-[#191A23] text-xs">ROLE RESTRICTION</span>
          <h2 className="font-extrabold text-2xl uppercase tracking-tight text-[#191A23]">
            Review Queue Restricted to Reviewers & Mentors
          </h2>
          <p className="text-sm text-neutral-600 font-medium max-w-md mx-auto">
            You are currently logged in as a <strong>Team Member</strong>. Team members can upload dataset media and track their submissions, but approving or rejecting submissions is restricted to Reviewers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => switchDemoRole("reviewer")}
            className="neo-btn neo-btn-primary px-6 py-3 text-xs font-extrabold flex items-center gap-1.5"
          >
            SWITCH TO REVIEWER ROLE <ArrowRight className="w-4 h-4" />
          </button>
          <Link href="/upload" className="neo-btn bg-white px-6 py-3 text-xs font-bold text-[#191A23] flex items-center gap-1.5">
            <FolderUp className="w-4 h-4" /> Go to Upload Station
          </Link>
        </div>
      </div>
    );
  }

  const filteredSamples = samples.filter((sample) => {
    if (selectedStatus !== "ALL" && sample.review_status !== selectedStatus) return false;
    if (selectedPose !== "ALL" && sample.pose_id !== selectedPose) return false;
    return true;
  });

  const currentSample = filteredSamples[currentIndex] || filteredSamples[0];

  const handleNext = () => {
    if (currentIndex < filteredSamples.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="neo-card p-8 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23]">
            <ShieldCheck className="w-4 h-4" /> REVIEWER & AUDIT CONSOLE
          </div>
          <h1 className="font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#191A23]">
            Data Review Lab
          </h1>
          <p className="text-sm text-neutral-600 font-medium max-w-xl">
            Audit biomechanical quality, verify correct 8-asana alignment, and approve or reject samples before model ingestion.
          </p>
        </div>

        <div className="bg-[#F3F3F3] rounded-2xl border-3 border-[#191A23] p-4 text-xs font-bold shadow-[4px_4px_0px_#191A23] shrink-0">
          <div className="text-[10px] text-neutral-500 uppercase">PENDING IN QUEUE</div>
          <div className="text-2xl font-extrabold text-[#191A23]">
            {samples.filter((s) => s.review_status === "PENDING").length} SAMPLES
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="neo-card p-5 bg-white flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-extrabold flex items-center gap-1.5 text-[#191A23] uppercase">
            <Filter className="w-4 h-4" /> STATUS:
          </span>
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatus(st);
                setCurrentIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl border-2 border-[#191A23] font-bold uppercase transition-all shadow-[2px_2px_0px_#191A23] ${
                selectedStatus === st
                  ? "bg-[#B9FF66] text-[#191A23]"
                  : "bg-white text-[#191A23] hover:bg-[#F3F3F3]"
              }`}
            >
              {st} ({samples.filter((s) => (st === "ALL" ? true : s.review_status === st)).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold uppercase text-neutral-600">POSE:</span>
          <select
            value={selectedPose}
            onChange={(e) => {
              setSelectedPose(e.target.value);
              setCurrentIndex(0);
            }}
            className="neo-input py-2 px-3 text-xs bg-white"
          >
            <option value="ALL">ALL 8 POSES</option>
            {INITIAL_POSES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Review Workbench */}
      {currentSample ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
            <span>
              REVIEWING ITEM {currentIndex + 1} OF {filteredSamples.length}
            </span>
            <span className="text-[#191A23]">
              USE <kbd className="border border-[#191A23] px-1.5 py-0.5 rounded bg-[#B9FF66] font-extrabold">APPROVE</kbd> OR{" "}
              <kbd className="border border-[#191A23] px-1.5 py-0.5 rounded bg-[#FF6B4A] text-white font-extrabold">REJECT</kbd>
            </span>
          </div>

          <ReviewCard
            sample={currentSample}
            onReview={handleReview}
            onNext={filteredSamples.length > 1 ? handleNext : undefined}
          />

          {/* Quick Carousel Selector */}
          {filteredSamples.length > 1 && (
            <div className="neo-card p-5 bg-white space-y-3">
              <div className="text-xs font-extrabold uppercase text-neutral-500">
                JUMP TO SAMPLE IN QUEUE:
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {filteredSamples.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`px-3.5 py-2 rounded-xl border-2 border-[#191A23] text-xs font-bold whitespace-nowrap transition-all shadow-[2px_2px_0px_#191A23] ${
                      currentIndex === idx
                        ? "bg-[#B9FF66] text-[#191A23] translate-x-[1px] translate-y-[1px]"
                        : "bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    #{idx + 1} {s.pose_id.toUpperCase()} ({s.review_status})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="neo-card p-12 bg-white text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#B9FF66] rounded-2xl border-3 border-[#191A23] flex items-center justify-center shadow-[3px_3px_0px_#191A23]">
            <CheckCircle2 className="w-8 h-8 text-[#191A23]" />
          </div>
          <h3 className="font-extrabold text-2xl uppercase text-[#191A23]">ALL CAUGHT UP!</h3>
          <p className="text-sm text-neutral-600 max-w-md mx-auto font-medium">
            No dataset samples matching your current status filter ({selectedStatus}) are awaiting review.
          </p>
          <button
            onClick={() => setSelectedStatus("ALL")}
            className="neo-btn neo-btn-primary px-6 py-3 text-xs font-extrabold"
          >
            VIEW ALL SAMPLES →
          </button>
        </div>
      )}
    </div>
  );
}
