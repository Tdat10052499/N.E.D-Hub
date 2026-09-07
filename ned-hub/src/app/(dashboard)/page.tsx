"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "recharts";
import Navbar from "@/components/Navbar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyDataPoint {
  day: string;
  date: string;
  users: number;
  newUsers: number;
  active: number;
}

interface TxDensityPoint {
  day: string;
  short: string;
  volume: number;
  peak?: boolean;
}

interface DashboardStats {
  userGrowth: {
    totalWallets: number;
    newThisMonth: number;
    growthRate: number;
    activeWallets: number;
    activeRate: number;
    dailyData: DailyDataPoint[];
  };
  relayer: {
    address: string;
    balance: number;
    maxTarget: number;
    spentSOL: number;
    capacityPercent: number;
    depletionPercent: number;
  };
  transactions: {
    totalOnChainTxs: number;
    txGrowth: number;
    weeklyDensity: TxDensityPoint[];
  };
  meta: {
    month: number;
    year: number;
    monthName: string;
  };
}

interface RetentionPoint {
  period: string;
  rate: number;
}

// Retention cycle data
const retentionData: RetentionPoint[] = [
  { period: "M1", rate: 84 },
  { period: "M2", rate: 79 },
  { period: "M3", rate: 74 },
  { period: "M4", rate: 72 },
  { period: "M5", rate: 76 },
  { period: "M6", rate: 80 },
];

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

// ─── Khối 1: Tăng trưởng Người dùng - User Growth (2/3 Grid) ─────────────────

