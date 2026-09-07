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
  CartesianGrid,
  Cell,
} from "recharts";


interface RelayerData {
  address: string;
  balance: number;
}

interface FunnelItem {
  step: string;
  label: string;
  value: number;
  color: string;
  subColor: string;
}

// ─── Default Mock Data ───────────────────────────────────────────────────────

const initialFunnelData: FunnelItem[] = [
  { step: "Auth", label: "Đăng nhập", value: 65200, color: "#9945FF", subColor: "#7B35E8" },
  { step: "OTP Verified", label: "Xác thực OTP", value: 54800, color: "#7B35E8", subColor: "#5B21B6" },
  { step: "Name Selected", label: "Chọn tên ví", value: 48600, color: "#3B82F6", subColor: "#2563EB" },
  { step: "Minted", label: "On-chain", value: 38300, color: "#14F195", subColor: "#10B981" },
];

const retentionData = [
  { month: "Jan", rate: 32 },
  { month: "Feb", rate: 28 },
  { month: "Mar", rate: 42 },
  { month: "Apr", rate: 36 },
  { month: "May", rate: 48 },
  { month: "Jun", rate: 44 },
];

const txByDay = [
  { day: "Mon", count: 14 },
  { day: "Tue", count: 18 },
  { day: "Wed", count: 28 },
  { day: "Thu", count: 22 },
  { day: "Fri", count: 24 },
  { day: "Sat", count: 15 },
  { day: "Sun", count: 10 },
];

const customersByDay = [
  { day: "Mon", count: 160 },
  { day: "Tue", count: 190 },
  { day: "Wed", count: 230 },
  { day: "Thu", count: 295 },
  { day: "Fri", count: 210 },
  { day: "Sat", count: 140 },
  { day: "Sun", count: 120 },
];

const MAX_SAFE_BALANCE = 12;
const WARNING_THRESHOLD = 2.0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return formatNumber(n);
}

function truncateAddress(addr: string): string {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-6);
}

// ─── Navigation Bar ──────────────────────────────────────────────────────────

