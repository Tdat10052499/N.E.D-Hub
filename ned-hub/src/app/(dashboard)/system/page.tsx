"use client";

import Navbar from "@/components/Navbar";

export default function SystemPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF]">
      <Navbar />
      <main className="flex-1 px-6 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">System Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            Trung tâm điều khiển hạ tầng cốt lõi, bảo mật và cấu hình môi trường Solana
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="ned-card p-6 flex flex-col justify-between">
            <span className="text-lg font-bold text-white">⚙️ Cấu hình Mạng lưới Solana</span>
            <div className="flex flex-col gap-2 mt-3 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">RPC Cluster:</span>
                <span className="font-mono text-[#14F195]">https://api.devnet.solana.com</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Commitment Level:</span>
                <span className="font-mono text-white">confirmed</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Relayer Mode:</span>
                <span className="font-bold text-emerald-400">Gasless Full Sponsoring</span>
              </div>
            </div>
          </div>

          <div className="ned-card p-6 flex flex-col justify-between">
            <span className="text-lg font-bold text-white">🔒 Bảo mật & Cơ sở dữ liệu</span>
            <div className="flex flex-col gap-2 mt-3 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-mono text-white">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Schema Sync:</span>
                <span className="font-bold text-[#14F195]">V2 (username, onboarding_status)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Relayer Secret Key:</span>
                <span className="font-mono text-slate-400">●●●●●●●●●●●●●●●●</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
