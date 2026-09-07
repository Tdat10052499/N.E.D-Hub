"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MiniAppItem {
  id: string;
  icon: string;
  icon_gradient?: string;
  iconGradient?: string;
  title: string;
  builder_name?: string;
  builderName?: string;
  builder_avatar?: string;
  builderAvatar?: string;
  description: string;
  version: string;
  category?: string;
  active_users?: string;
  activeUsers?: string;
  is_visible?: boolean;
  isVisible?: boolean;
  created_at?: string;
}

// ─── Helper accessors for unified snake_case / camelCase support ─────────────

const getIsVisible = (app: MiniAppItem): boolean => {
  if (typeof app.is_visible === "boolean") return app.is_visible;
  if (typeof app.isVisible === "boolean") return app.isVisible;
  return true;
};

const getBuilderName = (app: MiniAppItem): string => {
  return app.builder_name || app.builderName || "Ecosystem Partner";
};

const getBuilderAvatar = (app: MiniAppItem): string => {
  return app.builder_avatar || app.builderAvatar || app.title.slice(0, 2).toUpperCase();
};

const getIconGradient = (app: MiniAppItem): string => {
  return app.icon_gradient || app.iconGradient || "linear-gradient(135deg, #9945FF 0%, #6366F1 100%)";
};

const getActiveUsers = (app: MiniAppItem): string => {
  return app.active_users || app.activeUsers || "1,200+ users";
};

const getCategory = (app: MiniAppItem): string => {
  return app.category || "Utility & Tool";
};

// ─── Main Mini-Apps Page ──────────────────────────────────────────────────────

