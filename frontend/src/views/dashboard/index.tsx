import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import FoodPage from "./food";
import ExpensesPage from "./expenses";
import TimePage from "./time";
import BodyPage from "./body";
import SettingsPage from "./settings";
import ScratchpadPage from "./scratchpad";

export default function DashboardPage() {
  const location = useLocation();
  const isExpenses = location.pathname === "/expenses";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className={isExpenses ? "w-full" : "max-w-3xl mx-auto"}>
          <Routes>
            <Route path="/" element={<Navigate to="/food" replace />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/time" element={<TimePage />} />
            <Route path="/body" element={<BodyPage />} />
            <Route path="/scratchpad" element={<ScratchpadPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