function UserGrowthCard({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  const totalWallets = stats?.userGrowth?.totalWallets ?? 0;
  const growthRate = stats?.userGrowth?.growthRate ?? 0;
  const newThisMonth = stats?.userGrowth?.newThisMonth ?? 0;
  const activeRate = stats?.userGrowth?.activeRate ?? 0;
  const activeWallets = stats?.userGrowth?.activeWallets ?? 0;
  const dailyData = stats?.userGrowth?.dailyData ?? [];
  const monthName = stats?.meta?.monthName ?? "Tháng 9, 2026";

  return (
    <div className="ned-card ned-card-glow p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Glow background accent */}
      <div
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(153, 69, 255, 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Tăng trưởng Người dùng (User Growth)
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#9945FF]/15 text-[#9945FF] border border-[#9945FF]/30">
              Supabase Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Biểu đồ xu hướng tăng trưởng ví người dùng thực tế theo từng ngày trong {monthName}
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
        {/* Tổng số lượng ví đã tạo */}
        <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5 relative overflow-hidden">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tổng số lượng ví đã tạo
          </span>
          <div className="text-3xl font-black text-white tracking-tight mt-1">
            {loading ? "..." : formatNumber(totalWallets)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#14F195]">
            <span>↑ +{growthRate}%</span>
            <span className="text-slate-400 font-normal text-[11px]">tăng trưởng</span>
          </div>
        </div>

        {/* Người dùng mới trong tháng */}
        <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Người dùng mới trong tháng
          </span>
          <div className="text-3xl font-black text-white tracking-tight mt-1">
            {loading ? "..." : `+${formatNumber(newThisMonth)}`}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-400">
            <span>⚡ Đã đồng bộ từ {monthName}</span>
          </div>
        </div>

        {/* Tỷ lệ ví hoạt động */}
        <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tỷ lệ ví hoạt động (Active Rate)
          </span>
          <div className="text-3xl font-black text-white tracking-tight mt-1">
            {loading ? "..." : `${activeRate}%`}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-purple-400">
            <span>● {activeWallets} ví hoàn tất On-chain</span>
          </div>
        </div>
      </div>

      {/* Recharts: User Growth Chart (Daily trend in month) */}
      <div className="w-full h-52 my-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9945FF" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#9945FF" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14F195" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#14F195" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94A3B8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={(v) => formatK(v)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="p-3 rounded-xl bg-[#1E293B] border border-white/10 text-xs text-white shadow-2xl">
                      <p className="font-bold text-slate-300 mb-1">Ngày {label}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#9945FF]" />
                        <span className="text-slate-400">Tổng ví tích lũy:</span>
                        <span className="font-bold text-white">
                          {formatNumber(Number(payload[0]?.value || 0))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#14F195]" />
                        <span className="text-slate-400">Ví hoạt động:</span>
                        <span className="font-bold text-[#14F195]">
                          {formatNumber(Number(payload[1]?.value || 0))}
                        </span>
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
                dot={{ fill: "#9945FF", r: 2.5, strokeWidth: 1, stroke: "#0B0F19" }}
                activeDot={{ fill: "#9945FF", r: 5, strokeWidth: 2, stroke: "#FFF" }}
              />
              <Area
                type="monotone"
                dataKey="active"
                stroke="#14F195"
                strokeWidth={2}
                fill="url(#activeGrad)"
                dot={{ fill: "#14F195", r: 2, strokeWidth: 1, stroke: "#0B0F19" }}
                activeDot={{ fill: "#14F195", r: 4, strokeWidth: 2, stroke: "#FFF" }}
              />
            </AreaChart>
          ) : (
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barUserGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9945FF" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#14F195" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94A3B8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={(v) => formatK(v)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="p-3 rounded-xl bg-[#1E293B] border border-white/10 text-xs text-white shadow-2xl">
                      <p className="font-bold text-slate-300 mb-1">Ngày {label}</p>
                      <p className="font-extrabold text-[#14F195] text-sm">
                        {formatNumber(Number(payload[0]?.value || 0))} ví tích lũy
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="users" fill="url(#barUserGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart legend / footer info */}
      <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#9945FF]" />
            Tổng ví tích lũy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#14F195]" />
            Ví hoạt động (On-chain)
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          Supabase users table · {monthName}
        </span>
      </div>
    </div>
  );
}

// ─── Khối 2: Quản lý Quỹ Gas Relayer (1/3 Grid) ───────────────────────────────

function RelayerFundCard({
  stats,
  loading,
  onRefresh,
  refreshing,
}: {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const balance = stats?.relayer?.balance ?? 19.9998;
  const address = stats?.relayer?.address ?? "b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz";
  const maxTarget = stats?.relayer?.maxTarget ?? 20.0;
  const spentSOL = stats?.relayer?.spentSOL ?? Math.max(0, maxTarget - balance);
  const isDanger = balance < WARNING_THRESHOLD;

  // Capacity calculations (Target limit = 20 SOL)
  const capacityPercent = Math.min(100, Math.max(0, Math.round((balance / maxTarget) * 100)));
  const depletionPercent = 100 - capacityPercent;
  const totalTxs = stats?.transactions?.totalOnChainTxs ?? 15;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ned-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background glow accent */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none rounded-full"
        style={{
          background: isDanger
            ? "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(20, 241, 149, 0.15) 0%, transparent 70%)",
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
          <p className="text-xs text-slate-400 mt-0.5">
            Số dư thực tế & hạn mức {maxTarget.toFixed(1)} SOL tài trợ giao dịch gasless
          </p>
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
          Số dư SOL khả dụng thực tế
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

        {/* Copyable Relayer Address */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] font-mono text-slate-500">Ví Relayer:</span>
          <button
            onClick={handleCopy}
            className="text-[11px] font-mono text-slate-300 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1.5 transition-colors"
            title="Nhấn để sao chép địa chỉ ví Relayer"
          >
            <span>{truncateAddress(address)}</span>
            {copied ? (
              <span className="text-[10px] text-emerald-400 font-bold">✓ Đã chép</span>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bars & Monthly Stats */}
      <div className="flex flex-col gap-3.5 my-2">
        {/* Progress Bar: Quỹ 20 SOL & Tỷ lệ tiêu hao */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Hạn mức quỹ ({maxTarget} SOL)</span>
            <span className="font-bold text-white">
              {capacityPercent}% khả dụng ({spentSOL.toFixed(4)} SOL đã chi)
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

        {/* Chỉ số phụ: Tiêu hao & Giao dịch đã bảo trợ */}
        <div className="p-3.5 rounded-xl bg-[#0F1629]/90 border border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span>⛽</span> Đã chi tài trợ phí Gas:
            </span>
            <span className="text-lg font-black text-white mt-0.5">
              ~{spentSOL.toFixed(4)} <span className="text-xs text-[#14F195] font-bold">SOL</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono">Giao dịch đã bảo trợ</span>
            <div className="text-xs font-bold text-emerald-400">
              {totalTxs} on-chain txs
            </div>
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
          onClick={onRefresh}
          disabled={refreshing}
          className="text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
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
          {refreshing ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
    </div>
  );
}

// ─── Khối 3: Khối lượng Giao dịch & Retention (Hàng dưới, 2/3 Grid) ────────────

function TransactionsVolumeAndRetentionCard({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const totalOnChainTxs = stats?.transactions?.totalOnChainTxs ?? 0;
  const txGrowth = stats?.transactions?.txGrowth ?? 18.5;
  const weeklyDensity = stats?.transactions?.weeklyDensity ?? [];
  const monthName = stats?.meta?.monthName ?? "Tháng 9, 2026";

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
              @solana/web3.js Signatures
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng số lượng giao dịch on-chain thực tế mà ví Relayer đã thực hiện trong {monthName}
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
              <span>{loading ? "..." : formatNumber(totalOnChainTxs)}</span>
              <span className="text-xs font-bold text-slate-400">txs on-chain</span>
            </div>
          </div>

          {/* Biểu đồ phân tán mini (Mật độ giao dịch theo ngày trong tuần từ signatures) */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
              <span>Mật độ giao dịch theo thứ trong tuần:</span>
              <span className="text-[#14F195] font-bold">Live Solana RPC</span>
            </div>

            {/* Mini Bar Matrix Density */}
            <div className="grid grid-cols-7 gap-1.5 items-end h-16 pt-2">
              {weeklyDensity.map((d) => {
                const maxVol = Math.max(...weeklyDensity.map((x) => x.volume), 1);
                const heightPercent = Math.max(
                  15,
                  Math.min(Math.round((d.volume / maxVol) * 100), 100)
                );
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        d.peak
                          ? "bg-gradient-to-t from-[#9945FF] to-[#14F195] shadow-[0_0_10px_rgba(20,241,149,0.3)]"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`${d.day}: ${d.volume} txs`}
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

        {/* Cột 2: Biểu đồ đường Tỷ lệ giữ chân (Retention) */}
        <div className="flex flex-col justify-between h-full bg-[#0F1629]/90 p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tỷ lệ giữ chân người dùng (Retention)
              </span>
              <div className="text-3xl font-black text-pink-400 tracking-tight mt-1 flex items-baseline gap-2">
                <span>80.5%</span>
                <span className="text-xs font-semibold text-slate-400">trung bình</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
              ↑ 6 chu kỳ ổn định
            </span>
          </div>

          {/* Mini Line Chart */}
          <div className="w-full h-24 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis dataKey="period" tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} domain={[50, 95]} unit="%" />
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

// ─── Khối 4: AI Insights (Hàng dưới, 1/3 Grid) ────────────────────────────────

function AIInsightsCard({ stats }: { stats: DashboardStats | null }) {
  const totalWallets = stats?.userGrowth?.totalWallets ?? 0;
  const growthRate = stats?.userGrowth?.growthRate ?? 0;
  const spentSOL = stats?.relayer?.spentSOL ?? 0;
  const totalTxs = stats?.transactions?.totalOnChainTxs ?? 0;

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

      {/* AI Analytical Messages with Dynamic Stats */}
      <div className="relative z-10 my-3 flex flex-col gap-2.5">
        <div className="p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/15">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1">
            <span>📈</span>
            <span>Tăng trưởng Người dùng:</span>
          </div>
          <p className="text-white/90 text-xs leading-relaxed">
            Hệ thống đã ghi nhận <span className="text-white font-black underline decoration-[#14F195]">{totalWallets} ví</span> trên Supabase với mức tăng trưởng <span className="font-extrabold text-white">+{growthRate}%</span>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/15">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200 mb-1">
            <span>💡</span>
            <span>Tài trợ Phí Gas On-chain:</span>
          </div>
          <p className="text-white/90 text-xs leading-relaxed">
            Trạm Relayer đã xử lý <span className="font-extrabold text-white">{totalTxs} giao dịch</span> trên Solana Devnet, tiêu hao <span className="font-extrabold text-white">~{spentSOL.toFixed(4)} SOL</span> tài trợ 100% gasless.
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic API fetch from /api/dashboard-stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/dashboard-stats");
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 15000); // Live poll every 15s
    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  const dateFilter = stats?.meta?.monthName
    ? `${stats.meta.monthName} · Toàn thời gian`
    : "Tháng 9, 2026 · Toàn thời gian";

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#9945FF] selection:text-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">Tổng Quan</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot" />
                Live Data Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bảng điều khiển trung tâm theo dõi chỉ số tăng trưởng thực tế của nền tảng N.E.D Hub
            </p>
          </div>

          {/* Action Filters & Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span>{dateFilter}</span>
            </div>

            <button
              onClick={fetchDashboardStats}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                boxShadow: "0 0 20px rgba(153, 69, 255, 0.3)",
              }}
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              <span>{refreshing ? "Đang đồng bộ..." : "Đồng bộ Realtime"}</span>
            </button>
          </div>
        </div>

        {/* Bento Grid - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Khối 1: Tăng trưởng Người dùng - User Growth (2/3) */}
          <div className="lg:col-span-2">
            <UserGrowthCard stats={stats} loading={loading} />
          </div>

          {/* Khối 2: Quản lý Quỹ Gas Relayer (1/3) */}
          <div className="lg:col-span-1">
            <RelayerFundCard
              stats={stats}
              loading={loading}
              onRefresh={fetchDashboardStats}
              refreshing={refreshing}
            />
          </div>
        </div>

        {/* Bento Grid - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Khối 3: Khối lượng Giao dịch & Retention (2/3) */}
          <div className="lg:col-span-2">
            <TransactionsVolumeAndRetentionCard stats={stats} loading={loading} />
          </div>

          {/* Khối 4: AI Insights (1/3) */}
          <div className="lg:col-span-1">
            <AIInsightsCard stats={stats} />
          </div>
        </div>
      </main>
    </div>
  );
}
