"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Brain, Globe, BarChart3, Settings,
  Target, ChevronRight, Bell, TrendingUp, ShieldCheck
} from "lucide-react";
import Ticker from "@/components/ui/Ticker";
import WalletConnect from "@/components/WalletConnect";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/builder", label: "Index Builder", icon: Brain },
  { href: "/app/portfolio", label: "My Portfolio", icon: BarChart3 },
  { href: "/app/marketplace", label: "Marketplace", icon: Globe },
  { href: "/app/ledger", label: "Ledger", icon: ShieldCheck },
  { href: "/app/signals", label: "Signals", icon: TrendingUp },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-1)" }}>
      <Ticker />

      <header
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{
          background: "rgba(5,9,15,0.9)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--border-1)",
          boxShadow: "0 1px 0 rgba(0,217,255,0.04), 0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--cyan), var(--violet))" }}
            >
              <Target size={14} className="text-white" />
            </div>
            <span className="text-base font-black grad-cyan">ATLAS</span>
          </Link>
          <ChevronRight size={12} style={{ color: "var(--t-3)" }} />
          <span className="text-sm font-medium capitalize" style={{ color: "var(--t-2)" }}>
            {pathname.split("/").filter(Boolean).pop() ?? "Dashboard"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--border-1)", color: "var(--t-2)" }}
          >
            <Bell size={15} />
          </button>
          <WalletConnect />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          className="w-56 flex-shrink-0 hidden md:flex flex-col"
          style={{
            borderRight: "1px solid var(--border-1)",
            background: "rgba(5,9,15,0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <nav className="flex-1 p-3 pt-4 space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all"
                    style={{
                      borderRadius: "var(--radius-md)",
                      background: active
                        ? "linear-gradient(135deg, rgba(0,217,255,0.1), rgba(124,58,237,0.07))"
                        : "transparent",
                      color: active ? "var(--t-1)" : "var(--t-2)",
                      border: active ? "1px solid var(--border-2)" : "1px solid transparent",
                    }}
                  >
                    <Icon size={16} style={{ color: active ? "var(--cyan)" : undefined, flexShrink: 0 }} />
                    {label}
                    {active && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--cyan)", boxShadow: "0 0 6px var(--cyan)" }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

        </aside>

        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
