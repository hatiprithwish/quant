import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/context/ThemeContext";

function IconFood() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function IconExpenses() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconTime() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconScratchpad() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconBody() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      <path d="M6.5 8a1 1 0 0 0-.96.73L3 17h18l-2.54-8.27A1 1 0 0 0 17.5 8h-11z" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/food", label: "Food", icon: <IconFood /> },
  { to: "/expenses", label: "Expenses", icon: <IconExpenses /> },
  { to: "/time", label: "Time", icon: <IconTime /> },
  { to: "/body", label: "Body", icon: <IconBody /> },
  { to: "/scratchpad", label: "Scratch Pad", icon: <IconScratchpad /> },
  { to: "/settings", label: "Settings", icon: <IconSettings /> },
];

function QuantLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="16,2 30,26 2,26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line
        x1="16"
        y1="10"
        x2="16"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Sidebar() {
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`min-h-screen bg-black border-r border-neutral-800 flex flex-col transition-all duration-200 ${
        collapsed ? "w-14" : "w-44"
      }`}
    >
      <div className="px-3 py-5 border-b border-neutral-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 text-white">
            <QuantLogo />
            <span className="text-sm font-bold tracking-widest uppercase">
              Quant
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto text-white">
            <QuantLogo />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded text-neutral-500 hover:text-white transition-colors"
            aria-label="Collapse sidebar"
          >
            ←
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1 rounded text-neutral-500 hover:text-white transition-colors"
            aria-label="Expand sidebar"
          >
            →
          </button>
        </div>
      )}

      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
              }`
            }
          >
            <span className="shrink-0">{icon}</span>
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-neutral-800 space-y-0.5">
        <button
          onClick={toggleTheme}
          title={
            collapsed
              ? theme === "dark"
                ? "Light mode"
                : "Dark mode"
              : undefined
          }
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="text-xs">{theme === "dark" ? "☀" : "☾"}</span>
          {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
        </button>
        <button
          onClick={() => signOut()}
          title={collapsed ? "Sign out" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="text-xs">↩</span>
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
