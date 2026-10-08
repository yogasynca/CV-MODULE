"use client";

import React, { useRef, useState } from "react";
import {
  FileVideo,
  Image as ImageIcon,
  UploadCloud,
  X,
  AlertTriangle,
  FileCheck,
  Sparkles,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import PoseLandmarkOverlay from "@/components/pose/PoseLandmarkOverlay";

interface DropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const MAX_SIZE_MB = 100;
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"];

export default function DropZone({ files, onFilesChange }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inspectIndex, setInspectIndex] = useState<number | null>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const errorList: string[] = [];

    Array.from(incomingFiles).forEach((f) => {
      // Size check
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        errorList.push(`${f.name}: Exceeds ${MAX_SIZE_MB}MB.`);
        return;
      }

      // Extension check
      const lowerName = f.name.toLowerCase();
      const isValid = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      if (!isValid) {
        errorList.push(`${f.name}: Unsupported format.`);
        return;
      }

      // Avoid exact duplicates
      if (!files.some((existing) => existing.name === f.name && existing.size === f.size)) {
        validFiles.push(f);
      }
    });

    if (errorList.length > 0) {
      setErrorMessage(errorList.join(" | "));
    }

    if (validFiles.length > 0) {
      const updated = [...files, ...validFiles];
      onFilesChange(updated);
      if (inspectIndex === null || inspectIndex >= updated.length) {
        setInspectIndex(0);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // reset input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
    if (inspectIndex === index) {
      setInspectIndex(updated.length > 0 ? 0 : null);
    } else if (inspectIndex !== null && inspectIndex > index) {
      setInspectIndex(inspectIndex - 1);
    }
  };

  const clearAllFiles = () => {
    onFilesChange([]);
    setInspectIndex(null);
  };

  const currentInspectedFile = inspectIndex !== null && files[inspectIndex] ? files[inspectIndex] : null;
  const inspectedUrl = currentInspectedFile ? URL.createObjectURL(currentInspectedFile) : null;
  const isInspectedVideo =
    currentInspectedFile?.type.startsWith("video/") ||
    currentInspectedFile?.name.toLowerCase().endsWith(".mp4") ||
    currentInspectedFile?.name.toLowerCase().endsWith(".mov");

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
        className="hidden"
        onChange={handleInputChange}
      />

      {errorMessage && (
        <div className="p-3.5 bg-[#FF6B4A] text-white rounded-xl border-2 border-[#191A23] font-bold text-xs flex items-center gap-2 shadow-[3px_3px_0px_#191A23]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {files.length === 0 ? (
        /* Empty State Drop Box */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-3 border-dashed border-[#191A23] rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? "bg-[#F8FFF0] border-[#B9FF66] scale-[1.01] shadow-[8px_8px_0px_#191A23]"
              : "bg-white hover:bg-[#F3F3F3] shadow-[5px_5px_0px_#191A23]"
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-3 border-[#191A23] bg-[#B9FF66] flex items-center justify-center shadow-[3px_3px_0px_#191A23]">
            <UploadCloud className="w-8 h-8 text-[#191A23]" />
          </div>

          <h3 className="font-extrabold text-2xl tracking-tight uppercase mb-2 text-[#191A23]">
            Drop Yoga Files or Batch Here
          </h3>
          <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto font-medium">
            Drag & drop single or multiple asana images / video holds. Automatically streams into the owner's 400 GB central Google Drive.
          </p>

          <button
            type="button"
            className="neo-btn neo-btn-primary px-6 py-3.5 text-sm font-extrabold"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            BROWSE DEVICE FILES (MULTI-SELECT) →
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-neutral-500">
            <span className="neo-badge bg-[#F3F3F3] text-[#191A23]">JPG / PNG / WEBP</span>
            <span className="neo-badge bg-[#F3F3F3] text-[#191A23]">MP4 / MOV / WEBM</span>
            <span className="neo-badge bg-[#B9FF66] text-[#191A23]">BATCH: 1–50 FILES</span>
          </div>
        </div>
      ) : (
        /* Multi-File Queue & Active Inspector */
        <div className="neo-card p-6 bg-white space-y-5">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#191A23] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="neo-badge bg-[#B9FF66] text-[#191A23] text-[11px] font-extrabold">
                {files.length} {files.length === 1 ? "FILE" : "FILES"} READY
              </span>
              <span className="text-xs font-mono font-bold text-neutral-600">
                {(totalBytes / (1024 * 1024)).toFixed(2)} MB Total
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="neo-btn bg-white py-1.5 px-3 text-xs font-bold flex items-center gap-1 text-[#191A23]"
              >
                <Plus className="w-3.5 h-3.5" /> Add More Files
              </button>
              <button
                type="button"
                onClick={clearAllFiles}
                className="p-1.5 rounded-lg border-2 border-[#191A23] bg-[#FF6B4A] text-white hover:bg-red-600 shadow-[1.5px_1.5px_0px_#191A23]"
                title="Clear All"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Batch Thumbnails Carousel */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-neutral-500 uppercase">
              BATCH QUEUE (CLICK TO INSPECT POSE LANDMARKS):
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {files.map((file, idx) => {
                const isSelected = inspectIndex === idx;
                const isVid = file.type.startsWith("video/") || file.name.endsWith(".mp4");

                return (
                  <div
                    key={`${file.name}-${idx}`}
                    onClick={() => setInspectIndex(idx)}
                    className={`p-2.5 rounded-xl border-2 border-[#191A23] cursor-pointer flex items-center gap-2 shrink-0 transition-all text-xs font-bold shadow-[2px_2px_0px_#191A23] ${
                      isSelected
                        ? "bg-[#B9FF66] text-[#191A23] translate-x-[1px] translate-y-[1px]"
                        : "bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {isVid ? <FileVideo className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="ml-1 text-neutral-500 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Inspected Media (with Real-Time MediaPipe Skeleton) */}
          {currentInspectedFile && inspectedUrl && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                <span className="flex items-center gap-1.5 text-[#191A23]">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  INSPECTING: <strong className="uppercase">{currentInspectedFile.name}</strong>
                </span>
                <span className="font-mono">{(currentInspectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>

              {!isInspectedVideo ? (
                /* Interactive In-Browser MediaPipe Skeleton Overlay for Photos */
                <PoseLandmarkOverlay imageUrl={inspectedUrl} autoDetect={true} />
              ) : (
                /* Video Player Preview */
                <div className="max-h-80 w-full rounded-2xl border-3 border-[#191A23] bg-neutral-900 flex items-center justify-center overflow-hidden relative shadow-[3px_3px_0px_#191A23]">
                  <video src={inspectedUrl} controls className="max-h-80 w-full object-contain" />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 bg-[#F3F3F3] p-3 rounded-xl border-2 border-[#191A23]">
            <span className="flex items-center gap-1.5 text-[#191A23]">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              {files.length} {files.length === 1 ? "sample" : "samples"} prepared for Google Drive sync
            </span>
            <span className="text-[11px] text-neutral-500">Step 3 ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
