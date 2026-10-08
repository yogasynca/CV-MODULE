"use client";

import React from "react";
import { INITIAL_POSES } from "@/lib/constants";
import { Pose } from "@/types";
import { CheckCircle2 } from "lucide-react";

interface AsanaSelectorProps {
  selectedPoseId: string;
  onSelectPose: (pose: Pose) => void;
}

export default function AsanaSelector({ selectedPoseId, onSelectPose }: AsanaSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {INITIAL_POSES.map((pose) => {
        const isSelected = selectedPoseId === pose.id;

        return (
          <div
            key={pose.id}
            onClick={() => onSelectPose(pose)}
            className={`p-5 rounded-2xl border-3 border-[#191A23] cursor-pointer transition-all relative ${
              isSelected
                ? "bg-[#B9FF66] shadow-[6px_6px_0px_#191A23] -translate-x-1 -translate-y-1"
                : "bg-white hover:bg-[#F3F3F3] shadow-[4px_4px_0px_#191A23]"
            }`}
          >
            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#191A23] text-[#B9FF66] border-2 border-[#191A23] flex items-center justify-center shadow-[1px_1px_0px_#191A23]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            {/* Category Tag */}
            <span
              className={`neo-badge text-[10px] px-2 py-0.5 ${
                isSelected ? "bg-[#191A23] text-white" : "bg-[#F3F3F3] text-[#191A23]"
              }`}
            >
              {pose.category}
            </span>

            {/* Pose Title */}
            <div className="font-extrabold text-lg mt-2.5 leading-tight uppercase text-[#191A23]">
              {pose.display_name}
            </div>
            <div className="text-xs font-semibold text-neutral-600 mt-0.5">
              {pose.sanskrit_name} ({pose.name})
            </div>

            {/* Description */}
            <p className="text-xs mt-2 text-neutral-700 line-clamp-2 leading-relaxed">
              {pose.description}
            </p>

            <div className="mt-3.5 pt-2.5 border-t-2 border-[#191A23]/20 flex items-center justify-between text-[11px] font-bold">
              <span>TARGET: {pose.target_samples}</span>
              <span className="text-neutral-500 font-mono text-[10px]">ID: {pose.id}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
