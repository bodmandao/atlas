"use client";

import { useEffect, useRef, useState } from "react";
import { Wallet, Loader2, AlertTriangle, LogOut } from "lucide-react";
import {
  signInWithEthereum,
  disconnectWallet,
  getSession,
  isWalletAvailable,
  onAccountsChanged,
  onChainChanged,
} from "@/lib/wallet";

type Status = "disconnected" | "connecting" | "connected" | "error";

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletConnect() {
  const [status, setStatus] = useState<Status>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hydrate from the session cookie on mount — never read wallet/session
  // state at render time, so server and first client paint both show
  // "disconnected" and this transitions in asynchronously, avoiding a
  // hydration mismatch.
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setAddress(session.address);
        setStatus("connected");
      }
    });
  }, []);

  // If the wallet switches accounts away from the one we're signed in as,
  // the header would otherwise keep showing a stale address that no longer
  // matches what's actually selected in the extension.
  useEffect(() => {
    const offAccounts = onAccountsChanged((accounts) => {
      if (!address) return;
      if (accounts.length === 0 || accounts[0]?.toLowerCase() !== address.toLowerCase()) {
        disconnectWallet().finally(() => {
          setAddress(null);
          setStatus("disconnected");
        });
      }
    });
    const offChain = onChainChanged(() => {
      // Chain switches don't invalidate the SIWE session (identity, not a
      // transaction) — nothing to do, listener kept for future use.
    });
    return () => {
      offAccounts();
      offChain();
    };
  }, [address]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function handleConnect() {
    if (!isWalletAvailable()) {
      setStatus("error");
      setError("No wallet extension detected");
      return;
    }
    setStatus("connecting");
    setError(null);
    try {
      const verifiedAddress = await signInWithEthereum();
      setAddress(verifiedAddress);
      setStatus("connected");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Sign-in failed");
    }
  }

  async function handleDisconnect() {
    setMenuOpen(false);
    await disconnectWallet();
    setAddress(null);
    setStatus("disconnected");
  }

  if (status === "connected" && address) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="btn btn-outline px-4 py-1.5 text-sm font-mono"
        >
          <Wallet size={14} />
          {truncate(address)}
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 mt-2 glass-elevated"
            style={{ padding: "6px", minWidth: 160, zIndex: 60, borderRadius: "var(--radius-md)" }}
          >
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 w-full text-left text-xs px-3 py-2 transition-colors"
              style={{ borderRadius: "var(--radius-sm)", color: "var(--t-2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={13} /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={status === "connecting"}
        className="btn btn-cyan px-4 py-1.5 text-sm disabled:opacity-60"
      >
        {status === "connecting" ? (
          <Loader2 size={14} className="spin-ring" />
        ) : (
          <Wallet size={14} />
        )}
        {status === "connecting" ? "Connecting…" : "Connect"}
      </button>
      {status === "error" && error && (
        <div
          className="absolute right-0 mt-2 glass-elevated flex items-start gap-2"
          style={{ padding: "10px 12px", width: 220, zIndex: 60, borderRadius: "var(--radius-md)" }}
        >
          <AlertTriangle size={13} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 1 }} />
          <span className="text-xs" style={{ color: "var(--t-2)" }}>
            {error}
            {!isWalletAvailable() && (
              <>
                {" — "}
                <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
                  get a wallet
                </a>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
