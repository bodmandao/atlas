import { Settings, Key, Bell, Shield, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(100,116,139,0.1)", color: "var(--t-2)" }}
          >
            <Settings size={18} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Settings</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--t-2)" }}>
          Configure your ATLAS experience and API connections
        </p>
      </div>

      {[
        {
          title: "API Connections", icon: <Key size={16} />, color: "var(--cyan)", glow: "var(--cyan-dim)",
          items: [
            { label: "SoSoValue API Key", desc: "Connect to SoSoValue for ETF flows, news, and market data", status: "configured", type: "key" },
            { label: "SoDEX API Key", desc: "Connect to SoDEX for on-chain order execution", status: "pending", type: "key" },
            { label: "Anthropic API Key", desc: "Claude AI for index construction and market analysis", status: "configured", type: "key" },
          ]
        },
        {
          title: "Risk Management", icon: <Shield size={16} />, color: "var(--green)", glow: "var(--green-dim)",
          items: [
            { label: "Max Single Position Size", desc: "Maximum % allocation to any single token", value: "30%", type: "select" },
            { label: "Slippage Tolerance", desc: "Maximum slippage before order is rejected", value: "1%", type: "select" },
            { label: "Confirmation Gate", desc: "Require explicit confirmation for all executions", value: "On", type: "toggle" },
          ]
        },
        {
          title: "Notifications", icon: <Bell size={16} />, color: "#a78bfa", glow: "var(--violet-dim)",
          items: [
            { label: "Rebalance Alerts", desc: "Notify when AI suggests portfolio rebalancing", value: "On", type: "toggle" },
            { label: "Signal Alerts", desc: "Notify on strong buy/sell signals from SoSoValue data", value: "On", type: "toggle" },
            { label: "ETF Flow Alerts", desc: "Notify on unusual ETF inflow/outflow activity", value: "Off", type: "toggle" },
          ]
        },
        {
          title: "Network", icon: <Globe size={16} />, color: "var(--amber)", glow: "var(--amber-dim)",
          items: [
            { label: "SoDEX Network", desc: "Chain for order execution", value: "Testnet", type: "select" },
            { label: "Data Refresh Rate", desc: "How often to refresh SoSoValue data", value: "60s", type: "select" },
          ]
        },
      ].map((section) => (
        <div key={section.title} className="glass overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-1)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: section.glow, color: section.color }}
            >
              {section.icon}
            </div>
            <h2 className="text-sm font-bold" style={{ color: "var(--t-1)" }}>{section.title}</h2>
          </div>
          <div>
            {section.items.map((item, idx) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-4 gap-4"
                style={{
                  borderTop: idx > 0 ? "1px solid var(--border-0)" : undefined,
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--t-1)" }}>{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--t-3)" }}>{item.desc}</div>
                </div>
                {"status" in item ? (
                  <span className={`badge ${item.status === "configured" ? "badge-green" : "badge-amber"}`}>
                    {item.status}
                  </span>
                ) : "value" in item ? (
                  <div
                    className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--border-1)",
                      color: "var(--t-2)",
                    }}
                  >
                    {item.value}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="glass p-5 text-center">
        <div className="text-xs mb-1" style={{ color: "var(--t-3)" }}>Built for</div>
        <div className="text-sm font-bold" style={{ color: "var(--t-2)" }}>SoSoValue Hackathon — Wave 1</div>
        <div className="text-xs mt-1" style={{ color: "var(--t-3)" }}>
          Powered by SoSoValue API + SoDEX API + Claude Sonnet 4.6
        </div>
      </div>
    </div>
  );
}
