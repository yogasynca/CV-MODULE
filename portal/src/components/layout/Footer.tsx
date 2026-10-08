import React from "react";
import Link from "next/link";
import { HardDrive } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#191A23] text-white border-t-4 border-[#191A23] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="font-extrabold text-3xl tracking-tight text-white flex items-center gap-2">
              YOGASYNC
              <span className="bg-[#B9FF66] text-[#191A23] text-xs font-bold px-2.5 py-1 rounded-md border border-[#191A23]">
                DATASET LAB
              </span>
            </div>
            <p className="text-neutral-400 text-sm max-w-md font-medium leading-relaxed">
              Team dataset collection & validation portal for training the YogaSync
              biomechanical AI posture system across 8 canonical yoga asanas.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#2a2b38] border-2 border-neutral-700 px-3.5 py-2 rounded-xl text-xs text-[#B9FF66] font-bold">
              <HardDrive className="w-4 h-4 text-[#B9FF66]" />
              CENTRAL STORAGE: 400 GB GOOGLE DRIVE (OWNER ACCOUNT)
            </div>
          </div>

          {/* Dataset Links */}
          <div>
            <h4 className="font-bold text-xs tracking-wider uppercase text-[#B9FF66] mb-3">
              DATA LAB WORKFLOW
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/upload" className="hover:text-[#B9FF66] transition-colors">
                  → Upload Station
                </Link>
              </li>
              <li>
                <Link href="/my-uploads" className="hover:text-[#B9FF66] transition-colors">
                  → My Submissions
                </Link>
              </li>
              <li>
                <Link href="/review" className="hover:text-[#B9FF66] transition-colors">
                  → Review Queue
                </Link>
              </li>
              <li>
                <Link href="/dataset" className="hover:text-[#B9FF66] transition-colors">
                  → Pose Library & Targets
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Pipeline Info */}
          <div>
            <h4 className="font-bold text-xs tracking-wider uppercase text-[#B9FF66] mb-3">
              PIPELINE ARCHITECTURE
            </h4>
            <div className="space-y-1.5 text-xs text-neutral-400 font-medium">
              <div>• MediaPipe 33-Keypoint Pose</div>
              <div>• 2D Vector Angle Calculator</div>
              <div>• Scale-Invariant Normalizer</div>
              <div>• Automated Quality Triage</div>
              <div>• Schema Version: 0.1</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-neutral-400">
          <div>
            © 2026 YogaSync AI. Biomechanical Human Posture Intelligence.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#B9FF66] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B9FF66] animate-pulse"></span>
              SYSTEM OPERATIONAL
            </span>
            <span>DATASET v0.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
