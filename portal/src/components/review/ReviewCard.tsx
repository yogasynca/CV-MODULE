"use client";

import React, { useState } from "react";
import { DatasetSample, Pose } from "@/types";
import { INITIAL_POSES } from "@/lib/constants";
import {
  Check,
  X,
  FileVideo,
  Image as ImageIcon,
  ExternalLink,
  User,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import PoseLandmarkOverlay from "@/components/pose/PoseLandmarkOverlay";

interface ReviewCardProps {
  sample: DatasetSample;
  onReview: (sampleId: string, status: "APPROVED" | "REJECTED", reason?: string) => Promise<void>;
  onNext?: () => void;
}

export default function ReviewCard({ sample, onReview, onNext }: ReviewCardProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const poseInfo: Pose | undefined = INITIAL_POSES.find((p) => p.id === sample.pose_id);

  const handleApprove = async () => {
    setIsLoading(true);
    await onReview(sample.id, "APPROVED");
    setIsLoading(false);
    if (onNext) onNext();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting this sample.");
      return;
    }
    setIsLoading(true);
    await onReview(sample.id, "REJECTED", rejectionReason);
    setIsLoading(false);
    setIsRejecting(false);
    setRejectionReason("");
    if (onNext) onNext();
  };

  const isVideo = sample.file_type === "video";

  return (
    <div className="neo-card bg-white overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#191A23] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b-3 border-[#191A23]">
        <div className="flex items-center gap-2.5 text-xs font-bold">
          <span className="bg-[#B9FF66] text-[#191A23] px-2.5 py-1 rounded-md border border-[#191A23] uppercase">
            {sample.pose_id.toUpperCase()}
          </span>
          <span className="text-neutral-400 font-mono">ID: {sample.id}</span>
        </div>

        <div className="flex items-center gap-3">
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
          {sample.gdrive_web_view_link && (
            <a
              href={sample.gdrive_web_view_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B9FF66] hover:underline font-bold text-xs flex items-center gap-1"
            >
              Google Drive <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Media Preview & Landmark Overlay (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-950 flex flex-col items-center justify-center p-4 border-b-3 lg:border-b-0 lg:border-r-3 border-[#191A23] min-h-[380px] relative">
          {sample.preview_url ? (
            isVideo ? (
              <video
                src={sample.preview_url}
                controls
                className="max-h-[440px] w-full object-contain rounded-xl"
              />
            ) : (
              <div className="w-full">
                <PoseLandmarkOverlay imageUrl={sample.preview_url} autoDetect={true} />
              </div>
            )
          ) : (
            <div className="text-center font-medium text-neutral-400 p-8">
              {isVideo ? (
                <FileVideo className="w-16 h-16 mx-auto mb-2 text-[#B9FF66]" />
              ) : (
                <ImageIcon className="w-16 h-16 mx-auto mb-2 text-[#B9FF66]" />
              )}
              <div className="font-bold text-white text-sm uppercase">{sample.file_name}</div>
              <div className="text-xs text-neutral-500 mt-1 font-mono">
                {(sample.file_size / (1024 * 1024)).toFixed(2)} MB • Stored in Drive
              </div>
            </div>
          )}
        </div>

        {/* Metadata & Verification Panel (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Pose Reference Card */}
            <div className="bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] p-4 text-[#191A23] space-y-1.5 shadow-[2px_2px_0px_#191A23]">
              <div className="text-[10px] font-extrabold tracking-wider text-neutral-500 uppercase">
                TARGET ASANA
              </div>
              <div className="font-extrabold text-2xl uppercase leading-tight text-[#191A23]">
                {poseInfo?.display_name || sample.pose_id}
              </div>
              <div className="text-xs font-bold text-neutral-600">
                {poseInfo?.sanskrit_name} ({poseInfo?.name})
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed border-t border-[#191A23]/20 pt-2 font-medium">
                {poseInfo?.description}
              </p>
            </div>

            {/* Submission Telemetry */}
            <div className="text-xs space-y-2.5 bg-white p-4 rounded-xl border-2 border-[#191A23] shadow-[2px_2px_0px_#191A23]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500" />
                <span className="text-neutral-500 font-medium">Team Member:</span>
                <span className="font-bold text-[#191A23]">{sample.contributor_name || "Team Member"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <span className="text-neutral-500 font-medium">Uploaded:</span>
                <span className="font-bold font-mono text-[#191A23]">
                  {new Date(sample.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-neutral-500" />
                <span className="text-neutral-500 font-medium">Dataset Version:</span>
                <span className="font-bold font-mono text-[#191A23]">v{sample.dataset_version}</span>
              </div>
              {sample.notes && (
                <div className="pt-2 border-t border-[#191A23]/20 text-neutral-700 font-medium">
                  <span className="font-bold text-[#191A23]">Notes: </span>
                  {sample.notes}
                </div>
              )}
            </div>

            {/* If Already Reviewed */}
            {sample.review_status !== "PENDING" && (
              <div
                className={`p-3.5 rounded-xl border-2 border-[#191A23] text-xs font-bold ${
                  sample.review_status === "APPROVED"
                    ? "bg-[#B9FF66]/30 text-emerald-950"
                    : "bg-[#FF6B4A]/30 text-red-950"
                }`}
              >
                <div className="uppercase">
                  {sample.review_status === "APPROVED" ? "✓ APPROVED" : "✕ REJECTED"}
                </div>
                {sample.rejection_reason && (
                  <div className="mt-1 text-red-900 font-medium">
                    Reason: {sample.rejection_reason}
                  </div>
                )}
                {sample.reviewed_at && (
                  <div className="text-[10px] text-neutral-600 mt-0.5 font-mono">
                    Reviewed on {new Date(sample.reviewed_at).toLocaleDateString()} by{" "}
                    {sample.reviewer_name || "Reviewer"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t-2 border-[#191A23]/20">
            {isRejecting ? (
              <div className="space-y-3 animate-in fade-in">
                <label className="block font-bold text-xs uppercase tracking-wider text-[#191A23]">
                  REASON FOR REJECTION
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Limbs cut off by camera frame, poor lighting, incorrect joint angle..."
                  className="neo-input font-mono text-xs"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isLoading}
                    className="flex-1 neo-btn neo-btn-coral py-3 text-xs font-extrabold"
                  >
                    CONFIRM REJECTION ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="neo-btn bg-white py-3 px-4 text-xs font-bold"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1 neo-btn neo-btn-primary py-3.5 text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  APPROVE SAMPLE
                </button>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  disabled={isLoading}
                  className="flex-1 neo-btn neo-btn-coral py-3.5 text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  REJECT SAMPLE
                </button>
              </div>
            )}

            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="w-full neo-btn neo-btn-dark py-3 text-xs font-bold flex items-center justify-center gap-1"
              >
                NEXT SAMPLE →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