function Navbar() {
  const [activeTab, setActiveTab] = useState("Overview");
  const navItems = [
    { label: "Overview", icon: "📊" },
    { label: "Onboarding Funnel", icon: "⚡" },
    { label: "Relayer Monit", icon: "⛽" },
    { label: "Miniapps", icon: "📱" },
    { label: "System Controls", icon: "⚙️" },
  ];

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5"
      style={{
        background: "rgba(11, 15, 25, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shadow-lg"
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
            Solana Ecosystem
          </span>
        </div>
      </div>

      {/* Menu Links */}
      <div className="flex items-center gap-1 bg-[#131b2e]/60 p-1 rounded-xl border border-white/5">
        {navItems.map((item) => {
          const isActive = activeTab === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#1E293B] text-white shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
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
            AD
          </div>
          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-xs font-bold text-slate-200">admin.sol</span>
            <span className="text-[10px] text-emerald-400 font-medium">Relayer Superuser</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Custom Bar Tooltip ──────────────────────────────────────────────────────

function FunnelCustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: FunnelItem; value: number }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const maxVal = initialFunnelData[0].value;
  const convRate = ((d.value / maxVal) * 100).toFixed(1);

  return (
    <div
      className="p-3 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md text-xs"
      style={{ background: "rgba(17, 24, 39, 0.95)" }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
        <span className="font-bold text-white text-sm">{d.step}</span>
        <span className="text-slate-400">({d.label})</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-black text-white">{formatNumber(d.value)}</span>
        <span className="text-slate-400">users</span>
      </div>
      <div className="mt-1 pt-1.5 border-t border-white/10 flex justify-between gap-4 text-[11px]">
        <span className="text-slate-400">Conversion Rate:</span>
        <span className="font-bold text-emerald-400">{convRate}%</span>
      </div>
    </div>
  );
}

// ─── Card 1: Onboarding Funnel ───────────────────────────────────────────────

function OnboardingFunnelCard() {
  const [funnel, setFunnel] = useState<FunnelItem[]>(initialFunnelData);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Fetch real data from API /api/funnel-stats
  useEffect(() => {
    async function loadFunnelStats() {
      try {
        const res = await fetch("/api/funnel-stats");
        if (!res.ok) throw new Error("Failed to fetch funnel stats");
        const json = await res.json();
        if (json.success && json.data) {
          const { auth, otp_verified, name_selected, minted } = json.data;
          setFunnel([
            { step: "Auth", label: "Đăng nhập", value: auth, color: "#9945FF", subColor: "#7B35E8" },
            { step: "OTP Verified", label: "Xác thực OTP", value: otp_verified, color: "#7B35E8", subColor: "#5B21B6" },
            { step: "Name Selected", label: "Chọn tên ví", value: name_selected, color: "#3B82F6", subColor: "#2563EB" },
            { step: "Minted", label: "On-chain", value: minted, color: "#14F195", subColor: "#10B981" },
          ]);
        }
      } catch {
        // Keep initial fallback values
      }
    }
    loadFunnelStats();
  }, []);

  const handleAiAsk = () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsAiLoading(false);
      setAiResponse(
        "💡 Phân tích N.E.D AI: Tỷ lệ drop-off 11% giữa 'Name Selected' và 'Minted' chủ yếu do độ trễ RPC Devnet ở khung giờ cao điểm (19:00 - 21:00 UTC+7). Khuyến nghị: Bật cơ chế Pre-flight Simulation cache để tăng tốc độ phản hồi ví lên 35%."
      );
    }, 900);
  };

  const maxVal = funnel[0].value;

  return (
    <div className="ned-card ned-card-glow p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Glow highlight */}
      <div
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(153, 69, 255, 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Onboarding Funnel
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#9945FF]/10 text-[#9945FF] border border-[#9945FF]/20">
              Live Flow
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tiến trình chuyển đổi tài khoản Web3 qua các giai đoạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Total volume:</span>
          <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
            {formatNumber(funnel[0].value)} users
          </span>
        </div>
      </div>

      {/* Step Metric Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {funnel.map((item, idx) => {
          const stepConv = idx === 0 ? 100 : Math.round((item.value / funnel[idx - 1].value) * 100);
          const dropOff = idx === 0 ? 0 : 100 - stepConv;

          return (
            <div
              key={item.step}
              className="p-3.5 rounded-xl border border-white/5 bg-[#0F1629]/80 backdrop-blur-sm relative group hover:border-white/15 transition-all"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 font-medium truncate">{item.step}</span>
                {idx > 0 && (
                  <span className="text-[10px] font-bold text-rose-400">-{dropOff}%</span>
                )}
              </div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                {formatK(item.value)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-400">{item.label}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: item.color }}
                >
                  {stepConv}%
                </span>
              </div>
              {/* Mini progress underline */}
              <div className="w-full h-1 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.value / maxVal) * 100}%`,
                    background: `linear-gradient(90deg, ${item.subColor}, ${item.color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="w-full h-44 my-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnel} barSize={52} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="funnelGrad0" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9945FF" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#9945FF" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="funnelGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7B35E8" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#7B35E8" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="funnelGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="funnelGrad3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14F195" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#14F195" stopOpacity={0.25} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
            <XAxis
              dataKey="step"
              tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatK(v)}
            />
            <Tooltip content={<FunnelCustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.03)" }} />
            <Bar dataKey="value" radius={[8, 8, 2, 2]}>
              {funnel.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#funnelGrad${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Assistant Question Box */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="ai-input flex items-center gap-3 px-4 py-2.5 bg-[#0F1629]/90 border border-white/10 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#9945FF] shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span>AI Assistant</span>
          </div>

          <input
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
            placeholder="I want to know what caused the drop-off from Name Selected to /Minted..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
          />

          <button
            onClick={handleAiAsk}
            disabled={isAiLoading}
            className="px-3 py-1 text-xs font-bold rounded-lg text-white transition-all flex items-center gap-1 shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
          >
            {isAiLoading ? "Analyzing..." : "Ask AI"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {aiResponse && (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-200 animate-float-up flex items-start gap-2">
            <span className="text-sm">✨</span>
            <p className="leading-relaxed">{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card 2: Relayer Status (Gas Station Monitor) ───────────────────────────

function RelayerStatusCard() {
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
      // Fallback
      setRelayer((prev) => prev || { address: "b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz", balance: 9.9999 });
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

  const balance = relayer?.balance ?? 9.9999;
  const isDanger = balance < WARNING_THRESHOLD;
  const fundPercentage = Math.min(Math.round((balance / MAX_SAFE_BALANCE) * 100), 100);

  return (
    <div className="ned-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background radial accent */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 pointer-events-none rounded-full"
        style={{
          background: isDanger
            ? "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(20, 241, 149, 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Relayer Status
            <span
              className={`w-2 h-2 rounded-full pulse-dot ${
                isDanger ? "bg-rose-500" : "bg-emerald-400"
              }`}
            />
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Solana Devnet Gas Station Fund</p>
        </div>

        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            isDanger
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {isDanger ? "⚠️ Low Balance" : "✓ Active Healthy"}
        </span>
      </div>

      {/* Main Balance Display */}
      <div className="my-3">
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl sm:text-5xl font-black tracking-tight"
            style={{
              color: isDanger ? "#EF4444" : "#14F195",
              textShadow: isDanger
                ? "0 0 25px rgba(239, 68, 68, 0.4)"
                : "0 0 25px rgba(20, 241, 149, 0.35)",
            }}
          >
            {loading ? "..." : balance.toFixed(4)}
          </span>
          <span className="text-xl font-bold text-slate-400">SOL</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-mono text-slate-500">Address:</span>
          <span className="text-[11px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            {truncateAddress(relayer?.address ?? "b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz")}
          </span>
        </div>
      </div>

      {/* Fund Breakdown & Threshold Bars */}
      <div className="flex flex-col gap-3 my-2">
        {/* Progress 1: Quỹ khả dụng */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">Khả dụng tài trợ</span>
            <span className="font-bold text-white">{fundPercentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${fundPercentage}%`,
                background: isDanger
                  ? "linear-gradient(90deg, #F87171, #EF4444)"
                  : "linear-gradient(90deg, #9945FF, #14F195)",
              }}
            />
          </div>
        </div>

        {/* Progress 2: Ngưỡng cảnh báo */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">Ngưỡng an toàn tối thiểu</span>
            <span className="text-slate-300 font-mono text-[11px]">{WARNING_THRESHOLD} SOL</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-rose-500/70"
              style={{ width: `${(WARNING_THRESHOLD / MAX_SAFE_BALANCE) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Red Alert Banner if below threshold */}
      {isDanger && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <span>🚨</span>
          <span>Số dư dưới 2 SOL! Cần nạp thêm để duy trì tài trợ gas.</span>
        </div>
      )}

      {/* Card Footer / Refresh */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
          RPC: Solana Devnet
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
          {refreshing ? "Updating..." : "Cập nhật"}
        </button>
      </div>
    </div>
  );
}

// ─── Card 3: Retention (Tỷ lệ giữ chân) ───────────────────────────────────────

function RetentionCard() {
  return (
    <div className="ned-card p-6 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Retention</h2>
          <p className="text-xs text-slate-400">Tỷ lệ giữ chân người dùng hàng tháng</p>
        </div>
        <span className="text-xs font-bold text-pink-400 px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/20">
          +4% vs May
        </span>
      </div>

      <div className="my-2 flex items-baseline gap-2">
        <span className="text-4xl font-black text-white">42%</span>
        <span className="text-xs text-slate-400">avg retention rate</span>
      </div>

      <div className="w-full h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={retentionData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EC4899" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#EC4899" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
            <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} domain={[20, 55]} unit="%" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="p-2 rounded-lg bg-[#1E293B] border border-white/10 text-xs text-white">
                    <span className="text-slate-400">{label}:</span>{" "}
                    <span className="font-bold text-pink-400">{payload[0].value}%</span>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#EC4899"
              strokeWidth={3}
              fill="url(#retentionGrad)"
              dot={{ fill: "#EC4899", r: 4, strokeWidth: 2, stroke: "#0B0F19" }}
              activeDot={{ fill: "#EC4899", r: 6, strokeWidth: 3, stroke: "#FFF" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Dot Matrix Component ────────────────────────────────────────────────────

function DotMatrixGrid({ data, color, max }: { data: { day: string; count: number }[]; color: string; max: number }) {
  const ROWS = 5;
  return (
    <div className="flex items-end gap-1.5">
      {data.map((item, colIdx) => {
        const filled = Math.round((item.count / max) * ROWS);
        return (
          <div key={colIdx} className="flex flex-col gap-1 items-center">
            {Array.from({ length: ROWS }).map((_, rowIdx) => {
              const isFilled = ROWS - 1 - rowIdx < filled;
              return (
                <div
                  key={rowIdx}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: isFilled ? color : "rgba(255, 255, 255, 0.08)",
                    boxShadow: isFilled ? `0 0 6px ${color}80` : "none",
                  }}
                />
              );
            })}
            <span className="text-[9px] text-slate-500 mt-1 font-mono">{item.day[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card 4: Transactions & Customers (Stacked) ──────────────────────────────

function TransactionsAndCustomersCard() {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Transactions */}
      <div className="ned-card p-4 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Transactions</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Peak:</span>
            <span className="text-white font-bold">Wed</span>
          </div>
        </div>
        <div className="flex items-end justify-between mt-1">
          <div>
            <div className="text-2xl font-black text-white">106k</div>
            <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
              +34,002 <span className="text-slate-500 font-normal">vs last week</span>
            </div>
          </div>
          <DotMatrixGrid data={txByDay} color="#14F195" max={30} />
        </div>
      </div>

      {/* Customers */}
      <div className="ned-card p-4 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Customers</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Highest:</span>
            <span className="text-white font-bold">Thu</span>
          </div>
        </div>
        <div className="flex items-end justify-between mt-1">
          <div>
            <div className="text-2xl font-black text-white">1,284</div>
            <div className="text-[11px] font-semibold text-indigo-400 mt-0.5">
              +320 <span className="text-slate-500 font-normal">vs last week</span>
            </div>
          </div>
          <DotMatrixGrid data={customersByDay} color="#818CF8" max={320} />
        </div>
      </div>
    </div>
  );
}

// ─── Card 5: AI Insights Card (Gradient Hero) ────────────────────────────────

function AIInsightsCard() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between h-full shadow-2xl"
      style={{
        background: "linear-gradient(135deg, #9945FF 0%, #6B21D4 45%, #14F195 100%)",
        boxShadow: "0 10px 30px rgba(153, 69, 255, 0.35)",
      }}
    >
      {/* Background glow effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(20, 241, 149, 0.4) 0%, transparent 60%)",
        }}
      />

      {/* Header Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/20 backdrop-blur-md border border-white/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          AI Insights
        </span>
        <span className="text-[10px] text-white/80 font-mono font-bold tracking-wider">N.E.D v2.4</span>
      </div>

      {/* Huge Percentage */}
      <div className="relative z-10 my-3">
        <div className="text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
          75%
        </div>
        <div className="text-white font-extrabold text-base mt-2">
          Gas Optimization Rate
        </div>
        <p className="text-white/85 text-xs mt-1.5 leading-relaxed">
          N.E.D AI đã tự động gộp các transaction signature và giảm chi phí gas tài trợ xuống{" "}
          <span className="text-white font-black underline decoration-emerald-300">23%</span> trong tuần qua.
        </p>
      </div>

      {/* Footer bar */}
      <div className="relative z-10 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/80">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Tiết kiệm ~0.42 SOL / tuần
        </span>
        <span className="font-semibold text-white">Tối ưu tự động</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dateFilter] = useState("Jan 01 – Jul 31");

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
                title="Copy Overview Link"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trung tâm giám sát Onboarding người dùng & Trạm tài trợ Gas Solana N.E.D Hub
            </p>
          </div>

          {/* Action Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{dateFilter}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
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
          {/* Onboarding Funnel (2/3) */}
          <div className="lg:col-span-2">
            <OnboardingFunnelCard />
          </div>

          {/* Relayer Status (1/3) */}
          <div className="lg:col-span-1">
            <RelayerStatusCard />
          </div>
        </div>

        {/* Bento Grid - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Retention Chart (1/3) */}
          <div className="md:col-span-1">
            <RetentionCard />
          </div>

          {/* Transactions & Customers (1/3) */}
          <div className="md:col-span-1">
            <TransactionsAndCustomersCard />
          </div>

          {/* AI Insights (1/3) */}
          <div className="md:col-span-1">
            <AIInsightsCard />
          </div>
        </div>
      </main>
    </div>
  );
}
