import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";

const NAV_ITEMS = [
  { to: "/food", label: "Food", icon: "🥗" },
  { to: "/expenses", label: "Expenses", icon: "💸" },
  { to: "/time", label: "Time", icon: "⏱" },
  { to: "/scratchpad", label: "Scratchpad", icon: "📝" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`min-h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="px-3 py-5 border-b border-gray-100 flex items-center justify-between">
        {!collapsed && (
          <span className="text-lg font-bold text-gray-900">Life Tracker</span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${
            collapsed ? "mx-auto" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <span>{icon}</span>
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut()}
          title={collapsed ? "Sign out" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span>🚪</span>
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
