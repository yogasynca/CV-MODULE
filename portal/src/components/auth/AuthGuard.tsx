"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Shield, Sparkles } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // 1. If not logged in and trying to visit an internal page -> Redirect to login page
      if (!profile && pathname !== "/") {
        router.replace("/");
      }

      // 2. If logged in and on the login root -> Redirect to assigned workspace
      if (profile && pathname === "/") {
        if (role === "admin") {
          router.replace("/admin");
        } else if (role === "reviewer") {
          router.replace("/review");
        } else {
          router.replace("/upload");
        }
      }
    }
  }, [profile, role, isLoading, pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#B9FF66] border-3 border-[#191A23] flex items-center justify-center shadow-[4px_4px_0px_#191A23] animate-bounce">
          <Sparkles className="w-7 h-7 text-[#191A23]" />
        </div>
        <div className="font-extrabold text-sm uppercase tracking-wider text-[#191A23]">
          Authenticating Workspace...
        </div>
      </div>
    );
  }

  // If not logged in and not on login page, display blocking screen while redirect happens
  if (!profile && pathname !== "/") {
    return (
      <div className="max-w-md mx-auto neo-card p-8 bg-white text-center space-y-4 my-16">
        <div className="w-14 h-14 mx-auto bg-[#191A23] rounded-2xl border-3 border-[#191A23] flex items-center justify-center shadow-[3px_3px_0px_#191A23]">
          <Shield className="w-7 h-7 text-[#B9FF66]" />
        </div>
        <h2 className="font-extrabold text-xl text-[#191A23] uppercase">
          Authentication Required
        </h2>
        <p className="text-xs text-neutral-600 font-medium">
          Please enter your username and password on the login screen to enter the portal.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
