"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function BusinessPage() {
  const partners = [
    { name: "Tech4life Foundation", tier: "Enterprise Tier 1", status: "Active", apiCalls: "142,500 / mo", revenue: "$12,400" },
    { name: "Solana Superteam VN", tier: "Strategic Alliance", status: "Active", apiCalls: "98,200 / mo", revenue: "$8,900" },
    { name: "Jupiter SDK Aggregator", tier: "Ecosystem Partner", status: "Active", apiCalls: "312,000 / mo", revenue: "$24,500" },
    { name: "DeepMind Web3 Studio", tier: "AI Studio Tier", status: "Active", apiCalls: "64,000 / mo", revenue: "$6,200" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF] selection:bg-[#3B82F6] selection:text-white">
      <Navbar />

      <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Business Management & Partners
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Enterprise Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Quản lý đối tác doanh nghiệp, đối soát doanh thu B2B, cấp phép API Merchant và hợp đồng thông minh đối tác
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
            <span className="text-xs text-slate-400 font-medium">Tổng Đối tác Doanh nghiệp</span>
            <span className="text-2xl font-black text-white font-mono">12 Partners</span>
            <span className="text-[11px] text-emerald-400 font-medium">+3 trong tháng này</span>
          </div>

          <div className="ned-card p-5 flex flex-col gap-1 border-white/10">
            <span className="text-xs text-slate-400 font-medium">Tổng Doanh thu B2B (ARR)</span>
            <span className="text-2xl font-black text-sky-400 font-mono">$52,000 / mo</span>
            <span className="text-[11px] text-emerald-400 font-medium">+18.5% tăng trưởng</span>
          </div>

          <div className="ned-card p-5 flex flex-col gap-1 border-white/10">
            <span className="text-xs text-slate-400 font-medium">Lưu lượng API Merchant</span>
            <span className="text-2xl font-black text-[#14F195] font-mono">616.7K calls</span>
            <span className="text-[11px] text-slate-400 font-medium">SLA 99.98% Uptime</span>
          </div>

          <div className="ned-card p-5 flex flex-col gap-1 border-white/10">
            <span className="text-xs text-slate-400 font-medium">Hợp đồng Đang hiệu lực</span>
            <span className="text-2xl font-black text-[#9945FF] font-mono">100% Signed</span>
            <span className="text-[11px] text-emerald-400 font-medium">Smart Contracts Audited</span>
          </div>
        </div>

        {/* Partner Table */}
        <div className="ned-card p-6 border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Danh sách Đối tác Doanh nghiệp Chiến lược</h2>
            <span className="text-xs text-slate-400 font-mono">Cập nhật theo thời gian thực</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Tên Đối tác</th>
                  <th className="py-3 px-4">Cấp độ Hợp tác</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Lưu lượng API</th>
                  <th className="py-3 px-4 rounded-r-lg">Doanh thu Đóng góp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {partners.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-4 text-sky-400 font-semibold">{p.tier}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#14F195] border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{p.apiCalls}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{p.revenue}</td>
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
