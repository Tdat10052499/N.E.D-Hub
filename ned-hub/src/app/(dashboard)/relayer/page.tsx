"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import toast from "react-hot-toast";
import { connection } from "@/lib/solana";
import Navbar from "@/components/Navbar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RelayerSettings {
  is_active: boolean;
  daily_limit: number;
  alert_threshold: number;
  updated_at?: string;
}

interface RelayerLogItem {
  id: string;
  wallet_address: string;
  username?: string | null;
  action: string;
  amount_sol: number;
  signature: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 16) return addr;
  return addr.slice(0, 8) + "..." + addr.slice(-8);
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

// Action translator to non-tech friendly descriptions
function getActionDetails(action: string) {
  const norm = (action || "").toLowerCase();
  if (norm.includes("mint")) {
    return { title: "Tài trợ phí Mint NFT", icon: "🎟️", category: "mint" };
  }
  if (norm.includes("otp") || norm.includes("verify")) {
    return { title: "Tài trợ phí Xác thực OTP Phone", icon: "🔐", category: "otp" };
  }
  if (norm.includes("name") || norm.includes("username")) {
    return { title: "Tài trợ phí Đăng ký Tên định danh", icon: "👤", category: "username" };
  }
  if (norm.includes("wallet") || norm.includes("auth")) {
    return { title: "Tài trợ phí Khởi tạo Tài khoản Ví Gasless", icon: "⚡", category: "wallet" };
  }
  return { title: "Tài trợ phí Giao dịch On-chain", icon: "🎁", category: "other" };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RelayerPage() {
  const [address, setAddress] = useState("b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz");
  const [balance, setBalance] = useState<number>(19.9998);
  const [logs, setLogs] = useState<RelayerLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Settings State
  const [isActive, setIsActive] = useState<boolean>(true);
  const [dailyLimit, setDailyLimit] = useState<number>(20);
  const [alertThreshold, setAlertThreshold] = useState<number>(2.0);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Top-up State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Airdrop State
  const [airdropping, setAirdropping] = useState(false);

  // Filter for Logs
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  // 1. Fetch Relayer Data & Settings on Mount
  const fetchRelayerData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Fetch both settings and logs/balance in parallel
      const [settingsRes, relayerRes] = await Promise.all([
        fetch("/api/relayer-settings"),
        fetch("/api/relayer"),
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          setIsActive(settingsData.data.is_active ?? true);
          setDailyLimit(Number(settingsData.data.daily_limit ?? 20));
          setAlertThreshold(Number(settingsData.data.alert_threshold ?? 2.0));
        }
      }

      if (relayerRes.ok) {
        const relayerData = await relayerRes.json();
        if (relayerData.success) {
          if (relayerData.address) setAddress(relayerData.address);
          if (typeof relayerData.balance === "number") setBalance(relayerData.balance);
          if (Array.isArray(relayerData.logs)) setLogs(relayerData.logs);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu Relayer:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Poll balance and logs every 10s
  useEffect(() => {
    fetchRelayerData();
    const interval = setInterval(fetchRelayerData, 10000);
    return () => clearInterval(interval);
  }, [fetchRelayerData]);

  // 2. Handle Save Settings to /api/relayer-settings on "Lưu ngay" click
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/relayer-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: isActive,
          daily_limit: dailyLimit,
          alert_threshold: alertThreshold,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể lưu cấu hình");
      }

      toast.success("Đã lưu cấu hình Relayer thành công!", { id: "save-settings-toast" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu";
      toast.error(`Lưu cấu hình thất bại: ${errorMessage}`, { id: "save-settings-toast" });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // 3. Airdrop Devnet Function với try-catch, confirmTransaction và xử lý lỗi Rate-limit 429
  const handleAirdrop = async () => {
    try {
      setAirdropping(true);
      // 1. Hiển thị Toast Loading chờ xử lý
      toast.loading("Đang yêu cầu Airdrop từ Solana Devnet...", { id: "airdrop-toast" });

      // 2. Gọi API requestAirdrop
      const relayerPublicKey = new PublicKey(address || "b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz");
      const signature = await connection.requestAirdrop(relayerPublicKey, 1 * LAMPORTS_PER_SOL);

      // 3. BẮT BUỘC: Chờ mạng lưới xác nhận giao dịch (Confirm)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error("Giao dịch Airdrop bị từ chối trên chuỗi.");
      }

      // 4. Nếu qua bước confirm, hiển thị Toast Thành công và fetch lại số dư
      toast.success("Airdrop thành công! Đã cộng 1 SOL.", { id: "airdrop-toast" });
      await fetchRelayerData(); // Gọi lại hàm cập nhật số dư hiển thị
    } catch (error: any) {
      // 5. Xử lý Catch Error và trích xuất đúng Message từ RPC
      const errorMessage = error?.message || String(error) || "Đã xảy ra lỗi không xác định.";

      // Bắt lỗi đặc thù Rate-limit 429 của Solana Faucet
      if (
        errorMessage.includes("429") ||
        errorMessage.includes("Too Many Requests") ||
        errorMessage.includes("limit") ||
        errorMessage.includes("faucet has run dry") ||
        errorMessage.includes("reached your airdrop limit")
      ) {
        toast.error(
          "Vượt quá giới hạn Airdrop (Rate-limit 429). Faucet đã cạn hoặc bạn đã hết lượt hôm nay. Hãy thử lại sau!",
          { id: "airdrop-toast", duration: 5000 }
        );
      } else {
        // Các lỗi khác
        toast.error(`Airdrop thất bại: ${errorMessage}`, {
          id: "airdrop-toast",
          duration: 5000,
        });
      }
    } finally {
      setAirdropping(false);
    }
  };

  const isLowBalance = balance < alertThreshold;
  const capacityPercent = Math.min(100, Math.max(0, Math.round((balance / dailyLimit) * 100)));
  const solPriceUSD = 145.2;
  const usdValue = (balance * solPriceUSD).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Filtered Logs
  const filteredLogs = logs.filter((item) => {
    if (historyFilter === "all") return true;
    const { category } = getActionDetails(item.action);
    return category === historyFilter;
  });

  // QR Code URL for Top-up Modal
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${address}&color=14F195&bgcolor=0F1629`;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#9945FF] selection:text-white">
      <Navbar />

      <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Quản lý Ví Relayer (Gas Station)
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot" />
                Live RPC & Supabase Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trạm tài trợ phí gas tự động, cấu hình hạn mức ngân sách và giám sát chi tiêu on-chain
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
              onClick={fetchRelayerData}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
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
              <span>{refreshing ? "Đang tải..." : "Làm mới"}</span>
            </button>
          </div>
        </div>

        {/* ─── Hàng 1: 2 Cột (50% - 50%) ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* 1. Khối Tài sản & Hành động (Bên trái, 50% width) */}
          <div className="ned-card ned-card-glow p-6 flex flex-col justify-between h-full relative overflow-hidden">
            {/* Ambient Background Light */}
            <div
              className="absolute -top-16 -right-16 w-64 h-64 pointer-events-none rounded-full"
              style={{
                background: isLowBalance
                  ? "radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(20, 241, 149, 0.2) 0%, transparent 70%)",
              }}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    💳 Trạm Quỹ Gas Station
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Auto-Relay Enabled
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Solana Devnet</span>
              </div>

              {/* ─── Web3 Bank Card Style ─── */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden shadow-2xl border border-white/15 transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(11, 15, 25, 1) 100%)",
                  boxShadow: isLowBalance
                    ? "0 10px 30px rgba(239, 68, 68, 0.25), inset 0 0 20px rgba(239, 68, 68, 0.1)"
                    : "0 10px 30px rgba(20, 241, 149, 0.2), inset 0 0 20px rgba(153, 69, 255, 0.15)",
                }}
              >
                {/* Card Top: EMV Chip & Contactless */}
                <div className="relative z-10 flex items-center justify-between mb-4">
                  {/* Gold EMV Chip */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-8 rounded-md flex flex-col justify-between p-1 shadow-md border border-amber-300/40"
                      style={{
                        background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
                      }}
                    >
                      <div className="w-full h-1 rounded-sm bg-amber-200/50" />
                      <div className="w-full h-1 rounded-sm bg-amber-200/50" />
                      <div className="w-full h-1 rounded-sm bg-amber-200/50" />
                    </div>

                    {/* Contactless waves icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                      <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                      <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                    </svg>
                  </div>

                  {/* Card Brand Header */}
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-black tracking-wider text-white">N.E.D GAS PASS</span>
                    <span className="text-[9px] font-mono text-emerald-400">PLATINUM RELAYER</span>
                  </div>
                </div>

                {/* Card Middle: Super Large SOL Balance */}
                <div className="relative z-10 my-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Số dư SOL khả dụng thực tế
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span
                      className="text-4xl sm:text-5xl font-black tracking-tight"
                      style={{
                        color: isLowBalance ? "#EF4444" : "#14F195",
                        textShadow: isLowBalance
                          ? "0 0 30px rgba(239, 68, 68, 0.45)"
                          : "0 0 30px rgba(20, 241, 149, 0.4)",
                      }}
                    >
                      {loading ? "..." : balance.toFixed(4)}
                    </span>
                    <span className="text-2xl font-black text-slate-300">SOL</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 mt-0.5 block">
                    ≈ ${usdValue} USD ($145.20 / SOL)
                  </span>
                </div>

                {/* Card Bottom: Relayer Address & Card Details */}
                <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">ĐỊA CHỈ VÍ RELAYER:</span>
                    <span className="font-mono text-white text-[11px] font-bold tracking-wider">
                      {truncateAddress(address)}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 font-mono block">MẠNG LƯỚI:</span>
                    <span className="text-[11px] font-bold text-[#9945FF]">SOLANA DEVNET</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 2 Nút hành động nổi bật: Nạp SOL & Airdrop ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              {/* Nút 1: Nạp SOL (Top-up) -> Mở Modal QR Code */}
              <button
                onClick={() => setIsTopUpModalOpen(true)}
                className="py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #14F195 100%)",
                  boxShadow: "0 0 20px rgba(20, 241, 149, 0.35)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Nạp SOL (Top-up QR)</span>
              </button>

              {/* Nút 2: Airdrop 1 SOL (Devnet) */}
              <button
                onClick={handleAirdrop}
                disabled={airdropping}
                className="py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #9945FF 0%, #7C3AED 100%)",
                  boxShadow: "0 0 20px rgba(153, 69, 255, 0.35)",
                }}
              >
                <span className={`text-base ${airdropping ? "animate-spin" : ""}`}>💧</span>
                <span>{airdropping ? "Đang Airdrop..." : "Airdrop +1 SOL (Devnet)"}</span>
              </button>
            </div>
          </div>

          {/* 2. Khối Bảng điều khiển Tài trợ (Bên phải, 50% width) */}
          <div className="ned-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Bảng điều khiển Tài trợ (Sponsorship Control)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tùy chỉnh hạn mức ngân sách, công tắc khẩn cấp và ngưỡng cảnh báo
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#9945FF]/15 text-[#9945FF] border border-[#9945FF]/30">
                    relayer_settings (Supabase)
                  </span>
                </div>
              </div>

              {/* Control Item 1: Thanh trượt Hạn mức (Slider 5 - 50 SOL) */}
              <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>🎯</span> Hạn mức tài trợ mục tiêu (Daily Limit)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-[#14F195] font-mono">
                      {dailyLimit.toFixed(1)} SOL
                    </span>
                    <span className="text-[10px] text-slate-500">/ 50.0 MAX</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="5"
                  max="50"
                  step="0.5"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#14F195]"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                  <span>5.0 SOL</span>
                  <span className="text-emerald-400 font-bold">
                    Khả dụng: {capacityPercent}% ({balance.toFixed(2)} / {dailyLimit.toFixed(1)} SOL)
                  </span>
                  <span>50.0 SOL</span>
                </div>
              </div>

              {/* Control Item 2: Công tắc Tạm dừng (Kill Switch) */}
              <div
                className={`p-4 rounded-xl border transition-all duration-300 mb-4 ${
                  isActive
                    ? "bg-emerald-950/15 border-emerald-500/30"
                    : "bg-rose-950/20 border-rose-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-base">{isActive ? "⚡" : "🛑"}</span>
                      {isActive ? "Trạng thái: Đang tài trợ (Active)" : "Trạng thái: Tạm ngưng (Paused)"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {isActive
                        ? "Hệ thống đang tự động bảo trợ 100% phí gas cho người dùng"
                        : "Tất cả yêu cầu tài trợ gasless sẽ bị tạm ngừng ngay lập tức"}
                    </span>
                  </div>

                  {/* UI Toggle Switch */}
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                      isActive ? "bg-[#14F195]" : "bg-rose-600"
                    }`}
                    aria-label="Toggle Sponsoring"
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        isActive ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Control Item 3: Cảnh báo cạn quỹ (Threshold Input) */}
              <div className="p-4 rounded-xl bg-[#0F1629]/90 border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <span>⚠️</span> Ngưỡng cảnh báo cạn quỹ (Alert Threshold)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Hiển thị cảnh báo đỏ khi số dư ví Relayer tụt xuống dưới mức này
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 bg-black/40 text-center text-xs font-bold text-white rounded-lg border border-white/10 focus:border-[#9945FF] focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">SOL</span>
                  </div>
                </div>

                {isLowBalance && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
                    <span>🚨</span>
                    <span>
                      Số dư hiện tại ({balance.toFixed(4)} SOL) đã thấp hơn ngưỡng cảnh báo {alertThreshold} SOL!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom info & Save Button */}
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Lưu trực tiếp vào bảng relayer_settings (id: 1)
              </span>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 hover:opacity-95 active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                  boxShadow: "0 0 15px rgba(153, 69, 255, 0.3)",
                }}
              >
                {isSaving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Lưu ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Hàng 2: Khối Lịch sử Tiêu dùng (Nửa dưới, full width) ────────────── */}
        <div className="ned-card p-6 flex flex-col gap-4">
          {/* Section Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Lịch sử Tiêu dùng & Tài trợ On-chain
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Supabase relayer_logs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Danh sách các giao dịch gasless thực tế đã được ví Relayer bảo trợ
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 bg-[#0F1629] p-1 rounded-xl border border-white/5">
              {[
                { id: "all", label: `Tất cả (${logs.length})` },
                { id: "mint", label: "Mint NFT" },
                { id: "otp", label: "Xác thực OTP" },
                { id: "username", label: "Đăng ký Tên" },
                { id: "wallet", label: "Tạo ví" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHistoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    historyFilter === tab.id
                      ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1629] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Thời gian</th>
                  <th className="py-3.5 px-4 font-semibold">Sự kiện tài trợ</th>
                  <th className="py-3.5 px-4 font-semibold">Người nhận / Địa chỉ ví</th>
                  <th className="py-3.5 px-4 font-semibold">Phí gas tiêu hao</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Chi tiết Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-40 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded-full" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 w-12 bg-white/5 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">⛽</span>
                        <p className="text-sm font-bold text-white">Chưa có bản ghi giao dịch nào</p>
                        <p className="text-xs text-slate-500">
                          Các giao dịch được tài trợ gasless sẽ tự động xuất hiện tại đây sau khi thực hiện.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item) => {
                    const actionInfo = getActionDetails(item.action);
                    const recipientName = item.username || truncateAddress(item.wallet_address);
                    const spentUSD = (item.amount_sol * solPriceUSD).toFixed(4);

                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Thời gian */}
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>

                        {/* Sự kiện (Thân thiện non-tech) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{actionInfo.icon}</span>
                            <span className="font-bold text-white text-xs">{actionInfo.title}</span>
                          </div>
                        </td>

                        {/* Người nhận */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-emerald-300 text-xs">
                              {recipientName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {truncateAddress(item.wallet_address)}
                            </span>
                          </div>
                        </td>

                        {/* Số SOL tiêu hao */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-rose-400 font-bold text-xs">
                              -{item.amount_sol.toFixed(6)} SOL
                            </span>
                            <span className="text-[10px] text-slate-500">~${spentUSD} USD</span>
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-[#14F195] border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot" />
                            Thành công
                          </span>
                        </td>

                        {/* Chi tiết Tx / Explorer Link */}
                        <td className="py-3.5 px-4 text-right">
                          {item.signature ? (
                            <a
                              href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9945FF] hover:text-[#14F195] hover:underline transition-colors"
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
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>
              Hiển thị <strong className="text-white">{filteredLogs.length}</strong> / {logs.length} sự kiện
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Đồng bộ trực tiếp từ bảng Supabase: relayer_logs
            </span>
          </div>
        </div>
      </main>

      {/* ─── MODAL NẠP SOL (Top-up Modal với QR Code) ─────────────────────────── */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0F1629] border border-white/15 shadow-2xl flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#14F195]/20 flex items-center justify-center text-[#14F195]">
                  💳
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nạp SOL vào ví Relayer</h3>
                  <p className="text-[11px] text-slate-400">Solana Devnet Gas Station Fund</p>
                </div>
              </div>

              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal QR Code */}
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <div className="p-3 rounded-2xl bg-[#0B0F19] border border-white/10 shadow-inner flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="Relayer Wallet QR Code"
                  width={200}
                  height={200}
                  className="rounded-xl"
                />
              </div>
              <span className="text-[11px] text-slate-400">
                Quét mã từ ví Phantom hoặc Solflare để chuyển SOL Devnet
              </span>
            </div>

            {/* Address Box & Copy */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">ĐỊA CHỈ VÍ RELAYER:</span>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/10 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-white break-all select-all">
                  {address}
                </span>
                <button
                  onClick={() => handleCopy(address)}
                  className="px-3 py-1.5 rounded-lg bg-[#14F195]/15 text-[#14F195] hover:bg-[#14F195]/25 border border-[#14F195]/30 text-xs font-bold whitespace-nowrap transition-colors"
                >
                  {copiedAddress ? "✓ Đã chép" : "Copy"}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 rounded-xl bg-white/5 text-[11px] text-slate-300 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span>💡</span>
                <span>Hướng dẫn nhanh:</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Mở ví Solana (Phantom / Solflare), chuyển mạng sang <strong>Devnet</strong>, quét mã QR trên và gửi số lượng SOL bạn muốn bổ sung vào quỹ.
              </p>
            </div>

            {/* Modal Close Button */}
            <button
              onClick={() => setIsTopUpModalOpen(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-colors"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
