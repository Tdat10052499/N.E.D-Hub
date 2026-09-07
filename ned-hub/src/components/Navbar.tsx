"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { label: "Tổng Quan", href: "/" },
  { label: "Người dùng", href: "/users" },
  { label: "Quản lý ví Relayer", href: "/relayer" },
  { label: "Mini-Apps", href: "/miniapps" },
  { label: "System control", href: "/system" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTabActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="sticky top-0 z-50 px-4 sm:px-8 py-3.5 transition-all"
      style={{
        background: "rgba(11, 15, 25, 0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shadow-lg transition-transform group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                boxShadow: "0 0 20px rgba(153, 69, 255, 0.4)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="2.5" fill="white" />
                <line x1="12" y1="2" x2="12" y2="9.5" stroke="white" strokeWidth="1.5" />
                <line x1="12" y1="14.5" x2="12" y2="22" stroke="white" strokeWidth="1.5" />
                <line x1="20.66" y1="7" x2="14.16" y2="10.75" stroke="white" strokeWidth="1.5" />
                <line x1="9.84" y1="13.25" x2="3.34" y2="17" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
                <span className="gradient-text font-black">N.E.D</span>
                <span className="text-slate-200">Hub</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium -mt-1 tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot inline-block" />
                Solana Web3 Platform
              </span>
            </div>
          </Link>
        </div>

        {/* 5 Standard Navigation Tabs (Pill Flexbox) - Visible on md+ */}
        <div className="hidden md:flex items-center gap-1 bg-[#131b2e]/70 p-1 rounded-xl border border-white/5 shadow-inner">
          {navItems.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? "bg-[#1E293B] text-white shadow-sm border border-white/15 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent font-medium"
                }`}
              >
                <span>{tab.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5"
            aria-label="Search"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          <button
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5"
            aria-label="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#14F195] ring-2 ring-[#0B0F19]" />
          </button>

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/10">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
            >
              AD
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-bold text-slate-200">admin.sol</span>
              <span className="text-[10px] text-emerald-400 font-medium">Relayer Admin</span>
            </div>
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/5"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5 bg-[#0F1629]/95 p-3 rounded-xl border border-white/5">
          {navItems.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-between ${
                  active
                    ? "bg-[#1E293B] text-white font-bold border border-white/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-[0_0_6px_#14F195]" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
