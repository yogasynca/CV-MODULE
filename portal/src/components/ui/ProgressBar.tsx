import React from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  showPercent?: boolean;
}

export default function ProgressBar({
  value,
  max,
  label,
  color = "bg-[#B9FF66]",
  showPercent = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((value / (max || 1)) * 100));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs font-bold mb-1.5 text-[#191A23]">
          {label && <span>{label}</span>}
          {showPercent && (
            <span className="font-mono text-xs">
              {value} / {max} ({percentage}%)
            </span>
          )}
        </div>
      )}
      <div className="w-full h-4 bg-[#F3F3F3] border-2 border-[#191A23] rounded-full p-0.5 shadow-[2px_2px_0px_#191A23] overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 border-r border-[#191A23]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
