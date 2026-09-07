"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

// ─── Type Definitions ────────────────────────────────────────────────────────

interface SystemSettings {
  id: number;
  maintenance_mode: boolean;
  announcement_text: string;
  announcement_type: "info" | "warning" | "emergency";
  updated_at?: string;
}

export default function SystemControlPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    id: 1,
    maintenance_mode: false,
    announcement_text: "",
    announcement_type: "info",
  });

  const [loading, setLoading] = useState(true);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);

  // Form state for announcement
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

  // ─── 1. Toggle Maintenance Mode Handler ───────────────────────────────────
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

  // ─── 2. Broadcast Announcement Handler ────────────────────────────────────
  const handleBroadcastAnnouncement = async () => {
    if (!announcementText.trim()) {
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
          announcement_text: announcementText.trim(),
          announcement_type: announcementType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gặp sự cố khi lưu thông báo");
      }

      setSettings((prev) => ({
        ...prev,
        announcement_text: announcementText.trim(),
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

  // ─── 3. Download Data Backup Handler ──────────────────────────────────────
  const handleDownloadBackup = async () => {
    setIsDownloadingBackup(true);
    const toastId = toast.loading("Đang tổng hợp dữ liệu và nén tệp sao lưu JSON...");

    try {
      const res = await fetch("/api/system/backup");
      if (!res.ok) {
        throw new Error("Lỗi khi tải tệp sao lưu từ máy chủ");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `backup-ned-hub-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("💾 Đã tải xuống tệp sao lưu JSON thành công!", { id: toastId });
    } catch (err) {
      console.error("Lỗi sao lưu:", err);
      toast.error("Gặp lỗi khi tạo bản sao lưu dữ liệu.", { id: toastId });
    } finally {
      setIsDownloadingBackup(false);
    }
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
              Trung tâm điều khiển hạ tầng N.E.D Wallet, quản trị bảo trì khẩn cấp, phát thanh thông báo và sao lưu dữ liệu
            </p>
          </div>

          {/* Environment Chips */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-[#0F1629] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">Cluster:</span>
              <span className="text-[#14F195] font-bold">Solana Devnet</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#0F1629] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">Database:</span>
              <span className="text-[#9945FF] font-bold">Supabase V2</span>
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
                      Phát thanh banner trực tiếp lên màn hình ví N.E.D Wallet
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

                {/* Announcement Textarea */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Nội dung Thông báo Banner:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Sự kiện Tech4life Check-in đang diễn ra tại Hội trường A. Hãy quét mã nhận NFT ngay!"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full p-3.5 bg-[#0B0F19] text-xs text-white placeholder-slate-500 rounded-xl border border-white/10 focus:border-[#9945FF]/50 focus:outline-none focus:ring-1 focus:ring-[#9945FF]/30 transition-all resize-none"
                  />
                </div>

                {/* Live Preview Banner */}
                {announcementText.trim() && (
                  <div className="p-3 rounded-xl border flex items-center gap-3 bg-[#0B0F19]/80 transition-all animate-fadeIn">
                    <span className="text-lg">
                      {announcementType === "emergency" ? "🚨" : announcementType === "warning" ? "⚠️" : "ℹ️"}
                    </span>
                    <div className="flex-1 text-xs">
                      <span className="font-bold block text-white/90 text-[11px]">
                        PREVIEW BANNER TRÊN N.E.D WALLET:
                      </span>
                      <p
                        className={`text-xs mt-0.5 ${
                          announcementType === "emergency"
                            ? "text-rose-400"
                            : announcementType === "warning"
                            ? "text-amber-400"
                            : "text-sky-400"
                        }`}
                      >
                        {announcementText}
                      </p>
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
                disabled={isBroadcasting || !settings.announcement_text}
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

        {/* ─── Khối 3: Sao lưu Dữ liệu Khẩn cấp (Data Backup - Full Width) ─── */}
        <div className="ned-card p-6 sm:p-8 bg-gradient-to-r from-[#0F1629] via-[#0F1629]/90 to-[#151D33] border-white/15 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Description */}
            <div className="flex items-start gap-4 max-w-3xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-3xl shadow-lg shrink-0">
                💾
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Sao lưu Dữ liệu Khẩn cấp (Data Backup)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20">
                    JSON Engine V2
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Xuất toàn bộ dữ liệu định danh (Users) và lịch sử tiêu hao (Relayer Logs) ra tệp định dạng JSON. Khuyến nghị thực hiện vào cuối ngày sự kiện để lưu trữ offline an toàn.
                </p>

                {/* Specs Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-400 bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
                    <span>👥</span> Bảng users: Đầy đủ ví & thông tin
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
                    <span>⛽</span> Bảng relayer_logs: Toàn bộ lịch sử tài trợ
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                    <span>🔒</span> Tự động gắn nhãn thời gian
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Button */}
            <div className="flex items-center lg:justify-end shrink-0">
              <button
                onClick={handleDownloadBackup}
                disabled={isDownloadingBackup}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white transition-all shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2.5"
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #14F195 100%)",
                  color: "#052e16",
                }}
              >
                {isDownloadingBackup ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#052e16] border-t-transparent rounded-full animate-spin" />
                    <span className="font-extrabold">Đang nén file sao lưu...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="font-black tracking-wide text-xs">Tạo bản sao lưu ngay (Generate Backup)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
