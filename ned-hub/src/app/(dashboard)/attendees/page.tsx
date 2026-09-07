"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OnboardingStatus = 'auth' | 'otp_verified' | 'name_selected' | 'minted';

export interface Attendee {
  id: string;
  name: string;
  wallet_address: string;
  status: OnboardingStatus;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateAddress(addr: string): string {
  if (!addr || addr === 'Chưa liên kết ví') return addr || '—';
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

function exportToCSV(data: Attendee[]) {
  if (!data.length) return;

  const headers = ['STT', 'ID', 'Ten Dinh Danh (Name)', 'Dia Chi Vi (Wallet Address)', 'Trang Thai (Status)', 'Thoi Gian Tao (Created At)'];
  const rows = data.map((item, index) => [
    index + 1,
    `"${item.id}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.wallet_address}"`,
    `"${item.status}"`,
    `"${formatDate(item.created_at)}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tech4life_attendees_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Navigation Bar ──────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-8 py-3.5"
      style={{
        background: "rgba(11, 15, 25, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
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
            <span className="text-[10px] text-slate-400 font-mono font-medium -mt-1 tracking-wider uppercase">
              Tech4life Event Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Menu Links */}
      <div className="hidden md:flex items-center gap-1 bg-[#131b2e]/60 p-1 rounded-xl border border-white/5">
        <Link
          href="/"
          className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
        >
          Overview
        </Link>
        <Link
          href="/attendees"
          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#1E293B] text-white shadow-sm border border-white/10 transition-all flex items-center gap-1.5"
        >
          <span>Attendees (Khách tham quan)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
          >
            AD
          </div>
          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-xs font-bold text-slate-200">admin.sol</span>
            <span className="text-[10px] text-emerald-400 font-medium">Tech4life Organizer</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: OnboardingStatus }) {
  switch (status) {
    case 'minted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/60 text-[#14F195] border border-emerald-500/40 shadow-[0_0_12px_rgba(20,241,149,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot" />
          Minted (On-chain)
        </span>
      );
    case 'name_selected':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-950/50 text-blue-300 border border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Name Selected
        </span>
      );
    case 'otp_verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          OTP Verified
        </span>
      );
    case 'auth':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/40">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Auth (Đăng nhập)
        </span>
      );
  }
}

// ─── Main Attendees Page ─────────────────────────────────────────────────────

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch attendees from API
  const fetchAttendees = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/attendees");
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setAttendees(result.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách attendees:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendees();
    const interval = setInterval(fetchAttendees, 15000); // Live poll every 15s
    return () => clearInterval(interval);
  }, [fetchAttendees]);

  // Copy wallet address helper
  const handleCopyAddress = (addr: string) => {
    if (!addr || addr === 'Chưa liên kết ví') return;
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Filtered attendees
  const filteredAttendees = useMemo(() => {
    return attendees.filter((item) => {
      // Filter by Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchWallet = item.wallet_address.toLowerCase().includes(query);
        const matchId = item.id.toLowerCase().includes(query);
        return matchName || matchWallet || matchId;
      }
      return true;
    });
  }, [attendees, searchQuery, statusFilter]);

  // Summary counts
  const counts = useMemo(() => {
    const total = attendees.length;
    const minted = attendees.filter((a) => a.status === 'minted').length;
    const nameSelected = attendees.filter((a) => a.status === 'name_selected').length;
    const otpVerified = attendees.filter((a) => a.status === 'otp_verified').length;
    const auth = attendees.filter((a) => a.status === 'auth').length;

    return { total, minted, nameSelected, otpVerified, auth };
  }, [attendees]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#9945FF] selection:text-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Quản lý Attendees
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#9945FF]/15 text-[#9945FF] border border-[#9945FF]/30">
                Tech4life 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tra cứu thông tin, địa chỉ ví và trạng thái On-chain của khách tham quan sự kiện
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Về Dashboard</span>
            </Link>

            <button
              onClick={() => exportToCSV(filteredAttendees)}
              disabled={filteredAttendees.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                boxShadow: "0 0 20px rgba(153, 69, 255, 0.3)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV ({filteredAttendees.length})</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Tổng khách tham quan</span>
            <div className="text-2xl font-black text-white mt-1">
              {counts.total}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Đã đăng ký hệ thống</span>
          </div>

          <div className="ned-card p-4 flex flex-col justify-between border-emerald-500/20 bg-emerald-950/10">
            <span className="text-[11px] text-emerald-400 font-medium">Đã Mint On-chain</span>
            <div className="text-2xl font-black text-[#14F195] mt-1">
              {counts.minted}
            </div>
            <span className="text-[10px] text-emerald-500/80 mt-1">Hoàn tất trải nghiệm</span>
          </div>

          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-blue-400 font-medium">Đã chọn tên ví</span>
            <div className="text-2xl font-black text-blue-300 mt-1">
              {counts.nameSelected}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Chờ ký giao dịch</span>
          </div>

          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-amber-400 font-medium">Đã xác thực OTP</span>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {counts.otpVerified}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Đang chọn tên ví</span>
          </div>

          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Mới Auth</span>
            <div className="text-2xl font-black text-slate-300 mt-1">
              {counts.auth}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Chưa gửi mã OTP</span>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="ned-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên định danh hoặc địa chỉ ví Solana..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0F1629] text-xs text-white placeholder-slate-500 rounded-xl border border-white/10 focus:border-[#9945FF]/50 focus:outline-none focus:ring-1 focus:ring-[#9945FF]/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tất cả', count: counts.total },
              { id: 'minted', label: 'Minted', count: counts.minted },
              { id: 'name_selected', label: 'Name Selected', count: counts.nameSelected },
              { id: 'otp_verified', label: 'OTP Verified', count: counts.otpVerified },
              { id: 'auth', label: 'Auth', count: counts.auth },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#9945FF]/20 text-white border border-[#9945FF]/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-[#9945FF] text-white" : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {/* Refresh Button */}
            <button
              onClick={fetchAttendees}
              disabled={refreshing}
              title="Làm mới dữ liệu"
              className="p-2 ml-1 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#14F195]" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="ned-card overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1629] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4 font-semibold w-16">STT</th>
                  <th className="py-3.5 px-4 font-semibold">Tên định danh (Name)</th>
                  <th className="py-3.5 px-4 font-semibold">Địa chỉ ví (Wallet Address)</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái (Status)</th>
                  <th className="py-3.5 px-4 font-semibold">Thời gian tham gia</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Khám phá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  // Loading Skeleton Rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-6 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-36 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-24 bg-white/5 rounded-full" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 w-12 bg-white/5 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredAttendees.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 text-xl">
                          🔍
                        </div>
                        <p className="text-sm font-bold text-white">Không tìm thấy khách tham quan nào</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {searchQuery
                            ? `Không có kết quả khớp với từ khóa "${searchQuery}". Vui lòng thử lại.`
                            : "Chưa có dữ liệu người dùng được ghi nhận trong phễu."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  filteredAttendees.map((item, index) => {
                    const isCopied = copiedAddress === item.wallet_address;
                    const hasValidWallet = item.wallet_address && item.wallet_address !== 'Chưa liên kết ví';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* STT */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 font-medium">
                          #{String(index + 1).padStart(2, '0')}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow"
                              style={{
                                background:
                                  item.status === 'minted'
                                    ? 'linear-gradient(135deg, #10B981, #14F195)'
                                    : item.status === 'name_selected'
                                    ? 'linear-gradient(135deg, #2563EB, #60A5FA)'
                                    : 'linear-gradient(135deg, #6B7280, #9CA3AF)',
                              }}
                            >
                              {item.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-xs tracking-tight group-hover:text-[#14F195] transition-colors">
                                {item.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                                {item.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Wallet Address */}
                        <td className="py-3.5 px-4">
                          {hasValidWallet ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-300 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                {truncateAddress(item.wallet_address)}
                              </span>
                              <button
                                onClick={() => handleCopyAddress(item.wallet_address)}
                                title="Sao chép địa chỉ ví"
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              >
                                {isCopied ? (
                                  <span className="text-[10px] font-bold text-emerald-400">✓ Đã chép</span>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs italic">
                              Chưa tạo ví
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Created At */}
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          {formatDate(item.created_at)}
                        </td>

                        {/* Actions / Explorer Link */}
                        <td className="py-3.5 px-4 text-right">
                          {hasValidWallet ? (
                            <a
                              href={`https://explorer.solana.com/address/${item.wallet_address}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14F195] hover:underline"
                            >
                              <span>Explorer</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-slate-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-[#0F1629] px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              Hiển thị <strong className="text-white">{filteredAttendees.length}</strong> / {attendees.length} khách tham quan
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Tech4life Solana Live Sync
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
