"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { INITIAL_POSES } from "@/lib/constants";
import { Pose } from "@/types";
import { useAuth } from "@/lib/auth-context";
import AsanaSelector from "@/components/upload/AsanaSelector";
import DropZone from "@/components/upload/DropZone";
import MetadataForm from "@/components/upload/MetadataForm";
import { HardDrive, Sparkles, CheckCircle2, Shield, ArrowRight, AlertTriangle } from "lucide-react";

function PoseParamSync({ onPoseChange }: { onPoseChange: (pose: Pose) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const poseParam = searchParams.get("pose");
    if (poseParam) {
      const found = INITIAL_POSES.find((p) => p.id === poseParam);
      if (found) onPoseChange(found);
    }
  }, [searchParams, onPoseChange]);
  return null;
}

function UploadStationContent() {
  const { role } = useAuth();
  const [selectedPose, setSelectedPose] = useState<Pose>(INITIAL_POSES[0]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [driveStatus, setDriveStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/gdrive/test")
      .then((res) => res.json())
      .then((data) => setDriveStatus(data))
      .catch(() => setDriveStatus({ connected: false }));
  }, []);

  const handleReset = () => {
    setSelectedFiles([]);
  };

  const isDriveDisconnected = driveStatus && !driveStatus.connected;

  return (
    <div className="space-y-10">
      <Suspense fallback={null}>
        <PoseParamSync onPoseChange={setSelectedPose} />
      </Suspense>

      {/* Disconnected / Expired Drive Warning Banner */}
      {isDriveDisconnected && (
        <div className="p-4 bg-[#FF6B4A] text-white rounded-2xl border-3 border-[#191A23] shadow-[4px_4px_0px_#191A23] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#FF6B4A] flex items-center justify-center font-extrabold text-base shrink-0 border-2 border-[#191A23]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm uppercase">
                {driveStatus?.tokenExpired ? "Google Drive Token Expired" : "Google Drive Not Connected"}
              </div>
              <div className="text-xs text-white/90 font-medium">
                {driveStatus?.tokenExpired
                  ? "Your Google OAuth session expired (7-day test limit). Reconnect in Settings to enable upload."
                  : "Google Drive is not authorized on this host. Reconnect in Settings to enable upload."}
              </div>
            </div>
          </div>

          <Link
            href="/settings"
            className="neo-btn bg-white text-[#191A23] px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-[2px_2px_0px_#191A23] hover:bg-[#B9FF66]"
          >
            ⚡ RECONNECT IN SETTINGS →
          </Link>
        </div>
      )}

      {/* Role Notice Banner for Reviewer / Mentor */}
      {role !== "contributor" && (
        <div className="p-4 bg-[#FFE600]/30 rounded-2xl border-3 border-[#191A23] shadow-[3px_3px_0px_#191A23] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#191A23] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
              {role === "reviewer" ? "QA" : "👑"}
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#191A23]">
                {role === "reviewer" ? "REVIEWER ROLE ACTIVE" : "PROJECT MENTOR ROLE ACTIVE"}
              </div>
              <div className="text-xs text-neutral-600 font-medium">
                {role === "reviewer"
                  ? "Your primary workspace is the Review Queue for auditing poses & angles."
                  : "Your primary workspace is the Mentor Console for team management & telemetry."}
              </div>
            </div>
          </div>

          <Link
            href={role === "reviewer" ? "/review" : "/admin"}
            className="neo-btn neo-btn-primary px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 shrink-0"
          >
            {role === "reviewer" ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> GO TO REVIEW QUEUE →
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" /> OPEN MENTOR CONSOLE →
              </>
            )}
          </Link>
        </div>
      )}

      {/* Header Banner */}
      <div className="neo-card p-8 sm:p-10 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#B9FF66] text-[#191A23] px-3 py-1 rounded-md border-2 border-[#191A23] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#191A23]">
              <Sparkles className="w-4 h-4" /> TEAM MEMBER UPLOAD STATION
            </div>
            <h1 className="font-extrabold text-3xl sm:text-5xl uppercase tracking-tight text-[#191A23]">
              Feed YogaSync the Data it Needs.
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-medium max-w-2xl">
              Upload single photos or drag <strong>batch collections (1–50 files)</strong>. Real-time in-browser MediaPipe skeleton detection inspects every pose before syncing to the owner&apos;s 400 GB Google Drive.
            </p>
          </div>

          <div className={`rounded-2xl border-3 border-[#191A23] p-4 text-xs font-bold shadow-[4px_4px_0px_#191A23] flex items-center gap-3 shrink-0 ${
            driveStatus?.connected ? "bg-[#F3F3F3]" : "bg-[#FFF5F2]"
          }`}>
            <div className={`w-10 h-10 rounded-xl border-2 border-[#191A23] flex items-center justify-center shrink-0 ${
              driveStatus?.connected ? "bg-[#B9FF66]" : "bg-[#FF6B4A] text-white"
            }`}>
              <HardDrive className="w-5 h-5 text-[#191A23]" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 uppercase">CENTRAL STORAGE</div>
              <div className="text-[#191A23] font-extrabold">
                {driveStatus?.connected ? "400 GB GOOGLE DRIVE ✓" : "RECONNECT DRIVE ⚠️"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Select Asana */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
          <h2 className="font-extrabold text-2xl tracking-tight uppercase flex items-center gap-2.5 text-[#191A23]">
            <span className="w-8 h-8 rounded-lg bg-[#191A23] text-[#B9FF66] border-2 border-[#191A23] flex items-center justify-center font-extrabold text-sm shadow-[2px_2px_0px_#191A23]">
              1
            </span>
            STEP 1: SELECT ASANA
          </h2>
          <span className="text-xs font-bold text-neutral-600">
            CURRENT: <span className="text-[#191A23] uppercase underline">{selectedPose.display_name}</span>
          </span>
        </div>

        <AsanaSelector
          selectedPoseId={selectedPose.id}
          onSelectPose={(pose) => setSelectedPose(pose)}
        />
      </div>

      {/* Step 2 & Step 3 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step 2: Select Data / DropZone (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
            <h2 className="font-extrabold text-2xl tracking-tight uppercase flex items-center gap-2.5 text-[#191A23]">
              <span className="w-8 h-8 rounded-lg bg-[#191A23] text-[#B9FF66] border-2 border-[#191A23] flex items-center justify-center font-extrabold text-sm shadow-[2px_2px_0px_#191A23]">
                2
              </span>
              STEP 2: SELECT MEDIA OR BATCH
            </h2>
            <span className="neo-badge bg-[#B9FF66] text-[#191A23] text-[10px]">
              {selectedFiles.length > 0 ? `${selectedFiles.length} FILES IN QUEUE` : "PHOTOS / VIDEOS"}
            </span>
          </div>

          <DropZone files={selectedFiles} onFilesChange={setSelectedFiles} />
        </div>

        {/* Step 3: Metadata & Submit (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <MetadataForm
            selectedPose={selectedPose}
            files={selectedFiles}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="text-sm p-12 text-center font-medium">Loading Upload Station...</div>}>
      <UploadStationContent />
    </Suspense>
  );
}
