"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ─── Types matching actual Supabase Schema ────────────────────────────────────

export interface User {
  id: string;
  username: string | null;
  wallet_address: string | null;
  onboarding_status: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateAddress(addr: string | null): string {
  if (!addr) return "Chưa tạo ví";
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-6);
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

function exportToCSV(data: User[]) {
  if (!data.length) return;

  const headers = [
    "STT",
    "ID",
    "Ten Nguoi Dung (Username)",
    "Dia Chi Vi (Wallet Address)",
    "Trang Thai (Onboarding Status)",
    "Thoi Gian Tao (Created At)",
  ];

  const rows = data.map((item, index) => [
    index + 1,
    `"${item.id}"`,
    `"${(item.username || "Chưa đặt tên").replace(/"/g, '""')}"`,
    `"${item.wallet_address || "Chưa tạo ví"}"`,
    `"${item.onboarding_status}"`,
    `"${formatDate(item.created_at)}"`,
  ]);

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `ned_wallet_users_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const normStatus = (status || "").toLowerCase().trim();

  switch (normStatus) {
    case "minted":
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/60 text-[#14F195] border border-emerald-500/40 shadow-[0_0_12px_rgba(20,241,149,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot" />
          minted (On-chain)
        </span>
      );
    case "name_selected":
    case "name_created":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-950/50 text-blue-300 border border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          name_selected
        </span>
      );
    case "otp_verified":
    case "verified":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          otp_verified
        </span>
      );
    case "auth":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/40">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          {status || "auth"}
        </span>
      );
  }
}

// ─── Main Users Page Component ───────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users from API /api/users
  const fetchUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setUsers(result.data);
      }
    } catch (err) {
      console.error("Lỗi khi nạp dữ liệu người dùng từ /api/users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000); // Live poll every 15s
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Copy wallet address helper
  const handleCopyAddress = (addr: string | null) => {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Search logic: Filter by username, wallet_address, and id
  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      // Filter by Status Tab
      if (statusFilter !== "all" && item.onboarding_status !== statusFilter) {
        return false;
      }
      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchUsername = (item.username || "").toLowerCase().includes(query);
        const matchWallet = (item.wallet_address || "").toLowerCase().includes(query);
        const matchId = (item.id || "").toLowerCase().includes(query);
        return matchUsername || matchWallet || matchId;
      }
      return true;
    });
  }, [users, searchQuery, statusFilter]);

  // Summary counts for the 5 Overview Cards
  const counts = useMemo(() => {
    const total = users.length;
    const minted = users.filter((u) => u.onboarding_status === "minted").length;
    const nameSelected = users.filter((u) => u.onboarding_status === "name_selected").length;
    const otpVerified = users.filter((u) => u.onboarding_status === "otp_verified").length;
    const auth = users.filter((u) => u.onboarding_status === "auth" || !u.onboarding_status).length;

    return { total, minted, nameSelected, otpVerified, auth };
  }, [users]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#9945FF] selection:text-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* 1. Header & Nút hành động */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Quản lý Người dùng (Users)
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#9945FF]/15 text-[#9945FF] border border-[#9945FF]/30">
                Supabase Schema V2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Danh sách tài khoản ví N.E.D Wallet đồng bộ theo trường username và onboarding_status
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
              onClick={() => exportToCSV(filteredUsers)}
              disabled={filteredUsers.length === 0}
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
              <span>Export CSV ({filteredUsers.length})</span>
            </button>
          </div>
        </div>

        {/* 2. Thẻ Thống kê Tổng quan (5 Overview Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Tổng người dùng */}
          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Tổng người dùng</span>
            <div className="text-2xl font-black text-white mt-1">
              {loading ? "..." : counts.total}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Trong bảng users</span>
          </div>

          {/* Đã Mint (On-chain) */}
          <div className="ned-card p-4 flex flex-col justify-between border-emerald-500/20 bg-emerald-950/10">
            <span className="text-[11px] text-emerald-400 font-medium">Đã Mint (On-chain)</span>
            <div className="text-2xl font-black text-[#14F195] mt-1">
              {loading ? "..." : counts.minted}
            </div>
            <span className="text-[10px] text-emerald-500/80 mt-1">onboarding_status: minted</span>
          </div>

          {/* Đã chọn username */}
          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-blue-400 font-medium">Đã chọn username</span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {loading ? "..." : counts.nameSelected}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">name_selected</span>
          </div>

          {/* Đã xác thực OTP */}
          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-amber-400 font-medium">Đã xác thực OTP</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {loading ? "..." : counts.otpVerified}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">otp_verified</span>
          </div>

          {/* Mới Auth */}
          <div className="ned-card p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Mới Auth</span>
            <div className="text-2xl font-black text-slate-300 mt-1">
              {loading ? "..." : counts.auth}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">auth</span>
          </div>
        </div>

        {/* 3. Khu vực Tìm kiếm & Lọc (Search & Filter Bar) */}
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
              placeholder="Tìm theo username hoặc địa chỉ wallet_address..."
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
              { id: "all", label: "Tất cả", count: counts.total },
              { id: "minted", label: "Minted", count: counts.minted },
              { id: "name_selected", label: "Name Selected", count: counts.nameSelected },
              { id: "otp_verified", label: "OTP Verified", count: counts.otpVerified },
              { id: "auth", label: "Auth", count: counts.auth },
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
                      isActive ? "bg-[#9945FF] text-white font-bold" : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              disabled={refreshing}
              title="Làm mới dữ liệu từ /api/users"
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

        {/* 4. Bảng Dữ liệu (Data Table) */}
        <div className="ned-card overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1629] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4 font-semibold w-16">STT</th>
                  <th className="py-3.5 px-4 font-semibold">Tên định danh (username)</th>
                  <th className="py-3.5 px-4 font-semibold">Địa chỉ ví (wallet_address)</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái (onboarding_status)</th>
                  <th className="py-3.5 px-4 font-semibold">Thời gian tạo (created_at)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Khám phá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  // Skeleton Loading Rows
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
                ) : filteredUsers.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 text-xl">
                          🔍
                        </div>
                        <p className="text-sm font-bold text-white">Không tìm thấy người dùng nào</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {searchQuery
                            ? `Không có kết quả khớp với "${searchQuery}" theo username hoặc wallet_address.`
                            : "Chưa có dữ liệu người dùng trong bảng users."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  filteredUsers.map((item, index) => {
                    const isCopied = copiedAddress === item.wallet_address;
                    const displayName = item.username || "Chưa đặt tên";
                    const hasWallet = Boolean(item.wallet_address && item.wallet_address !== "Chưa liên kết ví");

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Cột STT: Hiển thị dạng #01, #02 */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 font-medium">
                          #{String(index + 1).padStart(2, "0")}
                        </td>

                        {/* Cột TÊN ĐỊNH DANH (USERNAME): Avatar tròn tự tạo bằng 2 chữ cái đầu */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow"
                              style={{
                                background:
                                  item.onboarding_status === "minted"
                                    ? "linear-gradient(135deg, #10B981, #14F195)"
                                    : item.onboarding_status === "name_selected"
                                    ? "linear-gradient(135deg, #2563EB, #60A5FA)"
                                    : "linear-gradient(135deg, #6B7280, #9CA3AF)",
                              }}
                            >
                              {displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-xs tracking-tight group-hover:text-[#14F195] transition-colors">
                                {displayName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                                {item.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cột ĐỊA CHỈ VÍ (WALLET_ADDRESS): Rút gọn & nút Copy */}
                        <td className="py-3.5 px-4">
                          {hasWallet ? (
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

                        {/* Cột TRẠNG THÁI (ONBOARDING_STATUS) */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.onboarding_status} />
                        </td>

                        {/* Cột THỜI GIAN TẠO (CREATED_AT): Định dạng HH:mm - DD/MM/YYYY */}
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          {formatDate(item.created_at)}
                        </td>

                        {/* Cột KHÁM PHÁ: Explorer link sang Solana Explorer */}
                        <td className="py-3.5 px-4 text-right">
                          {hasWallet ? (
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

          {/* 5. Chân trang Bảng (Footer) */}
          <div className="bg-[#0F1629] px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              Hiển thị <strong className="text-white">{filteredUsers.length}</strong> / {users.length} người dùng
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Supabase Schema: users (username, onboarding_status)
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
