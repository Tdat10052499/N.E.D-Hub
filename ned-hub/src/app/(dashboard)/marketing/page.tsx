"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function MarketingPage() {
  const campaigns = [
    { title: "Tech4life 2026 NFT Attendance Badge", type: "Compressed NFT", target: "10,000 Visitors", minted: "1,420 minted", status: "Active" },
    { title: "Solana Superteam Early Bird Airdrop", type: "Token SPL Drop", target: "5,000 Wallets", minted: "3,200 claimed", status: "Active" },
    { title: "Zero-Gas Merchant First Pay Cashback", type: "SOL Cashback", target: "2,000 Trans", minted: "890 cashback", status: "Active" },
    { title: "Viral Referral Growth Loop V1", type: "Point System", target: "All Users", minted: "1,850 refers", status: "Pending" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#14F195] selection:text-black">
      <Navbar />

      <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Marketing & Growth Engine
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-[#14F195] border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                Growth & Airdrop
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Khởi tạo chiến dịch phát Airdrop, đúc thẻ định danh NFT Badge sự kiện, quản lý Referral và phễu tăng trưởng
            </p>
          </div>

          <Link
            href="/hub"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <span>← Về Master Hub</span>
          </Link>
        </div>

        {/* 4 Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ned-card p-5 flex flex-col gap-1 border-white/10">
            <span className="text-xs text-slate-400 font-medium">Tổng Lượt Mint NFT Badge</span>
            <span className="text-2xl font-black text-[#14F195] font-mono">1,420 NFTs</span>
            <span className="text-[11px] text-emerald-400 font-medium">Chi phí mint: ~0.00001 SOL</span>
          </div>

          <div className="ned-card p-5 flex flex-col gap-1 border-white/10">
            <span className="text-xs text-slate-400 font-medium">Quà tặng Airdrop Đã Phát</span>
            <span className="text-2xl font-black text-amber-400 font-mono">3,200 Claims</span>
            <span className="text-[11px] text-emerald-400 font-medium">Tỷ lệ Claim: 64%</span>
          </div>

          <div className="ned-card p-5 flex flex-col gap-1 border-white/10">
            <span className="text-xs text-slate-400 font-medium">Hệ số Viral K-Factor</span>
            <span className="text-2xl font-black text-[#9945FF] font-mono">1.82x</span>
            <span className="text-[11px] text-emerald-400 font-medium">+0.32 so với tuần trước</span>
          </div>

          <div className="ned-card p-5 flex flex-col gap-1 border-white/10">
            <span className="text-xs text-slate-400 font-medium">Chiến dịch Đang chạy</span>
            <span className="text-2xl font-black text-white font-mono">3 Active</span>
            <span className="text-[11px] text-emerald-400 font-medium">Sự kiện Tech4life 2026</span>
          </div>
        </div>

        {/* Campaign List Table */}
        <div className="ned-card p-6 border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Chiến dịch Tăng trưởng & Khuyến mại</h2>
            <span className="text-xs text-slate-400 font-mono">Chạy tự động trên chuỗi Solana</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Tên Chiến dịch</th>
                  <th className="py-3 px-4">Loại Phần thưởng</th>
                  <th className="py-3 px-4">Mục tiêu</th>
                  <th className="py-3 px-4">Đã phân phối</th>
                  <th className="py-3 px-4 rounded-r-lg">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map((c, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{c.title}</td>
                    <td className="py-3 px-4 text-[#14F195] font-semibold">{c.type}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{c.target}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{c.minted}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === "Active"
                            ? "bg-emerald-500/15 text-[#14F195] border border-emerald-500/20"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
