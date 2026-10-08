import React from "react";
import { DatasetSample } from "@/types";
import { FileVideo, Image as ImageIcon, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface TeamActivityProps {
  recentSamples: DatasetSample[];
}

export default function TeamActivity({ recentSamples }: TeamActivityProps) {
  return (
    <div className="neo-card p-6 sm:p-7 bg-white space-y-4">
      <div className="flex items-center justify-between border-b-2 border-[#191A23] pb-3">
        <h3 className="font-extrabold text-xl tracking-tight uppercase flex items-center gap-2 text-[#191A23]">
          <Clock className="w-5 h-5 text-[#191A23]" />
          TEAM ACTIVITY STREAM
        </h3>
        <Link href="/my-uploads" className="text-xs font-bold underline hover:text-[#191A23] flex items-center gap-1">
          VIEW ALL <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y-2 divide-[#191A23]/10">
        {recentSamples.slice(0, 6).map((sample) => {
          const isVideo = sample.file_type === "video";

          return (
            <div key={sample.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg border-2 border-[#191A23] bg-[#B9FF66] shadow-[2px_2px_0px_#191A23] flex items-center justify-center shrink-0">
                  {isVideo ? <FileVideo className="w-4 h-4 text-[#191A23]" /> : <ImageIcon className="w-4 h-4 text-[#191A23]" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#191A23] uppercase leading-tight">
                    {sample.pose_id.replace("_", " ")}
                  </div>
                  <div className="text-neutral-500 text-[11px] truncate max-w-[180px] sm:max-w-xs font-medium">
                    {sample.file_name} • by {sample.contributor_name || "Contributor"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-neutral-400 hidden sm:inline text-[11px] font-mono">
                  {new Date(sample.created_at).toLocaleDateString()}
                </span>
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
              </div>
            </div>
          );
        })}

        {recentSamples.length === 0 && (
          <div className="py-8 text-center text-neutral-400 text-xs font-medium">
            No dataset activity recorded yet. Start by uploading samples at the Upload Station.
          </div>
        )}
      </div>
    </div>
  );
}
