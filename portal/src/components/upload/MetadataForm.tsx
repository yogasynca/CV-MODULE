"use client";

import React, { useState } from "react";
import { Pose, DatasetSample } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_DATASET_VERSION } from "@/lib/constants";
import { CheckCircle, FolderUp, HardDrive, Loader2, Layers } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface MetadataFormProps {
  selectedPose: Pose | null;
  files: File[];
  onReset: () => void;
}

export default function MetadataForm({ selectedPose, files, onReset }: MetadataFormProps) {
  const { profile } = useAuth();
  const [datasetVersion, setDatasetVersion] = useState(DEFAULT_DATASET_VERSION);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedSamples, setSubmittedSamples] = useState<DatasetSample[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPose || files.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadProgress(15);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("pose_id", selectedPose.id);
    formData.append("contributor_id", profile?.id || "demo_contributor_001");
    formData.append("contributor_name", profile?.full_name || "Team Member");
    formData.append("contributor_email", profile?.email || "");
    formData.append("dataset_version", datasetVersion);
    formData.append("notes", notes);

    try {
      setUploadProgress(45);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit dataset samples.");
      }

      setUploadProgress(100);
      setSubmittedSamples(data.samples || (data.sample ? [data.sample] : []));

      // Trigger celebratory confetti
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#B9FF66", "#191A23", "#F3F3F3", "#FFE600"],
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  if (submittedSamples.length > 0) {
    return (
      <div className="neo-card p-8 bg-[#B9FF66] text-[#191A23] text-center animate-in fade-in zoom-in-95 duration-200 space-y-6">
        <div className="w-16 h-16 mx-auto bg-[#191A23] text-[#B9FF66] rounded-2xl border-3 border-[#191A23] flex items-center justify-center shadow-[3px_3px_0px_#191A23]">
          <CheckCircle className="w-9 h-9" />
        </div>

        <div>
          <h2 className="font-extrabold text-3xl sm:text-4xl tracking-tight uppercase mb-1 text-[#191A23]">
            {submittedSamples.length} {submittedSamples.length === 1 ? "SAMPLE" : "SAMPLES"} SUBMITTED ✓
          </h2>
          <p className="text-sm font-semibold text-[#191A23]/80 max-w-lg mx-auto">
            All samples have been registered in the YogaSync Dataset and stored in the central Google Drive.
          </p>
        </div>

        {/* Batch Submission Breakdown Card */}
        <div className="neo-card p-5 bg-white text-left max-w-lg mx-auto text-xs space-y-3">
          <div className="flex justify-between border-b border-neutral-200 pb-2 font-bold">
            <span className="text-neutral-500 uppercase">ASANA:</span>
            <span className="font-extrabold text-[#191A23] uppercase">{selectedPose?.display_name}</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {submittedSamples.map((s, idx) => (
              <div key={s.id} className="flex justify-between items-center py-1 border-b border-neutral-100 text-[11px] font-mono">
                <span className="truncate max-w-[200px] text-[#191A23] font-bold">
                  #{idx + 1} {s.file_name}
                </span>
                <span className="neo-badge neo-badge-pending text-[9px]">{s.review_status}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-1 font-mono text-[11px] text-neutral-600">
            <span>DATASET VERSION: v{datasetVersion}</span>
            <span className="font-bold text-[#191A23]">STORED IN GOOGLE DRIVE</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmittedSamples([]);
              onReset();
            }}
            className="neo-btn neo-btn-dark px-6 py-3.5 text-xs font-extrabold"
          >
            + SUBMIT MORE SAMPLES
          </button>
          <Link href="/my-uploads" className="neo-btn bg-white px-6 py-3.5 text-xs font-extrabold text-[#191A23]">
            VIEW IN MY SUBMISSIONS →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="neo-card p-6 sm:p-7 bg-white space-y-6">
      <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
        <h3 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
          <FolderUp className="w-5 h-5 text-[#191A23]" />
          METADATA & SUBMISSION
        </h3>
        <span className="neo-badge bg-[#F3F3F3] text-[#191A23] text-[10px]">SCHEMA v0.1</span>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-[#FF6B4A] text-white rounded-xl border-2 border-[#191A23] font-bold text-xs shadow-[2px_2px_0px_#191A23]">
          {errorMessage}
        </div>
      )}

      {/* Auto-Captured Summary Card */}
      <div className="bg-[#F3F3F3] rounded-xl border-2 border-[#191A23] p-4 text-xs space-y-2 shadow-[2px_2px_0px_#191A23]">
        <div className="font-extrabold text-xs uppercase text-[#191A23] mb-2 flex items-center gap-1.5">
          <HardDrive className="w-4 h-4 text-[#191A23]" />
          TELEMETRY SUMMARY
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 font-medium">Selected Pose:</span>
          <span className="font-bold text-[#191A23]">{selectedPose?.display_name || "None"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 font-medium">Batch Queue:</span>
          <span className="font-bold text-[#191A23] font-mono">
            {files.length} {files.length === 1 ? "file" : "files"} ({(totalBytes / (1024 * 1024)).toFixed(2)} MB)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 font-medium">Team Member:</span>
          <span className="font-bold text-[#191A23]">{profile?.full_name || "Team Member"}</span>
        </div>
      </div>

      {/* Dataset Version */}
      <div>
        <label className="block font-bold text-xs uppercase tracking-wider mb-1.5 text-[#191A23]">
          DATASET VERSION
        </label>
        <input
          type="text"
          value={datasetVersion}
          onChange={(e) => setDatasetVersion(e.target.value)}
          className="neo-input font-mono text-sm"
          placeholder="0.1"
          required
        />
      </div>

      {/* Notes / Camera Setup Info */}
      <div>
        <label className="block font-bold text-xs uppercase tracking-wider mb-1.5 text-[#191A23]">
          RECORDING & POSE NOTES (OPTIONAL)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="neo-input font-mono text-sm"
          placeholder="e.g. Side 90-degree view. 2.5 meters camera distance."
        />
      </div>

      {/* Upload Progress Bar */}
      {isSubmitting && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[#191A23]">
            <span>SYNCING BATCH TO GOOGLE DRIVE...</span>
            <span className="font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full h-4 bg-[#F3F3F3] border-2 border-[#191A23] rounded-full p-0.5 shadow-[2px_2px_0px_#191A23] overflow-hidden">
            <div
              className="h-full bg-[#B9FF66] rounded-full border-r border-[#191A23] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!selectedPose || files.length === 0 || isSubmitting}
        className="w-full neo-btn neo-btn-primary py-4 text-sm font-extrabold flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            UPLOADING {files.length} FILE(S) TO DRIVE...
          </>
        ) : (
          <>
            SUBMIT {files.length > 0 ? `${files.length} SAMPLE(S)` : "DATA"} TO YOGASYNC →
          </>
        )}
      </button>
    </form>
  );
}
