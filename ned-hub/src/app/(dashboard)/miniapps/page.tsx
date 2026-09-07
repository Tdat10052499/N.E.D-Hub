"use client";

import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MiniAppItem {
  id: string;
  icon: string;
  iconGradient: string;
  title: string;
  builderName: string;
  builderAvatar: string;
  description: string;
  version: string;
  category: string;
  activeUsers: string;
  isVisible: boolean;
}

// ─── Initial Mock Data ───────────────────────────────────────────────────────

const initialMiniApps: MiniAppItem[] = [
  {
    id: "app-1",
    icon: "🎟️",
    iconGradient: "linear-gradient(135deg, #9945FF 0%, #6366F1 100%)",
    title: "Event Ticket & Check-in",
    builderName: "Tech4life Foundation",
    builderAvatar: "TF",
    description:
      "Ứng dụng quét vé mã QR siêu tốc, tự động xác thực chữ ký ví và cấp NFT Badge tham dự sự kiện Tech4life on-chain.",
    version: "v1.4.2",
    category: "Ticketing & Access",
    activeUsers: "1,420 users",
    isVisible: true,
  },
  {
    id: "app-2",
    icon: "🎁",
    iconGradient: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
    title: "Rewards & Airdrop Portal",
    builderName: "Solana Superteam VN",
    builderAvatar: "SV",
    description:
      "Cổng phân phối quà tặng token và voucher điện tử cho người dùng hoàn thành nhiệm vụ tham quan gian hàng triển lãm.",
    version: "v2.1.0",
    category: "Airdrop & Loyalty",
    activeUsers: "980 users",
    isVisible: true,
  },
  {
    id: "app-3",
    icon: "💳",
    iconGradient: "linear-gradient(135deg, #10B981 0%, #14F195 100%)",
    title: "Zero-Gas Solana Pay",
    builderName: "N.E.D Core Labs",
    builderAvatar: "NC",
    description:
      "Cổng thanh toán QR Code Solana Pay tức thì không tốn phí gas thông qua cơ chế tài trợ tự động của trạm Relayer N.E.D.",
    version: "v1.0.8",
    category: "Web3 Payments",
    activeUsers: "2,350 users",
    isVisible: true,
  },
  {
    id: "app-4",
    icon: "🆔",
    iconGradient: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
    title: "NFT Identity Minter",
    builderName: "N.E.D Identity Hub",
    builderAvatar: "ID",
    description:
      "Tiện ích đúc thẻ định danh cá nhân Web3 Pass dưới dạng Compressed NFT tốc độ cao, liên kết trực tiếp tên miền .ned.",
    version: "v1.2.5",
    category: "Identity & Pass",
    activeUsers: "860 users",
    isVisible: true,
  },
  {
    id: "app-5",
    icon: "⚡",
    iconGradient: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
    title: "Instant Token Swap",
    builderName: "Jupiter SDK Aggregator",
    builderAvatar: "JP",
    description:
      "Tiện ích hoán đổi token SOL, USDC và SPL Token tức thì với tỷ giá tối ưu nhất trên toàn bộ hệ sinh thái Solana.",
    version: "v3.0.1",
    category: "DeFi & Swap",
    activeUsers: "3,120 users",
    isVisible: false,
  },
  {
    id: "app-6",
    icon: "🤖",
    iconGradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    title: "AI Wallet Copilot",
    builderName: "DeepMind Web3 Studio",
    builderAvatar: "DM",
    description:
      "Trợ lý trí tuệ nhân tạo phân tích giao dịch on-chain, cảnh báo rủi ro hợp đồng thông minh và tối ưu hóa chi phí.",
    version: "v1.1.0",
    category: "AI & Analytics",
    activeUsers: "1,780 users",
    isVisible: true,
  },
];

// ─── Main Mini-Apps Page ──────────────────────────────────────────────────────

