"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useSolanaNetwork } from "@/context/NetworkContext";

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
  const router = useRouter();
  const { isMainnet } = useSolanaNetwork();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("admin@ned.finance");

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Check current logged in user from Supabase session if available
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isTabActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // ─── Logout Handler ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      setProfileDropdownOpen(false);
      const toastId = toast.loading("Đang đăng xuất khỏi hệ thống...");

      // 1. Supabase auth sign out
      await supabase.auth.signOut();

      // 2. Clear client cookies & localStorage auth tokens
      document.cookie = "ned_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      localStorage.removeItem("ned_user_session");

      toast.success("Đã đăng xuất khỏi Master Hub!", { id: toastId });

      // 3. Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
      toast.error("Gặp sự cố khi đăng xuất.");
      router.push("/login");
    }
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
        {/* Brand Logo & Back to Master Hub */}
        <div className="flex items-center gap-3">
          {/* Back to Master Hub Button */}
          <Link
            href="/hub"
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 group shadow-sm"
            title="Quay lại Cổng điều khiển trung tâm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transform transition-transform group-hover:-translate-x-0.5 text-[#14F195]"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Master Hub</span>
          </Link>

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-xl shadow-lg transition-transform group-hover:scale-105 shrink-0"
              style={{
                background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                boxShadow: "0 0 16px rgba(153, 69, 255, 0.4)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="2.5" fill="white" />
                <line x1="12" y1="2" x2="12" y2="9.5" stroke="white" strokeWidth="1.5" />
                <line x1="12" y1="14.5" x2="12" y2="22" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
                <span className="gradient-text font-black">N.E.D</span>
                <span className="text-slate-200">Hub</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono font-medium -mt-0.5 tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot inline-block" />
                System Control
              </span>
            </div>
          </Link>
        </div>

        {/* 5 Standard Navigation Tabs (Pill Flexbox) - Visible on lg+ */}
        <div className="hidden lg:flex items-center gap-1 bg-[#131b2e]/70 p-1 rounded-xl border border-white/5 shadow-inner">
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

        {/* Right Controls & Profile Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Dynamic Network Chip */}
          <Link
            href="/system"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all ${
              isMainnet
                ? "bg-rose-950/40 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                : "bg-[#0F1629] border-emerald-500/25 text-[#14F195] hover:bg-emerald-500/10"
            }`}
            title="Nhấp để thay đổi cấu hình mạng Solana trong System Control"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isMainnet ? "bg-rose-500 animate-ping" : "bg-[#14F195]"}`} />
            <span>{isMainnet ? "Mainnet-Beta" : "Devnet"}</span>
          </Link>

          {/* Notifications button */}
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

          {/* Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer focus:outline-none"
              aria-label="User Profile Dropdown"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md shrink-0"
                style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
              >
                NW
              </div>
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-xs font-bold text-slate-200 leading-none">admin.wallet</span>
                <span className="text-[10px] text-emerald-400 font-medium leading-none mt-1">
                  Superadmin
                </span>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-slate-400 transition-transform duration-200 ${
                  profileDropdownOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Dropdown Floating Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F1629] border border-white/15 shadow-2xl p-2 z-50 animate-fadeIn">
                {/* User Info Header */}
                <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shadow shrink-0"
                      style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
                    >
                      NW
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-white truncate">admin.wallet</span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">{userEmail}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Mạng kết nối:</span>
                    <span className={`font-bold flex items-center gap-1 ${isMainnet ? "text-rose-400" : "text-[#14F195]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isMainnet ? "bg-rose-500" : "bg-[#14F195]"}`} />
                      {isMainnet ? "Mainnet-Beta" : "Devnet"}
                    </span>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-0.5">
                  <Link
                    href="/hub"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span>Trang Master Hub</span>
                  </Link>

                  <Link
                    href="/system"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                    </svg>
                    <span>Cấu hình System Control</span>
                  </Link>
                </div>

                {/* Separator */}
                <div className="my-1 border-t border-white/10" />

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Đăng xuất (Logout)</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/5"
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
        <div className="lg:hidden mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5 bg-[#0F1629]/95 p-3 rounded-xl border border-white/5">
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
