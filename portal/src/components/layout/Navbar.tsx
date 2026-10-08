"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import {
  Activity,
  CheckCircle2,
  Database,
  FolderUp,
  LayoutDashboard,
  Shield,
  Settings,
  LogOut,
  HardDrive,
  X,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { profile, role, signOut, switchDemoRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent background scrolling when menu drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const allNavLinks = [
    { href: "/upload", label: "Upload Station", icon: FolderUp, highlight: true, roles: ["contributor"] },
    { href: "/my-uploads", label: "My Submissions", icon: Activity, roles: ["contributor"] },
    { href: "/review", label: "Review Queue (QA)", icon: CheckCircle2, highlight: true, roles: ["reviewer", "admin"] },
    { href: "/admin", label: "Mentor Console", icon: Shield, highlight: true, roles: ["admin"] },
    { href: "/dashboard", label: "Telemetry Dashboard", icon: LayoutDashboard },
    { href: "/dataset", label: "Pose Library", icon: Database },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Filter visible links strictly according to the active role
  const navLinks = allNavLinks.filter(
    (link) => !link.roles || link.roles.includes(role)
  );

  const roleDisplayName = (r: UserRole) =>
    r === "admin" ? "Project Mentor" : r === "contributor" ? "Team Member" : "Reviewer";

  return (
    <header className="sticky top-0 z-50 bg-white border-b-3 border-[#191A23] px-4 md:px-8">
      {/* Main Clean Navbar (Logo + Active Role + 3-Lined Hamburger Button) */}
      <div className="max-w-7xl mx-auto py-3.5">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Central Drive Status */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-11 h-11 relative rounded-xl border-3 border-[#191A23] bg-white shadow-[3px_3px_0px_0px_#191A23] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all flex items-center justify-center p-1">
                <Image
                  src="/logo.png"
                  alt="YogaSync Logo"
                  width={36}
                  height={36}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-[#191A23]">
                  YogaSync
                </span>
                <span className="bg-[#B9FF66] text-[#191A23] text-[11px] font-black px-2 py-0.5 border-2 border-[#191A23] rounded-md shadow-[1.5px_1.5px_0px_0px_#191A23]">
                  DATASET
                </span>
              </div>
            </Link>

            <span className="text-neutral-300 hidden md:inline font-bold">/</span>

            {/* Central Drive indicator */}
            <div className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-lg border-2 border-[#191A23]">
              <HardDrive className="w-3.5 h-3.5 text-neutral-900" />
              <span>400 GB Central Google Drive</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </div>
          </div>

          {/* Right Section: Active User Chip & Hamburger Button (Only when Authenticated) */}
          <div className="flex items-center gap-3">
            {profile ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg border-2 border-[#191A23] text-[11px] font-black uppercase shadow-[2px_2px_0px_#191A23] ${
                    role === "admin"
                      ? "bg-[#FFE600] text-[#191A23]"
                      : role === "reviewer"
                      ? "bg-[#191A23] text-white"
                      : "bg-[#B9FF66] text-[#191A23]"
                  }`}>
                    {roleDisplayName(role)}
                  </span>
                  <span className="hidden sm:inline font-bold text-xs text-[#191A23]">
                    {profile.full_name}
                  </span>
                </div>

                {/* Prominent 3-Lined Neo-Brutalist Hamburger Button */}
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-3 border-3 border-[#191A23] bg-[#B9FF66] rounded-xl shadow-[3px_3px_0px_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#191A23] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex flex-col justify-center items-center gap-1 w-12 h-12 group"
                  aria-label="Toggle Three-Line Navigation Menu"
                  title="Open Navigation Menu"
                >
                  <span
                    className={`block h-[3.5px] w-6 bg-[#191A23] rounded-full transition-transform duration-200 ${
                      menuOpen ? "rotate-45 translate-y-[7.5px]" : ""
                    }`}
                  />
                  <span
                    className={`block h-[3.5px] w-6 bg-[#191A23] rounded-full transition-opacity duration-200 ${
                      menuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`block h-[3.5px] w-6 bg-[#191A23] rounded-full transition-transform duration-200 ${
                      menuOpen ? "-rotate-45 -translate-y-[7.5px]" : ""
                    }`}
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="neo-badge bg-[#191A23] text-[#B9FF66] text-xs">
                  🔒 AUTH REQUIRED
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-Featured Hamburger Menu Slide-Over Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer Menu Surface */}
          <div className="relative bg-white border-b-4 border-[#191A23] shadow-[0px_10px_0px_#191A23] p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto animate-in slide-in-from-top duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b-3 border-[#191A23] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border-2 border-[#191A23] bg-[#B9FF66] flex items-center justify-center p-1 shadow-[2px_2px_0px_#191A23]">
                  <Image src="/logo.png" alt="YogaSync Logo" width={30} height={30} className="object-contain" />
                </div>
                <div>
                  <div className="font-extrabold text-lg text-[#191A23] uppercase leading-none">
                    YogaSync Portal Menu
                  </div>
                  <div className="text-xs text-neutral-500 font-bold mt-1 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-neutral-700" />
                    400 GB Central Google Drive Active
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-2.5 border-2 border-[#191A23] rounded-xl bg-[#FF6B4A] text-white shadow-[2px_2px_0px_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer font-bold"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authenticated User Status Card */}
            {profile ? (
              <div className="p-4 bg-[#F3F3F3] rounded-2xl border-3 border-[#191A23] shadow-[3px_3px_0px_#191A23] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl border-2 border-[#191A23] flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_#191A23] ${
                    role === "admin"
                      ? "bg-[#FFE600] text-[#191A23]"
                      : role === "reviewer"
                      ? "bg-[#191A23] text-white"
                      : "bg-[#B9FF66] text-[#191A23]"
                  }`}>
                    {profile.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-[#191A23] flex items-center gap-2">
                      {profile.full_name}
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-[#191A23] ${
                        role === "admin"
                          ? "bg-[#FFE600] text-[#191A23]"
                          : role === "reviewer"
                          ? "bg-[#191A23] text-white"
                          : "bg-[#B9FF66] text-[#191A23]"
                      }`}>
                        {roleDisplayName(role)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-neutral-600">
                      {profile.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border-2 border-[#191A23] bg-white text-red-600 hover:bg-red-50 text-xs font-extrabold flex items-center gap-1.5 shadow-[2px_2px_0px_#191A23] transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#B9FF66]/20 rounded-2xl border-2 border-[#191A23] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#191A23]">Not Signed In</div>
                  <div className="text-xs text-neutral-600">Sign in to upload dataset samples or review submissions.</div>
                </div>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="neo-btn neo-btn-primary px-4 py-2 text-xs font-extrabold"
                >
                  Sign In →
                </Link>
              </div>
            )}

            {/* Navigation Links Grid (Filtered by Active Role) */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase text-[#191A23] tracking-wider flex items-center justify-between">
                <span>PAGES AVAILABLE FOR {roleDisplayName(role).toUpperCase()}:</span>
                <span className="text-[11px] font-bold text-neutral-500">
                  {navLinks.length} Permitted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`p-4 font-extrabold text-sm rounded-xl flex items-center justify-between border-3 border-[#191A23] transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#B9FF66] text-[#191A23] shadow-[4px_4px_0px_#191A23] -translate-y-0.5"
                          : link.highlight
                          ? "bg-[#191A23] text-white hover:bg-neutral-800 shadow-[3px_3px_0px_#191A23]"
                          : "bg-white text-[#191A23] hover:bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border-2 border-[#191A23] ${
                          isActive ? "bg-white text-[#191A23]" : link.highlight ? "bg-white/10 text-white" : "bg-[#F3F3F3] text-[#191A23]"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span>{link.label}</span>
                      </div>

                      {link.highlight && (
                        <span className="neo-badge bg-[#B9FF66] text-[#191A23] text-[9px] ml-2">
                          UPLOAD
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Role Authentication Switcher inside Drawer */}
            <div className="space-y-3 pt-4 border-t-3 border-[#191A23]">
              <div className="text-xs font-black uppercase text-[#191A23] tracking-wider">
                AUTHENTICATE AS A DIFFERENT ROLE:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    switchDemoRole("contributor");
                    setMenuOpen(false);
                  }}
                  className={`p-3.5 rounded-xl border-3 border-[#191A23] text-left transition-all cursor-pointer ${
                    role === "contributor"
                      ? "bg-[#B9FF66] shadow-[3px_3px_0px_#191A23] font-bold"
                      : "bg-white hover:bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#191A23] uppercase">
                      👤 Team Member
                    </span>
                    {role === "contributor" && (
                      <span className="text-[10px] font-black bg-[#191A23] text-white px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-600 font-medium mt-1">
                    Ifraaz / Pavani (Upload & Track)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchDemoRole("reviewer");
                    setMenuOpen(false);
                  }}
                  className={`p-3.5 rounded-xl border-3 border-[#191A23] text-left transition-all cursor-pointer ${
                    role === "reviewer"
                      ? "bg-[#191A23] text-white shadow-[3px_3px_0px_#191A23] font-bold"
                      : "bg-white hover:bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs uppercase">
                      🔍 Reviewer
                    </span>
                    {role === "reviewer" && (
                      <span className="text-[10px] font-black bg-[#B9FF66] text-[#191A23] px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`text-[11px] font-medium mt-1 ${role === "reviewer" ? "text-neutral-300" : "text-neutral-600"}`}>
                    Faizan / Nidhishree (Review Queue)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchDemoRole("admin");
                    setMenuOpen(false);
                  }}
                  className={`p-3.5 rounded-xl border-3 border-[#191A23] text-left transition-all cursor-pointer ${
                    role === "admin"
                      ? "bg-[#FFE600] shadow-[3px_3px_0px_#191A23] font-bold"
                      : "bg-white hover:bg-[#F3F3F3] shadow-[2px_2px_0px_#191A23]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#191A23] uppercase">
                      👑 Project Mentor
                    </span>
                    {role === "admin" && (
                      <span className="text-[10px] font-black bg-[#191A23] text-white px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-600 font-medium mt-1">
                    Manasa (Admin Console)
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
