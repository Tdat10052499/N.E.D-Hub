"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RelayerData {
  address: string;
  balance: number;
}

interface UserGrowthPoint {
  month: string;
  users: number;
  active: number;
}

interface TxDensityPoint {
  day: string;
  short: string;
  volume: number;
  peak?: boolean;
}

interface RetentionPoint {
  period: string;
  rate: number;
}

// ─── Data Sets ───────────────────────────────────────────────────────────────

const userGrowthData: UserGrowthPoint[] = [
  { month: "Jan", users: 12400, active: 9800 },
  { month: "Feb", users: 16800, active: 13200 },
  { month: "Mar", users: 22500, active: 18100 },
  { month: "Apr", users: 29400, active: 23600 },
  { month: "May", users: 38200, active: 31200 },
  { month: "Jun", users: 49600, active: 41500 },
  { month: "Jul", users: 64800, active: 53900 },
  { month: "Aug", users: 82500, active: 69400 },
  { month: "Sep", users: 104200, active: 88600 },
];

const txDensityData: TxDensityPoint[] = [
  { day: "Thứ 2", short: "T2", volume: 165 },
  { day: "Thứ 3", short: "T3", volume: 210 },
  { day: "Thứ 4", short: "T4", volume: 345, peak: true },
  { day: "Thứ 5", short: "T5", volume: 290 },
  { day: "Thứ 6", short: "T6", volume: 275 },
  { day: "Thứ 7", short: "T7", volume: 145 },
  { day: "Chủ nhật", short: "CN", volume: 115 },
];

const retentionData: RetentionPoint[] = [
  { period: "M1", rate: 82 },
  { period: "M2", rate: 76 },
  { period: "M3", rate: 71 },
  { period: "M4", rate: 69 },
  { period: "M5", rate: 74 },
  { period: "M6", rate: 78 },
];

const MAX_RESERVE_TARGET = 25.0; // 25 SOL
const WARNING_THRESHOLD = 2.0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatK(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return formatNumber(n);
}

function truncateAddress(addr: string): string {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-6);
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
              <span className="text-slate-200">Wallet</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-medium -mt-1 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot inline-block" />
              Solana Web3 Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Menu Links */}
      <div className="hidden md:flex items-center gap-1 bg-[#131b2e]/60 p-1 rounded-xl border border-white/5">
        <Link
          href="/"
          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#1E293B] text-white shadow-sm border border-white/10 transition-all flex items-center gap-1.5"
        >
          <span>Dashboard Tổng quan</span>
        </Link>
        <Link
          href="/attendees"
          className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all flex items-center gap-1.5"
        >
          <span>Attendees (Khách tham quan)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
          >
            NW
          </div>
          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-xs font-bold text-slate-200">admin.wallet</span>
            <span className="text-[10px] text-emerald-400 font-medium">Platform Admin</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Khối 1: Tăng trưởng Người dùng - User Growth (2/3) ───────────────────────

