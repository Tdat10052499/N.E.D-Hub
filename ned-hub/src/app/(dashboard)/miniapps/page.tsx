"use client";

import Navbar from "@/components/Navbar";

export default function MiniAppsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-[#F0F4FF]">
      <Navbar />
      <main className="flex-1 px-6 sm:px-8 py-6 max-w-[1480px] w-full mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Mini-Apps</h1>
          <p className="text-xs text-slate-400 mt-1">
            Hệ sinh thái ứng dụng phi tập trung và tiện ích tích hợp trên N.E.D Wallet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="ned-card p-6 flex flex-col justify-between">
            <span className="text-lg font-bold text-white">🎟️ Event Ticket & Check-in</span>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ứng dụng quét vé mã QR và cấp NFT tham dự sự kiện Tech4life tự động.
            </p>
            <span className="text-xs font-bold text-[#14F195] mt-4">● Đang hoạt động</span>
          </div>

          <div className="ned-card p-6 flex flex-col justify-between">
            <span className="text-lg font-bold text-white">🎁 Rewards & Airdrop Portal</span>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cổng phân phối quà tặng và phần thưởng token cho người dùng tham quan gian hàng.
            </p>
            <span className="text-xs font-bold text-blue-400 mt-4">● Sẵn sàng kích hoạt</span>
          </div>

          <div className="ned-card p-6 flex flex-col justify-between">
            <span className="text-lg font-bold text-white">💳 Zero-Gas Solana Pay</span>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Thanh toán on-chain tức thì không mất phí gas thông qua trạm Relayer N.E.D.
            </p>
            <span className="text-xs font-bold text-[#9945FF] mt-4">● Đang kết nối</span>
          </div>
        </div>
      </main>
    </div>
  );
}
