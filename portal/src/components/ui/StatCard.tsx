import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  bgColor?: string;
  textColor?: string;
}

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  bgColor = "bg-white",
  textColor = "text-[#191A23]",
}: StatCardProps) {
  return (
    <div className={`neo-card p-6 ${bgColor} ${textColor} relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#191A23]/70">
            {label}
          </div>
          <div className="font-extrabold text-3xl sm:text-4xl mt-1.5 tracking-tight text-[#191A23]">{value}</div>
          {subtext && (
            <div className="text-xs font-medium mt-1 text-[#191A23]/80">
              {subtext}
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl border-2 border-[#191A23] bg-[#B9FF66] shadow-[2px_2px_0px_#191A23] flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-[#191A23]" />
        </div>
      </div>
    </div>
  );
}
