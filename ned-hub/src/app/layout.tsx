import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "N.E.D Hub — Web3 Admin Dashboard",
  description:
    "N.E.D Hub Web3 Admin Dashboard — Onboarding Funnel, Gas Station Relayer & AI Insights for the Solana ecosystem.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.variable} min-h-full bg-[#0b0f19] text-[#f0f4ff]`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1E293B",
              color: "#F0F4FF",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              padding: "12px 16px",
            },
            success: {
              iconTheme: {
                primary: "#14F195",
                secondary: "#0B0F19",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#0B0F19",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