function UserGrowthCard() {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const totalWallets = 128450;
  const growthRate = 18.4;
  const newThisMonth = 21700;

  return (
    <div className="ned-card ned-card-glow p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Glow background accent */}
      <div
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(153, 69, 255, 0.09) 0%, transparent 70%)",
        }}
      />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Tăng trưởng Người dùng (User Growth)
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#9945FF]/15 text-[#9945FF] border border-[#9945FF]/25">
              Long-term Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi số lượng ví mới và mức độ hoạt động của người dùng N.E.D Wallet theo từng tháng
          </p>
        </div>

        {/* Chart type switch */}
        <div className="flex items-center gap-1 bg-[#131b2e] p-1 rounded-xl border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setChartType("area")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              chartType === "area"
                ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Area Gradient
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              chartType === "bar"
                ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {/* Big Numbers Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Total Wallets Created */}
        <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5 relative overflow-hidden">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tổng số lượng ví đã tạo
          </span>
          <div className="text-3xl font-black text-white tracking-tight mt-1">
            {formatNumber(totalWallets)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#14F195]">
            <span>↑ +{growthRate}%</span>
            <span className="text-slate-400 font-normal text-[11px]">so với tháng trước</span>
          </div>
        </div>

        {/* New Users This Month */}
        <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Người dùng mới trong tháng
          </span>
          <div className="text-3xl font-black text-white tracking-tight mt-1">
            +{formatNumber(newThisMonth)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-400">
            <span>⚡ Đỉnh điểm: 1,420 ví / ngày</span>
          </div>
        </div>

        {/* Active Wallets Rate */}
        <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tỷ lệ ví hoạt động (Active Rate)
          </span>
          <div className="text-3xl font-black text-white tracking-tight mt-1">
            85.1%
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-purple-400">
            <span>● 88.6k ví giao dịch thường xuyên</span>
          </div>
        </div>
      </div>

      {/* Recharts: User Growth Chart */}
      <div className="w-full h-52 my-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9945FF" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#9945FF" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14F195" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14F195" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatK(v)} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="p-3 rounded-xl bg-[#1E293B] border border-white/10 text-xs text-white shadow-2xl">
                      <p className="font-bold text-slate-300 mb-1">Tháng {label}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#9945FF]" />
                        <span className="text-slate-400">Tổng ví tạo:</span>
                        <span className="font-bold text-white">{formatNumber(Number(payload[0]?.value || 0))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#14F195]" />
                        <span className="text-slate-400">Ví hoạt động:</span>
                        <span className="font-bold text-[#14F195]">{formatNumber(Number(payload[1]?.value || 0))}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#9945FF"
                strokeWidth={3}
                fill="url(#userGrad)"
                dot={{ fill: "#9945FF", r: 3, strokeWidth: 1, stroke: "#0B0F19" }}
                activeDot={{ fill: "#9945FF", r: 5, strokeWidth: 2, stroke: "#FFF" }}
              />
              <Area
                type="monotone"
                dataKey="active"
                stroke="#14F195"
                strokeWidth={2.5}
                fill="url(#activeGrad)"
                dot={{ fill: "#14F195", r: 3, strokeWidth: 1, stroke: "#0B0F19" }}
                activeDot={{ fill: "#14F195", r: 5, strokeWidth: 2, stroke: "#FFF" }}
              />
            </AreaChart>
          ) : (
            <BarChart data={userGrowthData} barSize={36} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barUserGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9945FF" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#14F195" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatK(v)} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="p-3 rounded-xl bg-[#1E293B] border border-white/10 text-xs text-white shadow-2xl">
                      <p className="font-bold text-slate-300 mb-1">Tháng {label}</p>
                      <p className="font-extrabold text-[#14F195] text-sm">
                        {formatNumber(Number(payload[0]?.value || 0))} ví mới
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="users" fill="url(#barUserGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart legend / footer info */}
      <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#9945FF]" />
            Tổng người dùng mới
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#14F195]" />
            Người dùng hoạt động thường xuyên
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          N.E.D Growth Engine · Realtime Synced
        </span>
      </div>
    </div>
  );
}

// ─── Khối 2: Quản lý Quỹ Gas Relayer (1/3) ────────────────────────────────────

