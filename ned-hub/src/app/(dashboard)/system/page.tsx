"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";
import { useSolanaNetwork, SolanaNetwork } from "@/context/NetworkContext";

// ─── Type Definitions ────────────────────────────────────────────────────────

interface SystemSettings {
  id: number;
  maintenance_mode: boolean;
  announcement_text: string;
  announcement_type: "info" | "warning" | "emergency";
  solana_network?: "devnet" | "mainnet-beta";
  updated_at?: string;
}

interface BackupFilePayload {
  backup_version?: string;
  export_timestamp?: string;
  platform?: string;
  summary?: {
    total_users?: number;
    total_miniapps?: number;
    has_relayer_settings?: boolean;
    total_relayer_logs?: number;
    exported_at?: string;
  };
  tables?: {
    users?: any[];
    miniapps?: any[];
    relayer_settings?: any[];
    relayer_logs?: any[];
    system_controls?: any[];
  };
  users?: any[];
  miniapps?: any[];
  relayer_settings?: any;
}

const isAnnouncementEmpty = (text: string): boolean => {
  if (!text) return true;
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  return stripped.length === 0;
};

export default function SystemControlPage() {
  const { network, rpcEndpoint, setNetwork, isMainnet } = useSolanaNetwork();

  const [settings, setSettings] = useState<SystemSettings>({
    id: 1,
    maintenance_mode: false,
    announcement_text: "",
    announcement_type: "info",
    solana_network: "devnet",
  });

  const [loading, setLoading] = useState(true);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Solana Network Switch states
  const [showMainnetModal, setShowMainnetModal] = useState(false);
  const [mainnetConfirmText, setMainnetConfirmText] = useState("");
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  // Backup & Restore states
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<BackupFilePayload | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state for announcement (stores raw HTML string)
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "emergency">("info");

  // Fetch current system settings from API GET /api/system
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/system");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
        setAnnouncementText(json.data.announcement_text || "");
        setAnnouncementType(json.data.announcement_type || "info");
      }
    } catch (err) {
      console.error("Lỗi khi tải cấu hình hệ thống:", err);
      toast.error("Không thể tải cấu hình hệ thống từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── 1. Solana Network Switch Handlers ─────────────────────────────────────
  const handleNetworkSelect = async (targetNetwork: SolanaNetwork) => {
    if (targetNetwork === network) return;

    // Danger Protection: If switching to Mainnet-Beta, require Danger Confirmation Modal
    if (targetNetwork === "mainnet-beta") {
      setMainnetConfirmText("");
      setShowMainnetModal(true);
      return;
    }

    // If switching to Devnet, execute directly
    setIsSwitchingNetwork(true);
    const toastId = toast.loading("Đang chuyển hệ thống về mạng Devnet...");
    const success = await setNetwork("devnet");
    setIsSwitchingNetwork(false);

    if (success) {
      toast.success("✅ Đã chuyển hệ thống về mạng Solana Devnet an toàn!", { id: toastId });
      setSettings((prev) => ({ ...prev, solana_network: "devnet" }));
    }
  };

  const handleConfirmMainnetSwitch = async () => {
    if (mainnetConfirmText.trim() !== "MAINNET") {
      toast.error('Vui lòng nhập chính xác từ khóa "MAINNET" để xác nhận!');
      return;
    }

    setIsSwitchingNetwork(true);
    const toastId = toast.loading("Đang chuyển đổi cấu hình sang Solana Mainnet-Beta...");

    const success = await setNetwork("mainnet-beta");
    setIsSwitchingNetwork(false);

    if (success) {
      toast.success("🚀 ĐÃ KÍCH HOẠT SOLANA MAINNET-BETA THÀNH CÔNG!", {
        id: toastId,
        duration: 5000,
      });
      setShowMainnetModal(false);
      setMainnetConfirmText("");
      setSettings((prev) => ({ ...prev, solana_network: "mainnet-beta" }));
    }
  };

  // ─── 2. Toggle Maintenance Mode Handler ───────────────────────────────────
  const handleToggleMaintenance = async () => {
    const nextState = !settings.maintenance_mode;
    setIsSavingMaintenance(true);

    // Optimistic UI update
    setSettings((prev) => ({ ...prev, maintenance_mode: nextState }));

    if (nextState) {
      toast.error("⚠️ ĐÃ KÍCH HOẠT CHẾ ĐỘ BẢO TRÌ TOÀN HỆ THỐNG!", {
        id: "maintenance-toast",
        duration: 4000,
      });
    } else {
      toast.success("✅ Đã tắt bảo trì, hệ thống hoạt động bình thường!", {
        id: "maintenance-toast",
        duration: 3000,
      });
    }

    try {
      const res = await fetch("/api/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance_mode: nextState }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể cập nhật chế độ bảo trì");
      }
    } catch (err) {
      console.error("Lỗi cập nhật bảo trì:", err);
      // Rollback
      setSettings((prev) => ({ ...prev, maintenance_mode: !nextState }));
      toast.error("Lỗi khi lưu trạng thái bảo trì. Đã hoàn tác!", { id: "maintenance-toast" });
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  // ─── 3. Broadcast Announcement Handler (Saves HTML to Supabase) ───────────
  const handleBroadcastAnnouncement = async () => {
    if (isAnnouncementEmpty(announcementText)) {
      toast.error("Vui lòng nhập nội dung thông báo trước khi phát thanh!");
      return;
    }

    setIsBroadcasting(true);
    const toastId = toast.loading("Đang phát thông báo toàn hệ thống...");

    try {
      const res = await fetch("/api/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement_text: announcementText,
          announcement_type: announcementType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gặp sự cố khi lưu thông báo");
      }

      setSettings((prev) => ({
        ...prev,
        announcement_text: announcementText,
        announcement_type: announcementType,
      }));

      toast.success("📢 Đã phát thông báo toàn hệ thống thành công!", { id: toastId });
    } catch (err) {
      console.error("Lỗi phát thông báo:", err);
      toast.error("Không thể phát thông báo tới hệ thống.", { id: toastId });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // ─── Clear Announcement Handler ───────────────────────────────────────────
  const handleClearAnnouncement = async () => {
    setIsBroadcasting(true);
    const toastId = toast.loading("Đang gỡ thông báo hệ thống...");

    try {
      const res = await fetch("/api/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement_text: "",
          announcement_type: "info",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gặp sự cố khi xóa thông báo");
      }

      setAnnouncementText("");
      setAnnouncementType("info");
      setSettings((prev) => ({
        ...prev,
        announcement_text: "",
        announcement_type: "info",
      }));

      toast.success("Đã gỡ bỏ banner thông báo trên ứng dụng.", { id: toastId });
    } catch (err) {
      console.error("Lỗi gỡ thông báo:", err);
      toast.error("Không thể gỡ thông báo.", { id: toastId });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // ─── 4. Download Backup & Reveal File in OS Explorer ───────────────────────
  const handleDownloadBackup = async () => {
    setIsDownloadingBackup(true);
    const toastId = toast.loading("Đang tổng hợp dữ liệu và nén tệp sao lưu JSON...");

    try {
      const res = await fetch("/api/system/backup");
      if (!res.ok) {
        throw new Error("Lỗi khi tạo bản sao lưu từ máy chủ");
      }

      const disposition = res.headers.get("content-disposition");
      let filename = "ned-wallet-backup.json";
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("💾 Đã tải xuống tệp sao lưu JSON!", { id: toastId });

      try {
        await fetch("/api/system/backup/reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename }),
        });
      } catch (revealErr) {
        console.warn("Reveal in File Explorer warning:", revealErr);
      }
    } catch (err) {
      console.error("Lỗi sao lưu:", err);
      toast.error("Gặp lỗi khi tạo bản sao lưu dữ liệu.", { id: toastId });
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  // ─── 5. File Processing & Modal Trigger for Restore ────────────────────────
  const processSelectedFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Vui lòng chọn tệp định dạng .json hợp lệ!");
      return;
    }

    try {
      const text = await file.text();
      const json: BackupFilePayload = JSON.parse(text);

      const hasValidTables =
        json.tables ||
        Array.isArray(json.users) ||
        Array.isArray(json.miniapps) ||
        json.relayer_settings;

      if (!hasValidTables) {
        toast.error("Cấu trúc tệp JSON không khớp với định dạng sao lưu của N.E.D Hub!");
        return;
      }

      setPendingRestoreData(json);
      setSelectedFileName(file.name);
      setRestoreConfirmText("");
      setShowRestoreModal(true);
    } catch (err) {
      console.error("Lỗi đọc tệp JSON:", err);
      toast.error("Tệp JSON bị hỏng hoặc chứa cú pháp không hợp lệ.");
    }
  };

  // ─── 6. Execute Restore via POST /api/system/backup ───────────────────────
  const handleExecuteRestore = async () => {
    if (restoreConfirmText.trim() !== "RESTORE") {
      toast.error('Vui lòng nhập chính xác từ khóa "RESTORE" để xác nhận!');
      return;
    }

    if (!pendingRestoreData) {
      toast.error("Không có dữ liệu sao lưu hợp lệ để khôi phục.");
      return;
    }

    setIsRestoringBackup(true);
    const toastId = toast.loading("Đang khôi phục và đồng bộ dữ liệu vào Supabase...");

    try {
      const res = await fetch("/api/system/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingRestoreData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Quá trình khôi phục thất bại");
      }

      toast.success(
        `✅ Khôi phục thành công! (${result.summary?.users_restored || 0} users, ${
          result.summary?.miniapps_restored || 0
        } apps)`,
        { id: toastId, duration: 5000 }
      );

      setShowRestoreModal(false);
      setPendingRestoreData(null);
      setRestoreConfirmText("");
      fetchSettings();
    } catch (err: any) {
      console.error("Lỗi khi khôi phục dữ liệu:", err);
      toast.error(err.message || "Không thể hoàn tất khôi phục dữ liệu.", { id: toastId });
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const getRestoreUsersCount = () => {
    if (!pendingRestoreData) return 0;
    if (pendingRestoreData.summary?.total_users !== undefined)
      return pendingRestoreData.summary.total_users;
    if (Array.isArray(pendingRestoreData.tables?.users))
      return pendingRestoreData.tables.users.length;
    if (Array.isArray(pendingRestoreData.users)) return pendingRestoreData.users.length;
    return 0;
  };

  const getRestoreMiniAppsCount = () => {
    if (!pendingRestoreData) return 0;
    if (pendingRestoreData.summary?.total_miniapps !== undefined)
      return pendingRestoreData.summary.total_miniapps;
    if (Array.isArray(pendingRestoreData.tables?.miniapps))
      return pendingRestoreData.tables.miniapps.length;
    if (Array.isArray(pendingRestoreData.miniapps)) return pendingRestoreData.miniapps.length;
    return 0;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#9945FF] selection:text-white">
      <Navbar />

      <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                System Control Panel
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                  settings.maintenance_mode
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.maintenance_mode ? "bg-rose-500 animate-ping" : "bg-[#14F195]"
                  }`}
                />
                {settings.maintenance_mode ? "CHẾ ĐỘ BẢO TRÌ ĐANG BẬT" : "HỆ THỐNG HOẠT ĐỘNG"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trung tâm điều khiển hạ tầng N.E.D Wallet, chuyển đổi mạng lưới Solana, bảo trì khẩn cấp, phát thanh và sao lưu
            </p>
          </div>

          {/* Environment Badges */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                isMainnet
                  ? "bg-rose-950/40 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "bg-[#0F1629] border-emerald-500/30 text-[#14F195]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isMainnet ? "bg-rose-500 animate-ping" : "bg-[#14F195]"
                }`}
              />
              <span>{isMainnet ? "Mainnet-Beta (Production)" : "Solana Devnet (Testnet)"}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[#0F1629] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">Database:</span>
              <span className="text-[#9945FF] font-bold">Supabase V2</span>
            </div>
          </div>
        </div>

        {/* ─── Khối Cấu hình Mạng lưới Solana (Devnet / Mainnet-Beta Switch) ─── */}
        <div
          className={`ned-card p-6 sm:p-7 rounded-3xl transition-all duration-300 relative overflow-hidden flex flex-col gap-5 ${
            isMainnet
              ? "border-rose-500/60 bg-gradient-to-r from-rose-950/40 via-[#0F1629] to-[#0F1629] shadow-[0_0_35px_rgba(239,68,68,0.18)]"
              : "border-emerald-500/25 bg-gradient-to-r from-emerald-950/20 via-[#0F1629] to-[#0F1629]"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Info */}
            <div className="flex items-start gap-4 max-w-3xl">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 border ${
                  isMainnet
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                    : "bg-emerald-500/15 border-emerald-500/30 text-[#14F195]"
                }`}
              >
                {isMainnet ? "🔥" : "🌐"}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Cấu hình Mạng lưới Solana (Cluster Environment)
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isMainnet
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-emerald-500/15 text-[#14F195] border-emerald-500/30"
                    }`}
                  >
                    {isMainnet ? "LIVE ON-CHAIN" : "SAFE SANDBOX"}
                  </span>
                </div>

                <p
                  className={`text-xs leading-relaxed font-medium ${
                    isMainnet ? "text-rose-300 font-semibold" : "text-slate-300"
                  }`}
                >
                  {isMainnet
                    ? "⚠️ Hệ thống đang chạy trên mạng chính thức (Mainnet-Beta). Mọi giao dịch tài trợ phí gas của trạm Relayer sẽ tiêu hao SOL thật có giá trị kinh tế."
                    : "Hệ thống đang hoạt động trên môi trường thử nghiệm Solana Devnet. Mọi giao dịch bảo trợ gas sử dụng Devnet SOL giả lập không tốn chi phí thực."}
                </p>

                {/* Network Technical Specs */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-white/5 text-[11px] font-mono flex items-center gap-1.5">
                    <span className="text-slate-500">RPC Endpoint:</span>
                    <span className={isMainnet ? "text-rose-400 font-bold" : "text-[#14F195] font-bold"}>
                      {rpcEndpoint}
                    </span>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-white/5 text-[11px] font-mono flex items-center gap-1.5">
                    <span className="text-slate-500">Relayer Gas Mode:</span>
                    <span className={isMainnet ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      {isMainnet ? "Real SOL Spending" : "Devnet Gasless Sponsoring"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Segmented Control */}
            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Chuyển đổi Môi trường:
              </span>

              {/* Segmented Control UI */}
              <div className="p-1.5 rounded-2xl bg-[#0B0F19] border border-white/10 flex items-center gap-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleNetworkSelect("devnet")}
                  disabled={isSwitchingNetwork}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    !isMainnet
                      ? "bg-emerald-500 text-[#052e16] font-black shadow-lg shadow-emerald-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>Devnet (Thử nghiệm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNetworkSelect("mainnet-beta")}
                  disabled={isSwitchingNetwork}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isMainnet
                      ? "bg-rose-600 text-white font-black shadow-lg shadow-rose-600/30 animate-pulse"
                      : "text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>Mainnet-Beta (Thực tế)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Top 2 Blocks (Grid 2 Cột trên Desktop) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Khối 1: Chế độ Bảo trì (Maintenance Mode - Cột trái) ────── */}
          <div
            className={`ned-card p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
              settings.maintenance_mode
                ? "border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-[#0F1629] to-[#0B0F19] shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                : "border-emerald-500/20 bg-[#0F1629]/90 hover:border-emerald-500/30"
            }`}
          >
            {/* Background Glow */}
            <div
              className={`absolute top-0 right-0 w-64 h-64 blur-3xl pointer-events-none rounded-full transition-all ${
                settings.maintenance_mode ? "bg-rose-500/10" : "bg-emerald-500/5"
              }`}
            />

            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border ${
                      settings.maintenance_mode
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {settings.maintenance_mode ? "🛑" : "🛡️"}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      Chế độ Bảo trì (Maintenance Mode)
                    </h2>
                    <span
                      className={`text-[11px] font-bold tracking-wider uppercase ${
                        settings.maintenance_mode ? "text-rose-400" : "text-[#14F195]"
                      }`}
                    >
                      {settings.maintenance_mode ? "Hệ thống đang bị khóa" : "Toàn bộ dịch vụ sẵn sàng"}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold ${
                    settings.maintenance_mode
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {settings.maintenance_mode ? "ACTIVE / LOCKED" : "NORMAL / ACTIVE"}
                </span>
              </div>

              {/* Description Body */}
              <div className="my-6 flex flex-col gap-4">
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {settings.maintenance_mode ? (
                    <strong className="text-rose-300">
                      Hệ thống đang tạm ngừng cung cấp dịch vụ. Người dùng truy cập N.E.D Wallet sẽ thấy màn hình thông báo bảo trì định kỳ.
                    </strong>
                  ) : (
                    "Đóng băng toàn bộ giao dịch và luồng Onboarding. Hiển thị màn hình bảo trì trên ứng dụng N.E.D Wallet."
                  )}
                </p>

                <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/5 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Luồng Onboarding (Tạo ví Web3):</span>
                    <strong className={settings.maintenance_mode ? "text-rose-400" : "text-[#14F195]"}>
                      {settings.maintenance_mode ? "Tạm khóa (Frozen)" : "Hoạt động bình thường"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Trạm tài trợ Relayer:</span>
                    <strong className={settings.maintenance_mode ? "text-rose-400" : "text-[#14F195]"}>
                      {settings.maintenance_mode ? "Dừng ký bảo trợ Gas" : "Sẵn sàng tài trợ Gas"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Truy cập Mini-Apps:</span>
                    <strong className={settings.maintenance_mode ? "text-rose-400" : "text-[#14F195]"}>
                      {settings.maintenance_mode ? "Chế độ xem tĩnh" : "Đầy đủ quyền tương tác"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Giant Toggle Switch Control */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Công tắc Khẩn cấp
                </span>
                <span className="text-[11px] text-slate-500">
                  {settings.maintenance_mode ? "Gạt sang trái để mở lại hệ thống" : "Gạt sang phải để kích hoạt bảo trì"}
                </span>
              </div>

              {/* Giant Switch UI */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleToggleMaintenance}
                  disabled={isSavingMaintenance || loading}
                  className={`relative w-20 h-10 rounded-full p-1 transition-all duration-300 shadow-inner cursor-pointer focus:outline-none focus:ring-2 ${
                    settings.maintenance_mode
                      ? "bg-rose-600 focus:ring-rose-400/50 shadow-rose-900/50"
                      : "bg-slate-700 hover:bg-slate-600 focus:ring-emerald-400/30"
                  }`}
                  aria-label="Toggle maintenance mode"
                  title="Gạt công tắc bảo trì"
                >
                  <div
                    className={`w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-xs font-bold transform transition-transform duration-300 ${
                      settings.maintenance_mode
                        ? "translate-x-10 text-rose-600"
                        : "translate-x-0 text-slate-700"
                    }`}
                  >
                    {isSavingMaintenance ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                    ) : settings.maintenance_mode ? (
                      "🛑"
                    ) : (
                      "✓"
                    )}
                  </div>
                </button>

                <div className="flex flex-col">
                  <span
                    className={`text-sm font-black tracking-tight transition-colors ${
                      settings.maintenance_mode ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {settings.maintenance_mode ? "ĐANG BẢO TRÌ" : "BẢO TRÌ TẮT"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isSavingMaintenance ? "Đang đồng bộ..." : "Đồng bộ Supabase"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Khối 2: Thông báo Toàn hệ thống (Global Announcement - Cột phải) ── */}
          <div className="ned-card p-6 sm:p-8 flex flex-col justify-between bg-[#0F1629]/90 border-white/10 hover:border-white/20 transition-all">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#9945FF]/15 border border-[#9945FF]/30 text-[#9945FF] flex items-center justify-center text-2xl shadow-lg">
                    📢
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      Thông báo Toàn hệ thống (Global Announcement)
                    </h2>
                    <span className="text-[11px] font-bold text-slate-400">
                      Phát thanh banner định dạng Rich Text lên ví N.E.D Wallet
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Input Body */}
              <div className="my-5 flex flex-col gap-4">
                {/* Announcement Type Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Phân loại Thông báo:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "info", label: "Thông tin (Info)", color: "border-sky-500 text-sky-400 bg-sky-950/30", icon: "ℹ️" },
                      { id: "warning", label: "Cảnh báo (Warning)", color: "border-amber-500 text-amber-400 bg-amber-950/30", icon: "⚠️" },
                      { id: "emergency", label: "Khẩn cấp (Emergency)", color: "border-rose-500 text-rose-400 bg-rose-950/30", icon: "🚨" },
                    ].map((type) => {
                      const isSelected = announcementType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setAnnouncementType(type.id as "info" | "warning" | "emergency")}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                            isSelected
                              ? `${type.color} ring-1 ring-white/20 shadow-md`
                              : "border-white/5 bg-[#0B0F19] text-slate-400 hover:text-slate-200 hover:border-white/10"
                          }`}
                        >
                          <span className="text-base">{type.icon}</span>
                          <span className="text-[11px]">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rich Text Editor Component */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Nội dung Thông báo Banner (Rich Text):
                  </label>
                  <RichTextEditor
                    content={announcementText}
                    onChange={(html) => setAnnouncementText(html)}
                    placeholder="Nhập nội dung thông báo phát thanh..."
                  />
                </div>

                {/* Live Preview Banner */}
                {!isAnnouncementEmpty(announcementText) && (
                  <div className="p-3.5 rounded-xl border border-white/10 flex items-start gap-3 bg-[#0B0F19]/90 transition-all animate-fadeIn">
                    <span className="text-xl shrink-0 mt-0.5">
                      {announcementType === "emergency" ? "🚨" : announcementType === "warning" ? "⚠️" : "ℹ️"}
                    </span>
                    <div className="flex-1 text-xs overflow-hidden">
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/5">
                        <span className="font-bold text-white/90 text-[10px] tracking-wider uppercase">
                          PREVIEW BANNER TRÊN N.E.D WALLET:
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            announcementType === "emergency"
                              ? "bg-rose-500/20 text-rose-300"
                              : announcementType === "warning"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-sky-500/20 text-sky-300"
                          }`}
                        >
                          {announcementType}
                        </span>
                      </div>
                      <div
                        className={`text-xs leading-relaxed break-words preview-content ${
                          announcementType === "emergency"
                            ? "text-rose-300"
                            : announcementType === "warning"
                            ? "text-amber-300"
                            : "text-sky-300"
                        }`}
                        dangerouslySetInnerHTML={{ __html: announcementText }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClearAnnouncement}
                disabled={isBroadcasting || isAnnouncementEmpty(settings.announcement_text)}
                className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Gỡ thông báo</span>
              </button>

              <button
                type="button"
                onClick={handleBroadcastAnnouncement}
                disabled={isBroadcasting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #9945FF 0%, #6366F1 100%)",
                }}
              >
                {isBroadcasting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang phát thanh...</span>
                  </>
                ) : (
                  <>
                    <span>📡 Phát thông báo (Broadcast)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Khối 3: Quản lý Sao lưu & Phục hồi Dữ liệu (Backup & Disaster Recovery) ─── */}
        <div className="ned-card p-6 sm:p-8 bg-gradient-to-r from-[#0F1629] via-[#0F1629]/95 to-[#131B30] border-white/15 shadow-xl relative overflow-hidden flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-2xl shadow-lg shrink-0">
                💾
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Quản lý Sao lưu & Phục hồi Dữ liệu</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20">
                    Disaster Recovery V2
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Xuất bản sao lưu dự phòng toàn bộ bảng dữ liệu hoặc khôi phục dữ liệu từ tệp JSON chuẩn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
                Tables: users · miniapps · relayer_settings
              </span>
            </div>
          </div>

          {/* 2 Phân khu: Trái: Export, Phải: Import */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* ─── Phân khu 1: Export (Xuất file sao lưu) ─────────────────── */}
            <div className="p-6 rounded-2xl bg-[#0B0F19]/80 border border-white/10 flex flex-col justify-between gap-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-[#14F195] flex items-center justify-center text-sm font-bold">
                    ⬇
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Xuất Dữ liệu Toàn hệ thống (Export)
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Trích xuất toàn bộ dữ liệu định danh ví Web3 (<strong className="text-white">users</strong>), danh mục ứng dụng (<strong className="text-white">miniapps</strong>) và cấu hình tài trợ (<strong className="text-white">relayer_settings</strong>) thành tệp JSON đóng gói an toàn.
                </p>

                {/* Export Specs List */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Định dạng file:</span>
                    <span className="text-xs font-mono font-bold text-[#14F195]">.json (UTF-8)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Quy chuẩn đặt tên:</span>
                    <span className="text-[11px] font-mono text-slate-300 truncate" title="ned-wallet-backup-DD-MM-YYYY_HH-mm.json">
                      ned-wallet-backup-*.json
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 text-[11px] text-sky-300 flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <span>
                    <strong>Highlight tự động:</strong> Khi tải xong, hệ thống sẽ gọi API nội bộ kích hoạt mở thư mục Downloads và chọn trực tiếp file trên máy tính của bạn.
                  </span>
                </div>
              </div>

              {/* Nút Tải xuống Backup */}
              <button
                onClick={handleDownloadBackup}
                disabled={isDownloadingBackup}
                className="w-full py-3.5 px-5 rounded-xl text-xs font-bold text-[#052e16] transition-all shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #14F195 100%)",
                }}
              >
                {isDownloadingBackup ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#052e16] border-t-transparent rounded-full animate-spin" />
                    <span className="font-extrabold">Đang trích xuất & nén file JSON...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="font-black text-xs uppercase tracking-wider">Tải xuống Backup (Download)</span>
                  </>
                )}
              </button>
            </div>

            {/* ─── Phân khu 2: Import (Khôi phục dữ liệu qua Drag & Drop) ──── */}
            <div className="p-6 rounded-2xl bg-[#0B0F19]/80 border border-white/10 flex flex-col justify-between gap-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-[#9945FF] flex items-center justify-center text-sm font-bold">
                    ⬆
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Khôi phục Dữ liệu (Import & Restore)
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Kéo thả hoặc tải lên tệp JSON sao lưu đã xuất trước đó để khôi phục trạng thái người dùng và cấu hình trạm Relayer.
                </p>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processSelectedFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    isDraggingFile
                      ? "border-[#9945FF] bg-[#9945FF]/15 scale-[1.01] shadow-[0_0_20px_rgba(153,69,255,0.3)]"
                      : "border-white/20 bg-white/5 hover:border-[#9945FF]/60 hover:bg-[#0F1629]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processSelectedFile(e.target.files[0]);
                      }
                      e.target.value = "";
                    }}
                  />

                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                    📁
                  </div>

                  <div>
                    <span className="text-xs font-bold text-white block">
                      Kéo & thả tệp .json vào đây
                    </span>
                    <span className="text-[11px] text-[#9945FF] font-semibold hover:underline">
                      hoặc nhấp chuột để duyệt tệp từ máy tính
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Hỗ trợ: ned-wallet-backup-*.json
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>🛡️ Xác thực an toàn: Yêu cầu gõ RESTORE trước khi ghi đè</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Danger Modal: Xác nhận chuyển sang Solana Mainnet-Beta ──────────── */}
      {showMainnetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#0F1629] border border-rose-500/60 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col gap-5">
            {/* Warning Header */}
            <div className="flex items-center justify-between pb-4 border-b border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl shadow">
                  🚨
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-400 tracking-tight">
                    CẢNH BÁO CHUYỂN SOLANA MAINNET
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Kích hoạt môi trường thanh toán On-chain thực tế
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowMainnetModal(false);
                  setMainnetConfirmText("");
                }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex flex-col gap-2.5">
                <span className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
                  <span>⚠️</span> Chú ý quan trọng:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Bạn đang yêu cầu chuyển toàn bộ hệ thống sang mạng <strong className="text-rose-400">Solana Mainnet-Beta</strong>. Mọi giao dịch tạo ví, đúc NFT và chuyển token qua trạm Relayer sẽ bắt đầu <strong className="text-white">tiêu hao SOL có giá trị tài chính thực</strong> trong ví tài trợ.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-white/10 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Mạng đích:</span>
                  <span className="text-rose-400 font-bold">Solana Mainnet-Beta</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">RPC Endpoint:</span>
                  <span className="text-slate-300">https://api.mainnet-beta.solana.com</span>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-bold text-slate-200">
                  Vui lòng gõ chính xác chữ <strong className="text-rose-400 font-mono tracking-widest font-black">MAINNET</strong> để xác nhận:
                </label>
                <input
                  type="text"
                  placeholder="Gõ MAINNET vào đây..."
                  value={mainnetConfirmText}
                  onChange={(e) => setMainnetConfirmText(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-[#0B0F19] text-xs font-mono tracking-widest text-white placeholder-slate-600 rounded-xl border border-rose-500/50 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMainnetModal(false);
                  setMainnetConfirmText("");
                }}
                disabled={isSwitchingNetwork}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Hủy bỏ (Giữ Devnet)
              </button>

              <button
                type="button"
                onClick={handleConfirmMainnetSwitch}
                disabled={mainnetConfirmText.trim() !== "MAINNET" || isSwitchingNetwork}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-500 shadow-rose-950/60 cursor-pointer"
              >
                {isSwitchingNetwork ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang chuyển mạng...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Xác nhận Chuyển sang Mainnet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Cảnh báo Ghi đè (Restore Confirmation Modal) ─────────────── */}
      {showRestoreModal && pendingRestoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#0F1629] border border-rose-500/50 shadow-2xl shadow-rose-950/50 flex flex-col gap-5">
            {/* Modal Warning Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xl shadow">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-400 tracking-tight">
                    CẢNH BÁO GHI ĐÈ DỮ LIỆU
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Khôi phục cơ sở dữ liệu từ tệp sao lưu
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setPendingRestoreData(null);
                  setRestoreConfirmText("");
                }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body & File Summary */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-white/10 flex flex-col gap-2">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Tên tệp đã nạp:</span>
                  <span className="font-mono text-white font-bold">{selectedFileName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Thời điểm sao lưu gốc:</span>
                  <span className="font-mono text-slate-300">
                    {pendingRestoreData.export_timestamp
                      ? new Date(pendingRestoreData.export_timestamp).toLocaleString("vi-VN")
                      : "Không xác định"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Số tài khoản (Users) sẽ ghi đè:</span>
                  <span className="font-bold text-[#14F195] font-mono">
                    {getRestoreUsersCount()} bản ghi
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Số Mini-Apps sẽ khôi phục:</span>
                  <span className="font-bold text-[#9945FF] font-mono">
                    {getRestoreMiniAppsCount()} ứng dụng
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                <strong>Hành động có rủi ro cao:</strong> Dữ liệu hiện tại trên Supabase sẽ bị cập nhật hoặc ghi đè (Upsert) hoàn toàn bởi nội dung tệp sao lưu này.
              </div>

              {/* Confirmation Input */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-bold text-slate-200">
                  Nhập chính xác chữ <strong className="text-rose-400 font-mono tracking-widest font-black">RESTORE</strong> để mở khóa nút bấm:
                </label>
                <input
                  type="text"
                  placeholder="Gõ RESTORE vào đây..."
                  value={restoreConfirmText}
                  onChange={(e) => setRestoreConfirmText(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] text-xs font-mono tracking-wider text-white placeholder-slate-600 rounded-xl border border-rose-500/40 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setPendingRestoreData(null);
                  setRestoreConfirmText("");
                }}
                disabled={isRestoringBackup}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoreConfirmText.trim() !== "RESTORE" || isRestoringBackup}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-500 shadow-rose-950/50"
              >
                {isRestoringBackup ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang khôi phục...</span>
                  </>
                ) : (
                  <>
                    <span>⚠️ Xác nhận Khôi phục (Restore)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
