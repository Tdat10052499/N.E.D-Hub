"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function MasterHubPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("admin@ned.finance");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      const toastId = toast.loading("Đang đăng xuất...");
      await supabase.auth.signOut();
      document.cookie = "ned_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      localStorage.removeItem("ned_user_session");
      toast.success("Đã đăng xuất an toàn!", { id: toastId });
      router.push("/login");
    } catch (err) {
      console.error(err);
      router.push("/login");
    }
  };

  const modules = [
    {
      id: "system",
      title: "System Control",
      badge: "Core Infrastructure",
      badgeColor: "bg-[#9945FF]/15 text-[#9945FF] border-[#9945FF]/30",
      icon: "⚙️",
      iconGradient: "linear-gradient(135deg, #9945FF 0%, #6366F1 100%)",
      glowColor: "hover:shadow-[0_0_50px_rgba(153,69,255,0.25)]",
      borderColor: "hover:border-[#9945FF]/60",
      description:
        "Trung tâm quản trị hạ tầng lõi: Giám sát tài khoản người dùng on-chain, trạm bảo trợ Gas Relayer Solana, phát thanh khẩn cấp và sao lưu dữ liệu toàn hệ thống.",
      href: "/",
      status: "Online · 100% Sponsoring",
      statusColor: "text-[#14F195]",
      features: [
        "Quản lý Người dùng & Onboarding",
        "Trạm Gas Relayer Solana (Zero-Gas)",
        "Kho ứng dụng Mini-Apps Hub",
        "Bảo trì & Sao lưu Khẩn cấp",
      ],
      actionLabel: "Truy cập System Control →",
      actionBg: "linear-gradient(135deg, #9945FF 0%, #6366F1 100%)",
    },
    {
      id: "business",
      title: "Business Management",
      badge: "Enterprise & Partners",
      badgeColor: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      icon: "💼",
      iconGradient: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
      glowColor: "hover:shadow-[0_0_50px_rgba(59,130,246,0.25)]",
      borderColor: "hover:border-sky-500/60",
      description:
        "Quản lý hệ sinh thái đối tác doanh nghiệp: Theo dõi thỏa thuận hợp tác (SLA), đối soát doanh thu B2B, quản lý nhà phát triển Builder và cấp API Merchant.",
      href: "/business",
      status: "Active · 8 Enterprise Partners",
      statusColor: "text-sky-400",
      features: [
        "Hợp đồng & Đối tác Doanh nghiệp",
        "Đối soát Doanh thu & Dòng tiền",
        "Quản lý Nhà phát triển (Builder Hub)",
        "Cấp khóa API & Webhooks tích hợp",
      ],
      actionLabel: "Khám phá Business Hub →",
      actionBg: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
    },
    {
      id: "marketing",
      title: "Marketing & Growth",
      badge: "Campaigns & Rewards",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: "📢",
      iconGradient: "linear-gradient(135deg, #10B981 0%, #14F195 100%)",
      glowColor: "hover:shadow-[0_0_50px_rgba(20,241,149,0.25)]",
      borderColor: "hover:border-[#14F195]/60",
      description:
        "Chiến dịch phát triển người dùng & Viral Growth: Khởi tạo Airdrop token, cấp NFT Badge tham dự sự kiện Tech4life, phân tích phễu chuyển đổi và Referral.",
      href: "/marketing",
      status: "Running · Tech4life Campaign",
      statusColor: "text-[#14F195]",
      features: [
        "Cổng Airdrop Token & Loyalty Rewards",
        "Đúc NFT Badge Sự kiện On-chain",
        "Phân tích Phễu Chuyển đổi (Analytics)",
        "Mạng lưới Giới thiệu (Viral Referral)",
      ],
      actionLabel: "Mở Growth Engine →",
      actionBg: "linear-gradient(135deg, #10B981 0%, #14F195 100%)",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F0F4FF] flex flex-col selection:bg-[#9945FF] selection:text-white">
      {/* ─── Top Master Hub Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 px-6 sm:px-12 py-4 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
              boxShadow: "0 0 20px rgba(153, 69, 255, 0.4)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" fill="white" />
              <line x1="12" y1="2" x2="12" y2="9.5" stroke="white" strokeWidth="1.5" />
              <line x1="12" y1="14.5" x2="12" y2="22" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span className="gradient-text font-black">N.E.D</span>
              <span>Master Hub</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#9945FF]/20 text-[#9945FF] border border-[#9945FF]/30">
                v2.0
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Central Control Console · Solana Devnet
            </span>
          </div>
        </div>

        {/* Right User Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F1629] border border-white/10 text-xs">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow"
              style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
            >
              NW
            </div>
            <span className="font-mono text-slate-300 font-semibold">{userEmail}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] ml-1" />
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* ─── Hero Title Section ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1480px] w-full mx-auto px-6 sm:px-12 py-10 flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#14F195] pulse-dot" />
            <span>Trung tâm Điều hành Đa Phân hệ N.E.D Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Chọn Module Quản trị
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Chào mừng bạn đến với Cổng điều khiển Master Hub. Hãy chọn một phân hệ bên dưới để bắt đầu quản lý hạ tầng on-chain, đối tác doanh nghiệp hoặc chiến dịch tăng trưởng.
          </p>
        </div>

        {/* ─── 3 Giant Module Cards (Grid 3 Columns) ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className={`ned-card p-8 rounded-3xl bg-[#0F1629]/90 border border-white/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${mod.borderColor} ${mod.glowColor} hover:-translate-y-1`}
            >
              {/* Top Accent Gradient Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 transition-all opacity-80 group-hover:opacity-100"
                style={{ background: mod.iconGradient }}
              />

              <div className="flex flex-col gap-6">
                {/* Header: Icon, Badge, Title */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/15 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: mod.iconGradient }}
                  >
                    {mod.icon}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border ${mod.badgeColor}`}
                  >
                    {mod.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-white transition-colors">
                    {mod.title}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                    <span className={`text-xs font-mono font-medium ${mod.statusColor}`}>
                      {mod.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mod.description}
                </p>

                {/* Feature Bullet Points */}
                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/5 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Các tính năng trọng tâm:
                  </span>
                  {mod.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-[#14F195] font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-white/10">
                <Link
                  href={mod.href}
                  className="w-full py-3.5 px-5 rounded-2xl text-xs font-black text-white transition-all shadow-xl flex items-center justify-center gap-2 group-hover:shadow-2xl"
                  style={{ background: mod.actionBg }}
                >
                  <span>{mod.actionLabel}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-white/5 text-center text-xs text-slate-500 font-mono">
        N.E.D Hub Engine · Protected by Supabase Auth & Solana Devnet Relayer
      </footer>
    </div>
  );
}
