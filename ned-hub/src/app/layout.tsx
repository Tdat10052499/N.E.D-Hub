import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      </body>
    </html>
  );
}