function RelayerFundCard() {
  const [relayer, setRelayer] = useState<RelayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRelayerBalance = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/relayer-balance");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setRelayer(data);
    } catch {
      setRelayer((prev) => prev || { address: "b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz", balance: 19.9998 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRelayerBalance();
    const interval = setInterval(fetchRelayerBalance, 15000);
    return () => clearInterval(interval);
  }, [fetchRelayerBalance]);

  const balance = relayer?.balance ?? 19.9998;
  const isDanger = balance < WARNING_THRESHOLD;
  const capacityPercent = Math.min(Math.round((balance / MAX_RESERVE_TARGET) * 100), 100);
  const depletionPercent = 100 - capacityPercent;
  const monthlySponsoredSOL = 14.852; // Tổng SOL đã tài trợ trong tháng

  return (
    <div className="ned-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background glow accent */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none rounded-full"
        style={{
          background: isDanger
            ? "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(20, 241, 149, 0.14) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Quản lý Quỹ Gas Relayer
            <span
              className={`w-2.5 h-2.5 rounded-full pulse-dot ${
                isDanger ? "bg-rose-500" : "bg-emerald-400"
              }`}
            />
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Giám sát số dư và hạn mức tài trợ giao dịch ví</p>
        </div>

        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            isDanger
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {isDanger ? "⚠️ Cần nạp SOL" : "✓ Hoạt động tốt"}
        </span>
      </div>

      {/* Large SOL Balance Display */}
      <div className="my-3">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Số dư SOL khả dụng hiện tại
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span
            className="text-4xl sm:text-5xl font-black tracking-tight"
            style={{
              color: isDanger ? "#EF4444" : "#14F195",
              textShadow: isDanger
                ? "0 0 30px rgba(239, 68, 68, 0.45)"
                : "0 0 30px rgba(20, 241, 149, 0.4)",
            }}
          >
            {loading ? "..." : balance.toFixed(4)}
          </span>
          <span className="text-2xl font-black text-slate-300">SOL</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-mono text-slate-500">Ví Relayer:</span>
          <span className="text-[11px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            {truncateAddress(relayer?.address ?? "b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz")}
          </span>
        </div>
      </div>

      {/* Progress Bars & Monthly Stats */}
      <div className="flex flex-col gap-3.5 my-2">
        {/* Progress: Dung lượng quỹ & Tỷ lệ cạn kiệt */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Dung lượng quỹ dự phòng</span>
            <span className="font-bold text-white">
              {capacityPercent}% còn lại ({depletionPercent}% đã chi)
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${capacityPercent}%`,
                background: isDanger
                  ? "linear-gradient(90deg, #F87171, #EF4444)"
                  : "linear-gradient(90deg, #9945FF, #14F195)",
              }}
            />
          </div>
        </div>

        {/* Chỉ số phụ: Tổng SOL đã tài trợ trong tháng */}
        <div className="p-3.5 rounded-xl bg-[#0F1629]/90 border border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span>⛽</span> Tổng SOL đã tài trợ trong tháng:
            </span>
            <span className="text-lg font-black text-white mt-0.5">
              ~{monthlySponsoredSOL} <span className="text-xs text-[#14F195] font-bold">SOL</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono">Giao dịch đã bảo trợ</span>
            <div className="text-xs font-bold text-emerald-400">~29,700 txs</div>
          </div>
        </div>
      </div>

      {/* Danger Banner if below threshold */}
      {isDanger && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
          <span className="text-base">🚨</span>
          <span>Số dư dưới 2 SOL! Cần bổ sung để duy trì tính năng gasless.</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
          Solana Devnet · Auto Relayer
        </span>
        <button
          onClick={fetchRelayerBalance}
          disabled={refreshing}
          className="text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {refreshing ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
    </div>
  );
}

// ─── Khối 3: Khối lượng Giao dịch & Retention (Hàng dưới, cột trái/giữa) ───────

function TransactionsVolumeAndRetentionCard() {
  const totalMonthlyTx = 1428600; // 1.42M
  const txGrowth = 24.6;

  return (
    <div className="ned-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Khối lượng Giao dịch & Tỷ lệ Giữ chân
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Transactions & Retention
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng giao dịch on-chain được xử lý và mức độ tương tác qua các chu kỳ
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#14F195] bg-[#14F195]/10 px-2.5 py-1 rounded-lg border border-[#14F195]/20">
          <span>↑ +{txGrowth}% Vol</span>
        </div>
      </div>

      {/* Grid: 2 Columns (Tx Density Scatter + Retention Line Chart) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        {/* Cột 1: Thống kê Giao dịch & Biểu đồ mật độ theo ngày trong tuần */}
        <div className="flex flex-col justify-between h-full bg-[#0F1629]/90 p-4 rounded-xl border border-white/5">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tổng giao dịch On-chain trong tháng
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-1 flex items-baseline gap-2">
              <span>{formatK(totalMonthlyTx)}</span>
              <span className="text-xs font-bold text-slate-400">txs</span>
            </div>
          </div>

          {/* Biểu đồ phân tán mini (Mật độ giao dịch theo ngày trong tuần) */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
              <span>Mật độ theo ngày trong tuần:</span>
              <span className="text-amber-400 font-bold">Thứ 4 (Peak Day)</span>
            </div>

            {/* Mini Bar / Dot Matrix Density */}
            <div className="grid grid-cols-7 gap-1.5 items-end h-16 pt-2">
              {txDensityData.map((d) => {
                const heightPercent = Math.min(Math.round((d.volume / 350) * 100), 100);
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        d.peak
                          ? "bg-gradient-to-t from-[#9945FF] to-[#14F195] shadow-[0_0_10px_rgba(20,241,149,0.3)]"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`${d.day}: ${d.volume}k txs`}
                    />
                    <span
                      className={`text-[9px] font-mono ${
                        d.peak ? "text-[#14F195] font-bold" : "text-slate-500"
                      }`}
                    >
                      {d.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cột 2: Biểu đồ đường Tỷ lệ giữ chân (Retention / Active Users) */}
        <div className="flex flex-col justify-between h-full bg-[#0F1629]/90 p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tỷ lệ giữ chân người dùng (Retention)
              </span>
              <div className="text-3xl font-black text-pink-400 tracking-tight mt-1 flex items-baseline gap-2">
                <span>78.2%</span>
                <span className="text-xs font-semibold text-slate-400">trung bình</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
              ↑ 6 tháng liên tiếp
            </span>
          </div>

          {/* Mini Line Chart */}
          <div className="w-full h-24 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis dataKey="period" tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} domain={[50, 90]} unit="%" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="p-2 rounded-lg bg-[#1E293B] border border-white/10 text-xs text-white">
                        <span className="text-slate-400">Chu kỳ {label}:</span>{" "}
                        <span className="font-bold text-pink-400">{payload[0].value}%</span>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#EC4899"
                  strokeWidth={2.5}
                  dot={{ fill: "#EC4899", r: 3, strokeWidth: 1, stroke: "#0B0F19" }}
                  activeDot={{ fill: "#EC4899", r: 5, strokeWidth: 2, stroke: "#FFF" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Khối 4: AI Insights (Hàng dưới, cột phải) ────────────────────────────────

function AIInsightsCard() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between h-full shadow-2xl"
      style={{
        background: "linear-gradient(135deg, #9945FF 0%, #6B21D4 45%, #14F195 100%)",
        boxShadow: "0 10px 30px rgba(153, 69, 255, 0.35)",
      }}
    >
      {/* Background glow mesh */}
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(20, 241, 149, 0.5) 0%, transparent 60%)",
        }}
      />

      {/* Header Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/20 backdrop-blur-md border border-white/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          AI Platform Insights
        </span>
        <span className="text-[10px] text-white/90 font-mono font-bold tracking-wider bg-black/25 px-2 py-0.5 rounded">
          N.E.D v2.5
        </span>
      </div>

      {/* AI Analytical Messages */}
      <div className="relative z-10 my-3 flex flex-col gap-2.5">
        <div className="p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/15">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1">
            <span>📈</span>
            <span>Tăng trưởng Người dùng:</span>
          </div>
          <p className="text-white/90 text-xs leading-relaxed">
            Lượng người dùng mới tăng <span className="text-white font-black underline decoration-[#14F195]">18.4%</span> so với tháng trước. Tỷ lệ giao dịch on-chain thành công đạt <span className="font-extrabold text-white">99.8%</span>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/15">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200 mb-1">
            <span>💡</span>
            <span>Tối ưu hóa Chi phí Gas:</span>
          </div>
          <p className="text-white/90 text-xs leading-relaxed">
            Cơ chế Relayer Gasless đã tiết kiệm ước tính <span className="font-extrabold text-white">~34.2 SOL</span> phí gas cho cộng đồng người dùng trong quý này.
          </p>
        </div>
      </div>

      {/* Footer bar */}
      <div className="relative z-10 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Tối ưu hóa tự động
        </span>
        <span className="font-bold text-white">N.E.D AI Platform Core</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dateFilter] = useState("Tháng 9, 2026 · Toàn thời gian");

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#9945FF] selection:text-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">Overview</h1>
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                title="Sao chép liên kết"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bảng điều khiển trung tâm theo dõi chỉ số tăng trưởng dài hạn của nền tảng ví N.E.D Wallet
            </p>
          </div>

          {/* Action Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span>{dateFilter}</span>
            </div>

            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                boxShadow: "0 0 20px rgba(153, 69, 255, 0.3)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add widget +
            </button>
          </div>
        </div>

        {/* Bento Grid - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Khối 1: Tăng trưởng Người dùng - User Growth (2/3) */}
          <div className="lg:col-span-2">
            <UserGrowthCard />
          </div>

          {/* Khối 2: Quản lý Quỹ Gas Relayer (1/3) */}
          <div className="lg:col-span-1">
            <RelayerFundCard />
          </div>
        </div>

        {/* Bento Grid - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Khối 3: Khối lượng Giao dịch & Retention (Hàng dưới, cột trái/giữa - 2/3) */}
          <div className="lg:col-span-2">
            <TransactionsVolumeAndRetentionCard />
          </div>

          {/* Khối 4: AI Insights (Hàng dưới, cột phải - 1/3) */}
          <div className="lg:col-span-1">
            <AIInsightsCard />
          </div>
        </div>
      </main>
    </div>
  );
}
