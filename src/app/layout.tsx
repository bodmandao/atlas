import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ATLAS — Thematic On-Chain Index Protocol",
  description:
    "Build, execute, and publish thematic crypto indexes powered by SoSoValue institutional data and AI. From thesis to on-chain execution in minutes.",
  keywords: ["crypto", "index", "DeFi", "SoSoValue", "on-chain", "portfolio", "AI"],
  openGraph: {
    title: "ATLAS — Thematic On-Chain Index Protocol",
    description: "AI-powered index construction and on-chain execution via SoDEX",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