export default function MiniAppsPage() {
  const [apps, setApps] = useState<MiniAppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState<MiniAppItem | null>(null);

  // 1. Fetch Mini-Apps from API GET /api/miniapps
  const fetchMiniApps = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch("/api/miniapps");
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setApps(result.data);
      } else {
        toast.error("Không thể tải danh sách Mini-Apps từ Supabase.");
      }
    } catch (err) {
      console.error("Lỗi khi tải Mini-Apps:", err);
      toast.error("Lỗi kết nối API Mini-Apps.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMiniApps();
  }, [fetchMiniApps]);

  // 2. Toggle Visibility Handler (Optimistic UI + PATCH /api/miniapps)
  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // Optimistic UI Update: update state immediately
    setApps((prev) =>
      prev.map((app) =>
        app.id === id
          ? { ...app, is_visible: nextStatus, isVisible: nextStatus }
          : app
      )
    );

    // If modal is open for this app, update modal state too
    setSelectedApp((prev) =>
      prev && prev.id === id
        ? { ...prev, is_visible: nextStatus, isVisible: nextStatus }
        : prev
    );

    toast.success("Đã cập nhật trạng thái Mini-App!", { id: `toggle-${id}` });

    try {
      const res = await fetch("/api/miniapps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error("Lỗi cập nhật Mini-App:", err);
      // Rollback on failure
      setApps((prev) =>
        prev.map((app) =>
          app.id === id
            ? { ...app, is_visible: currentStatus, isVisible: currentStatus }
            : app
        )
      );
      setSelectedApp((prev) =>
        prev && prev.id === id
          ? { ...prev, is_visible: currentStatus, isVisible: currentStatus }
          : prev
      );
      toast.error("Không thể lưu trạng thái. Đã hoàn tác!", { id: `toggle-${id}` });
    }
  };

  // 3. Filtered Apps based on Search & Status Pill
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const visible = getIsVisible(app);

      // Filter by Status Tab
      if (statusFilter === "visible" && !visible) return false;
      if (statusFilter === "hidden" && visible) return false;

      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = (app.title || "").toLowerCase().includes(query);
        const matchBuilder = getBuilderName(app).toLowerCase().includes(query);
        const matchCategory = getCategory(app).toLowerCase().includes(query);
        return matchTitle || matchBuilder || matchCategory;
      }
      return true;
    });
  }, [apps, searchQuery, statusFilter]);

  // Counts Calculation
  const counts = useMemo(() => {
    const total = apps.length;
    const visible = apps.filter((a) => getIsVisible(a)).length;
    const hidden = apps.filter((a) => !getIsVisible(a)).length;
    return { total, visible, hidden };
  }, [apps]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#9945FF] selection:text-white">
      <Navbar />

      <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Quản lý Mini-Apps (App Store)
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#9945FF]/15 text-[#9945FF] border border-[#9945FF]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] pulse-dot" />
                Live Supabase Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Hệ sinh thái ứng dụng phi tập trung, phân quyền hiển thị và tiện ích tích hợp trên N.E.D Wallet
            </p>
          </div>

          {/* KPI Summary Badges & Sync Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMiniApps(true)}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-[#0F1629] hover:bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
              title="Làm mới dữ liệu từ Supabase"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isRefreshing ? "animate-spin text-[#14F195]" : ""}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{isRefreshing ? "Đang đồng bộ..." : "Đồng bộ"}</span>
            </button>

            <div className="px-3.5 py-2 rounded-xl bg-[#0F1629] border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">Tổng ứng dụng:</span>
              <strong className="text-white font-mono">{counts.total}</strong>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
              <span>{counts.visible} hiển thị</span>
            </div>
          </div>
        </div>

        {/* 1. Thanh công cụ (Top Bar: Search & Pill Filters) */}
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
              placeholder="Tìm kiếm MiniApp hoặc Builder..."
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

          {/* Pill Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "Tất cả", count: counts.total },
              { id: "visible", label: "Đang hiển thị", count: counts.visible },
              { id: "hidden", label: "Đã ẩn", count: counts.hidden },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as "all" | "visible" | "hidden")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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
          </div>
        </div>

        {/* 2. Lưới thẻ ứng dụng (App Grid Layout - 3 Cột trên Desktop) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="ned-card p-6 flex flex-col justify-between h-[280px] animate-pulse"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5" />
                      <div className="flex flex-col gap-2">
                        <div className="w-32 h-4 rounded bg-white/10" />
                        <div className="w-20 h-3 rounded bg-white/5" />
                      </div>
                    </div>
                    <div className="w-12 h-5 rounded bg-white/5" />
                  </div>
                  <div className="flex flex-col gap-2.5 my-3">
                    <div className="w-24 h-3 rounded bg-white/5" />
                    <div className="w-full h-3 rounded bg-white/5" />
                    <div className="w-3/4 h-3 rounded bg-white/5" />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="w-24 h-6 rounded-full bg-white/5" />
                  <div className="w-24 h-7 rounded-xl bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="ned-card p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-base font-bold text-white">Không tìm thấy Mini-App nào</p>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery
                ? `Không có ứng dụng nào khớp với từ khóa tìm kiếm "${searchQuery}". Hãy thử lại với từ khóa khác.`
                : "Danh mục Mini-Apps hiện đang trống."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => {
              const visible = getIsVisible(app);
              const builder = getBuilderName(app);
              const avatar = getBuilderAvatar(app);
              const gradient = getIconGradient(app);
              const activeUsers = getActiveUsers(app);
              const category = getCategory(app);

              return (
                /* 3. Thiết kế Thẻ Ứng dụng (MiniApp Card) */
                <div
                  key={app.id}
                  className={`ned-card p-6 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                    visible
                      ? "border-white/10 hover:border-white/20 shadow-md"
                      : "opacity-75 border-slate-800 bg-[#0B0F19]/90"
                  }`}
                >
                  {/* ─── Header: Icon, Tiêu đề, Badge Version ─── */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Icon Lớn */}
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0 border border-white/15"
                          style={{ background: gradient }}
                        >
                          {app.icon || "📱"}
                        </div>

                        {/* Tiêu đề App & Category */}
                        <div className="flex flex-col">
                          <h3 className="text-base font-black text-white tracking-tight">
                            {app.title}
                          </h3>
                          <span className="text-[10px] uppercase font-bold text-[#14F195] tracking-wider mt-0.5">
                            {category}
                          </span>
                        </div>
                      </div>

                      {/* Badge Version góc phải */}
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300 font-semibold shrink-0">
                        {app.version || "v1.0.0"}
                      </span>
                    </div>

                    {/* ─── Body: Builder, Avatar, Description ─── */}
                    <div className="my-3 flex flex-col gap-2">
                      {/* Builder Info */}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm"
                          style={{ background: "linear-gradient(135deg, #6B7280, #374151)" }}
                        >
                          {avatar}
                        </div>
                        <span className="text-[11px] font-medium text-slate-300">
                          Built by <strong className="text-white font-semibold">{builder}</strong>
                        </span>
                      </div>

                      {/* Mô tả ngắn 2-3 dòng (line-clamp-2) */}
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-1">
                        {app.description}
                      </p>

                      {/* Quick Stat Pill */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                          <span>👥</span> {activeUsers}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Gasless Sponsoring
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ─── Footer (Khu vực tương tác: Toggle Switch & Xem chi tiết) ─── */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-3">
                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleToggleVisibility(app.id, visible)}
                        className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                          visible ? "bg-[#14F195]" : "bg-slate-700"
                        }`}
                        aria-label="Toggle visibility"
                        title={visible ? "Gạt để ẩn ứng dụng" : "Gạt để hiển thị ứng dụng"}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                            visible ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>

                      <span
                        className={`text-xs font-bold transition-colors ${
                          visible ? "text-[#14F195]" : "text-slate-500"
                        }`}
                      >
                        {visible ? "Hiển thị" : "Đã ẩn"}
                      </span>
                    </div>

                    {/* Nút Xem chi tiết (Outline mờ - Tuyệt đối KHÔNG có nút Xóa) */}
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <span>Xem chi tiết</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Modal Xem Chi Tiết MiniApp (Không có nút Xóa / Delete) ─────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#0F1629] border border-white/15 shadow-2xl flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
                  style={{ background: getIconGradient(selectedApp) }}
                >
                  {selectedApp.icon || "📱"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedApp.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {getCategory(selectedApp)} · {selectedApp.version || "v1.0.0"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col gap-4 text-xs">
              {/* Full Description */}
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
                  Mô tả ứng dụng
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedApp.description}</p>
              </div>

              {/* Technical Specifications */}
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-white/5 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Thông số Kỹ thuật & Tích hợp
                </span>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Đơn vị phát triển:</span>
                  <span className="font-semibold text-white">{getBuilderName(selectedApp)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Phiên bản phát hành:</span>
                  <span className="font-mono text-[#14F195]">{selectedApp.version || "v1.0.0"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Cơ chế Gasless:</span>
                  <span className="font-bold text-emerald-400">Tài trợ 100% qua N.E.D Relayer</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Trạng thái phát hành:</span>
                  <span className="font-semibold text-white">
                    {getIsVisible(selectedApp) ? "✓ Đang hiển thị trên App Store" : "👁️‍🗨️ Đang ẩn tạm thời"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer (Tuyệt đối không có nút Xóa) */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentVis = getIsVisible(selectedApp);
                    handleToggleVisibility(selectedApp.id, currentVis);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    getIsVisible(selectedApp)
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                      : "bg-emerald-500/15 text-[#14F195] border border-emerald-500/30 hover:bg-emerald-500/25"
                  }`}
                >
                  {getIsVisible(selectedApp) ? "Ẩn khỏi App Store" : "Bật hiển thị App"}
                </button>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