export default function MiniAppsPage() {
  const [apps, setApps] = useState<MiniAppItem[]>(initialMiniApps);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState<MiniAppItem | null>(null);

  // Toggle Visibility Handler
  const handleToggleVisibility = (id: string, title: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const nextState = !app.isVisible;
          if (nextState) {
            toast.success(`Đã bật hiển thị "${title}" trên N.E.D Wallet!`, {
              id: `toggle-${id}`,
            });
          } else {
            toast(`Đã ẩn "${title}" khỏi danh sách công khai.`, {
              id: `toggle-${id}`,
              icon: "👁️‍🗨️",
            });
          }
          return { ...app, isVisible: nextState };
        }
        return app;
      })
    );
  };

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Filter by Status Tab
      if (statusFilter === "visible" && !app.isVisible) return false;
      if (statusFilter === "hidden" && app.isVisible) return false;

      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = app.title.toLowerCase().includes(query);
        const matchBuilder = app.builderName.toLowerCase().includes(query);
        const matchCategory = app.category.toLowerCase().includes(query);
        return matchTitle || matchBuilder || matchCategory;
      }
      return true;
    });
  }, [apps, searchQuery, statusFilter]);

  // Counts
  const counts = useMemo(() => {
    const total = apps.length;
    const visible = apps.filter((a) => a.isVisible).length;
    const hidden = apps.filter((a) => !a.isVisible).length;
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
                Integration Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Hệ sinh thái ứng dụng phi tập trung, phân quyền hiển thị và tiện ích tích hợp trên N.E.D Wallet
            </p>
          </div>

          {/* KPI Summary Badges */}
          <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.length === 0 ? (
            <div className="col-span-full ned-card p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-base font-bold text-white">Không tìm thấy Mini-App nào</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Không có ứng dụng nào khớp với từ khóa tìm kiếm &quot;{searchQuery}&quot;. Hãy thử lại với từ khóa khác.
              </p>
            </div>
          ) : (
            filteredApps.map((app) => (
              /* 3. Thiết kế Thẻ Ứng dụng (MiniApp Card) */
              <div
                key={app.id}
                className={`ned-card p-6 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                  app.isVisible
                    ? "border-white/10 hover:border-white/20"
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
                        style={{ background: app.iconGradient }}
                      >
                        {app.icon}
                      </div>

                      {/* Tiêu đề App & Category */}
                      <div className="flex flex-col">
                        <h3 className="text-base font-black text-white tracking-tight">
                          {app.title}
                        </h3>
                        <span className="text-[10px] uppercase font-bold text-[#14F195] tracking-wider mt-0.5">
                          {app.category}
                        </span>
                      </div>
                    </div>

                    {/* Badge Version góc phải */}
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300 font-semibold shrink-0">
                      {app.version}
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
                        {app.builderAvatar}
                      </div>
                      <span className="text-[11px] font-medium text-slate-300">
                        Built by <strong className="text-white font-semibold">{app.builderName}</strong>
                      </span>
                    </div>

                    {/* Mô tả ngắn 2-3 dòng (line-clamp-2) */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-1">
                      {app.description}
                    </p>

                    {/* Quick Stat Pill */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                        <span>👥</span> {app.activeUsers}
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
                      onClick={() => handleToggleVisibility(app.id, app.title)}
                      className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${
                        app.isVisible ? "bg-[#14F195]" : "bg-slate-700"
                      }`}
                      aria-label="Toggle visibility"
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                          app.isVisible ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    <span
                      className={`text-xs font-bold transition-colors ${
                        app.isVisible ? "text-[#14F195]" : "text-slate-500"
                      }`}
                    >
                      {app.isVisible ? "Hiển thị" : "Đã ẩn"}
                    </span>
                  </div>

                  {/* Nút Xem chi tiết (Outline mờ) */}
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
            ))
          )}
        </div>
      </main>

      {/* ─── Modal Xem Chi Tiết MiniApp (Không có nút Xóa) ───────────────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#0F1629] border border-white/15 shadow-2xl flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
                  style={{ background: selectedApp.iconGradient }}
                >
                  {selectedApp.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedApp.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedApp.category} · {selectedApp.version}
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
                  <span className="font-semibold text-white">{selectedApp.builderName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Phiên bản phát hành:</span>
                  <span className="font-mono text-[#14F195]">{selectedApp.version}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Cơ chế Gasless:</span>
                  <span className="font-bold text-emerald-400">Tài trợ 100% qua N.E.D Relayer</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Trạng thái phát hành:</span>
                  <span className="font-semibold text-white">
                    {selectedApp.isVisible ? "✓ Đang hiển thị trên App Store" : "👁️‍🗨️ Đang ẩn tạm thời"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer (Tuyệt đối không có nút Xóa) */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleVisibility(selectedApp.id, selectedApp.title);
                    setSelectedApp({ ...selectedApp, isVisible: !selectedApp.isVisible });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedApp.isVisible
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                      : "bg-emerald-500/15 text-[#14F195] border border-emerald-500/30 hover:bg-emerald-500/25"
                  }`}
                >
                  {selectedApp.isVisible ? "Ẩn khỏi App Store" : "Bật hiển thị App"}
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
