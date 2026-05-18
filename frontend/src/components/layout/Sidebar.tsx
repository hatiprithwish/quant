import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/context/ThemeContext";

type SubItem = { to: string; label: string; sub: string; glyph: string };

type NavItem = {
  to: string;
  label: string;
  sub: string;
  accent: string;
  glyph: string;
  activePrefix?: string;
  defaultTo?: string;
  subItems?: SubItem[];
};

const NAV_ITEMS: NavItem[] = [
  { to: "/food/dashboard", label: "FOOD",   sub: "nutrition", accent: "#22c55e", glyph: "◈" },
  {
    to: "/money", label: "MONEY", sub: "finance", accent: "#f59e0b", glyph: "◉",
    activePrefix: "/money", defaultTo: "/money/dashboard",
    subItems: [
      { to: "/money/dashboard",    label: "OVERVIEW",   sub: "command center",  glyph: "◈" },
      { to: "/money/transactions", label: "LEDGER",     sub: "all entries",     glyph: "≡" },
      { to: "/money/categories",   label: "CATEGORIES", sub: "budget & tags",   glyph: "◐" },
      { to: "/money/lending",      label: "DEBTS",      sub: "lent & owed",     glyph: "⇄" },
      { to: "/money/investments",  label: "PORTFOLIO",  sub: "assets & growth", glyph: "△" },
    ],
  },
  {
    to: "/time", label: "TIME", sub: "tracking", accent: "#06b6d4", glyph: "◎",
    activePrefix: "/time", defaultTo: "/time",
    subItems: [
      { to: "/time",         label: "CHRONICLE", sub: "activity log", glyph: "◎" },
      { to: "/time/buckets", label: "BUCKETS",   sub: "manage",       glyph: "◈" },
      { to: "/time/reports", label: "REPORTS",   sub: "analytics",    glyph: "△" },
    ],
  },
  { to: "/body", label: "BODY", sub: "metrics", accent: "#ec4899", glyph: "◍" },
  {
    to: "/quests", label: "QUESTS", sub: "goals", accent: "#a855f7", glyph: "◆",
    activePrefix: "/quests", defaultTo: "/quests",
    subItems: [
      { to: "/quests",              label: "ALL QUESTS",  sub: "full roster",    glyph: "◈" },
      { to: "/quests/active",       label: "ACTIVE",      sub: "in progress",    glyph: "▶" },
      { to: "/quests/paused",       label: "PAUSED",      sub: "on hold",        glyph: "⏸" },
      { to: "/quests/done",         label: "DONE",        sub: "completed",      glyph: "✓" },
      { to: "/quests/board",        label: "KANBAN",      sub: "board view",     glyph: "⊞" },
      { to: "/quests/trajectory",   label: "TRAJECTORY",  sub: "intelligence",   glyph: "◆" },
      { to: "/quests/vault",        label: "VAULT",       sub: "5-layer vision", glyph: "◎" },
      { to: "/quests/checkin",      label: "CHECK-IN",    sub: "weekly review",  glyph: "△" },
      { to: "/quests/habits",       label: "HABITS",      sub: "intelligence",   glyph: "◉" },
      { to: "/quests/projector",    label: "PROJECTOR",   sub: "escape math",    glyph: "⇄" },
    ],
  },
  { to: "/daily-log", label: "LOG", sub: "daily log", accent: "#ea580c", glyph: "◈" },
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

function SidebarContent({
  collapsed,
  setCollapsed,
  onNavClick,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNavClick?: () => void;
}) {
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  const dark = theme === "dark";
  const bg         = dark ? "#0a0a0a" : "#f5f0e8";
  const border     = dark ? "#1e1e1e" : "#d6cfc0";
  const dimText    = dark ? "#888888" : "#7a7060";
  const ghostText  = dark ? "#707070" : "#a09888";
  const labelColor = dark ? "#b0b0b0" : "#3a3530";
  const subColor   = dark ? "#666666" : "#9a9080";
  const hoverBg    = dark ? "#111111" : "#ede8de";

  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.subItems && item.activePrefix && location.pathname.startsWith(item.activePrefix)) {
        setExpandedKeys(prev => {
          if (prev.has(item.to)) return prev;
          const next = new Set(prev);
          next.add(item.to);
          return next;
        });
      }
    });
  }, [location.pathname]);

  function toggleExpanded(key: string) {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div
      style={{
        background: bg,
        borderRight: `1px solid ${border}`,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        transition: "background 0.2s, border-color 0.2s",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {dark && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }} />
      )}
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
                  boxShadow: "0 0 6px #22c55e", animation: "quantPulse 2s infinite",
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
                  cursor: "pointer", lineHeight: 1, borderRadius: 2, fontFamily: "inherit",
                }}
              >‹‹</button>
            </div>
            <div style={{ color: ghostText, fontSize: 9, letterSpacing: "0.12em", display: "flex", gap: 8 }}>
              <Clock /><span>·</span><DayOfYear />
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
                cursor: "pointer", lineHeight: 1, borderRadius: 2, fontFamily: "inherit",
              }}
            >››</button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 1 }} className="flex-1 overflow-y-auto py-3 px-2 space-y-px">
        {NAV_ITEMS.map((item) => {
          const { to, label, sub, accent, glyph, subItems, activePrefix, defaultTo } = item;
          const hasChildren = !!subItems?.length;

          if (hasChildren) {
            const isGroupActive = activePrefix ? location.pathname.startsWith(activePrefix) : false;
            const isExpanded = expandedKeys.has(to);

            return (
              <div key={to}>
                <div
                  style={{
                    display: "flex", alignItems: "center",
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: "7px 8px",
                    paddingLeft: collapsed ? undefined : 6,
                    background: "transparent",
                    borderLeft: "2px solid transparent",
                    borderRadius: "0 4px 4px 0",
                    transition: "background 0.15s",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    navigate(defaultTo ?? to);
                    if (!collapsed) toggleExpanded(to);
                    onNavClick?.();
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 13, color: isGroupActive ? accent : dimText, flexShrink: 0, lineHeight: 1, transition: "color 0.15s" }}>
                    {glyph}
                  </span>
                  {!collapsed && (
                    <>
                      <div className="flex flex-col min-w-0" style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, color: isGroupActive ? (dark ? "#ffffff" : "#1a1510") : labelColor, lineHeight: 1.3, transition: "color 0.15s" }}>
                          {label}
                        </span>
                        <span style={{ fontSize: 8, letterSpacing: "0.1em", color: isGroupActive ? accent : subColor, lineHeight: 1.3, transition: "color 0.15s" }}>
                          {sub}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 8, color: isGroupActive ? accent : dimText,
                        flexShrink: 0, lineHeight: 1,
                        transition: "transform 0.2s, color 0.15s",
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        display: "inline-block",
                      }}>›</span>
                    </>
                  )}
                </div>

                {!collapsed && isExpanded && (
                  <div>
                    {subItems!.map(child => {
                      const subActive = location.pathname === child.to;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onNavClick}
                          style={{
                            display: "flex", alignItems: "center",
                            gap: 8, padding: "5px 8px 5px 22px",
                            background: subActive ? hoverBg : "transparent",
                            borderLeft: `2px solid ${subActive ? accent : "transparent"}`,
                            borderRadius: "0 4px 4px 0",
                            textDecoration: "none",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (!subActive) (e.currentTarget as HTMLAnchorElement).style.background = hoverBg; }}
                          onMouseLeave={e => { if (!subActive) (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                        >
                          <span style={{ fontSize: 9, color: subActive ? accent : dimText, flexShrink: 0, lineHeight: 1, transition: "color 0.15s" }}>
                            {child.glyph}
                          </span>
                          <div className="flex flex-col min-w-0" style={{ flex: 1 }}>
                            <span style={{ fontSize: 9, letterSpacing: "0.12em", fontWeight: 700, color: subActive ? (dark ? "#ffffff" : "#1a1510") : labelColor, lineHeight: 1.3, transition: "color 0.15s" }}>
                              {child.label}
                            </span>
                            <span style={{ fontSize: 7, letterSpacing: "0.1em", color: subActive ? accent : subColor, lineHeight: 1.3, transition: "color 0.15s" }}>
                              {child.sub}
                            </span>
                          </div>
                          {subActive && (
                            <div style={{ width: 3, height: 3, borderRadius: "50%", background: accent, boxShadow: `0 0 5px ${accent}`, flexShrink: 0 }} />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: "7px 8px",
                paddingLeft: collapsed ? undefined : 6,
                background: isActive ? hoverBg : "transparent",
                borderLeft: `2px solid ${isActive ? accent : "transparent"}`,
                textDecoration: "none",
                borderRadius: "0 4px 4px 0",
                transition: "background 0.15s",
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ fontSize: 13, color: isActive ? accent : dimText, flexShrink: 0, lineHeight: 1, transition: "color 0.15s" }}>
                    {glyph}
                  </span>
                  {!collapsed && (
                    <div className="flex flex-col min-w-0">
                      <span style={{ fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, color: isActive ? (dark ? "#ffffff" : "#1a1510") : labelColor, lineHeight: 1.3, transition: "color 0.15s" }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 8, letterSpacing: "0.1em", color: isActive ? accent : subColor, lineHeight: 1.3, transition: "color 0.15s" }}>
                        {sub}
                      </span>
                    </div>
                  )}
                  {!collapsed && isActive && (
                    <div style={{ marginLeft: "auto", width: 3, height: 3, borderRadius: "50%", background: accent, boxShadow: `0 0 5px ${accent}`, flexShrink: 0 }} />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ height: 1, background: border, margin: "0 8px" }} />

      <div style={{ position: "relative", zIndex: 1 }} className="px-2 py-3 space-y-px">
        <button
          onClick={toggleTheme}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start",
            padding: "6px 8px", background: "transparent",
            border: "none", cursor: "pointer", borderLeft: "2px solid transparent", fontFamily: "inherit",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 10, color: dimText, transition: "color 0.15s" }}>{dark ? "○" : "●"}</span>
          {!collapsed && <span style={{ fontSize: 9, letterSpacing: "0.14em", color: dimText, fontFamily: "inherit" }}>{dark ? "LIGHT" : "DARK"}</span>}
        </button>

        <button
          onClick={() => signOut()}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start",
            padding: "6px 8px", background: "transparent",
            border: "none", cursor: "pointer", borderLeft: "2px solid transparent", fontFamily: "inherit",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 10, color: dimText }}>×</span>
          {!collapsed && <span style={{ fontSize: 9, letterSpacing: "0.14em", color: dimText, fontFamily: "inherit" }}>LOGOUT</span>}
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
    </div>
  );
}

export default function Sidebar() {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const dark = theme === "dark";
  const bg = dark ? "#0a0a0a" : "#f5f0e8";
  const border = dark ? "#1e1e1e" : "#d6cfc0";

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          position: "sticky",
          top: 0,
          transition: "width 0.3s",
          flexShrink: 0,
          height: "100vh",
        }}
        className={`hidden md:flex flex-col ${collapsed ? "w-14" : "w-52"}`}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Mobile top bar */}
      <div
        style={{
          background: bg,
          borderBottom: `1px solid ${border}`,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          zIndex: 40,
        }}
        className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <div style={{
            width: 6, height: 6, background: "#22c55e", borderRadius: "50%",
            boxShadow: "0 0 6px #22c55e", animation: "quantPulse 2s infinite",
          }} />
          <span style={{ color: dark ? "#ffffff" : "#1a1510", fontSize: 11, letterSpacing: "0.2em", fontWeight: 700 }}>
            QUANT
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            background: "transparent",
            border: `1px solid ${border}`,
            color: dark ? "#888" : "#7a7060",
            padding: "4px 10px",
            borderRadius: 3,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ≡
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 48,
          }}
          className="md:hidden"
        />
      )}

      {/* Mobile drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: mobileOpen ? 0 : "-100%",
          width: "min(280px, 85vw)",
          height: "100vh",
          zIndex: 49,
          transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="md:hidden"
      >
        <SidebarContent
          collapsed={false}
          setCollapsed={() => {}}
          onNavClick={() => setMobileOpen(false)}
        />
      </div>

      <style>{`
        @keyframes quantPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  );
}
