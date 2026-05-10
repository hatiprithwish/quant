import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/context/ThemeContext";

const NAV_ITEMS = [
  { to: "/food",      label: "FOOD",   sub: "nutrition", accent: "#22c55e", glyph: "◈" },
  { to: "/money",     label: "MONEY",  sub: "finance",   accent: "#f59e0b", glyph: "◉" },
  { to: "/time",      label: "TIME",   sub: "tracking",  accent: "#3b82f6", glyph: "◎" },
  { to: "/body",      label: "BODY",   sub: "metrics",   accent: "#ec4899", glyph: "◍" },
  { to: "/quests",    label: "QUESTS", sub: "goals",     accent: "#a855f7", glyph: "◆" },
  { to: "/scratchpad",label: "SCRATCH",sub: "notes",     accent: "#64748b", glyph: "◇" },
];

function Clock() {
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 8));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toTimeString().slice(0, 8)), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

function DayOfYear() {
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return <span>DAY {day}</span>;
}

export default function Sidebar() {
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const dark = theme === "dark";

  const bg         = dark ? "#0a0a0a" : "#f5f0e8";
  const border     = dark ? "#1e1e1e" : "#d6cfc0";
  const dimText    = dark ? "#888888" : "#7a7060";
  const ghostText  = dark ? "#707070" : "#a09888";
  const labelColor = dark ? "#b0b0b0" : "#3a3530";
  const subColor   = dark ? "#666666" : "#9a9080";
  const hoverBg    = dark ? "#111111" : "#ede8de";

  return (
    <aside
      style={{
        position: "sticky",
        background: bg,
        borderRight: `1px solid ${border}`,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        transition: "background 0.2s, border-color 0.2s, width 0.3s",
      }}
      className={`h-screen top-0 shrink-0 flex flex-col overflow-hidden ${collapsed ? "w-14" : "w-52"}`}
    >
      {/* Scanline texture — dark only */}
      {dark && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }} />
      )}

      {/* Grain texture — light only */}
      {!dark && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.4,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E\")",
        }} />
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, position: "relative", zIndex: 1 }} className="px-3 py-4">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{
                  width: 6, height: 6, background: "#22c55e", borderRadius: "50%",
                  boxShadow: "0 0 6px #22c55e",
                  animation: "quantPulse 2s infinite",
                }} />
                <span style={{ color: dark ? "#ffffff" : "#1a1510", fontSize: 11, letterSpacing: "0.2em", fontWeight: 700 }}>
                  QUANT
                </span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  color: dimText, fontSize: 10, padding: "2px 5px",
                  border: `1px solid ${border}`, background: "transparent",
                  cursor: "pointer", lineHeight: 1, borderRadius: 2,
                  fontFamily: "inherit",
                }}
                className="hover:opacity-100 transition-opacity"
              >
                ‹‹
              </button>
            </div>
            <div style={{ color: ghostText, fontSize: 9, letterSpacing: "0.12em", display: "flex", gap: 8 }}>
              <Clock />
              <span>·</span>
              <DayOfYear />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 6px #22c55e" }} />
            <button
              onClick={() => setCollapsed(false)}
              style={{
                color: dimText, fontSize: 10, padding: "2px 5px",
                border: `1px solid ${border}`, background: "transparent",
                cursor: "pointer", lineHeight: 1, borderRadius: 2,
                fontFamily: "inherit",
              }}
            >
              ››
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 1 }} className="flex-1 overflow-y-auto py-3 px-2 space-y-px">
        {NAV_ITEMS.map(({ to, label, sub, accent, glyph }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: "7px 8px",
              background: isActive ? hoverBg : "transparent",
              borderLeft: `2px solid ${isActive ? accent : "transparent"}`,
              paddingLeft: collapsed ? undefined : 6,
              textDecoration: "none",
              borderRadius: "0 4px 4px 0",
              transition: "background 0.15s",
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  fontSize: 13, color: isActive ? accent : dimText,
                  flexShrink: 0, lineHeight: 1,
                  transition: "color 0.15s",
                }}>
                  {glyph}
                </span>
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span style={{
                      fontSize: 10, letterSpacing: "0.14em", fontWeight: 700,
                      color: isActive ? (dark ? "#ffffff" : "#1a1510") : labelColor,
                      lineHeight: 1.3, transition: "color 0.15s",
                    }}>
                      {label}
                    </span>
                    <span style={{
                      fontSize: 8, letterSpacing: "0.1em",
                      color: isActive ? accent : subColor,
                      lineHeight: 1.3, transition: "color 0.15s",
                    }}>
                      {sub}
                    </span>
                  </div>
                )}
                {!collapsed && isActive && (
                  <div style={{
                    marginLeft: "auto", width: 3, height: 3,
                    borderRadius: "50%", background: accent,
                    boxShadow: `0 0 5px ${accent}`, flexShrink: 0,
                  }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: border, margin: "0 8px" }} />

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 1 }} className="px-2 py-3 space-y-px">
        <button
          onClick={toggleTheme}
          style={{
            width: "100%", display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: "6px 8px", background: "transparent",
            border: "none", cursor: "pointer",
            borderLeft: "2px solid transparent",
            fontFamily: "inherit",
          }}
          className="group"
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 10, color: dimText, transition: "color 0.15s" }}>
            {dark ? "○" : "●"}
          </span>
          {!collapsed && (
            <span style={{ fontSize: 9, letterSpacing: "0.14em", color: dimText, fontFamily: "inherit" }}>
              {dark ? "LIGHT" : "DARK"}
            </span>
          )}
        </button>

        <button
          onClick={() => signOut()}
          style={{
            width: "100%", display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: "6px 8px", background: "transparent",
            border: "none", cursor: "pointer",
            borderLeft: "2px solid transparent",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 10, color: dimText }}>×</span>
          {!collapsed && (
            <span style={{ fontSize: 9, letterSpacing: "0.14em", color: dimText, fontFamily: "inherit" }}>
              LOGOUT
            </span>
          )}
        </button>

        {!collapsed && (
          <div style={{ fontSize: 7, letterSpacing: "0.12em", color: ghostText, padding: "8px 8px 2px" }}>
            v2.0.0 · QUANT SYS
          </div>
        )}
      </div>

      <style>{`
        @keyframes quantPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </aside>
  );
}
