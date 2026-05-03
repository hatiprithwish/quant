import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/context/ThemeContext";

const NAV_ITEMS = [
  { to: "/food", label: "Food" },
  { to: "/expenses", label: "Expenses" },
  { to: "/time", label: "Time" },
  { to: "/settings", label: "Settings" },
];

function QuantLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 30,26 2,26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="16" y1="10" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
            <span className="text-sm font-bold tracking-widest uppercase">Quant</span>
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
        {NAV_ITEMS.map(({ to, label }) => (
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
            {({ isActive }) => (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? "bg-white" : "bg-neutral-600"
                  }`}
                />
                {!collapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-neutral-800 space-y-0.5">
        <button
          onClick={toggleTheme}
          title={collapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
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
