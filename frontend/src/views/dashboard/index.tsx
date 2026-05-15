import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import FoodPage from "./food";
import ExpensesPage from "./expenses";
import TimePage from "./time";
import BucketEntriesPage from "./time/BucketEntriesPage";
import BodyPage from "./body";
import SettingsPage from "./settings";
import DailyLogPage from "./daily-log";
import QuestsPage from "./quests";
import QuestDetailPage from "./quests/[id]";
import QuestsBoardPage from "./quests/board";
import DebtDetailPage from "./money/debt";

const FULL_HEIGHT_PREFIXES = ["/money", "/food", "/time", "/quests"];

export default function DashboardPage() {
  const location = useLocation();

  const isFullHeight = FULL_HEIGHT_PREFIXES.some(p => location.pathname.startsWith(p));

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className={`flex-1 ${isFullHeight ? "p-0 overflow-visible flex flex-col" : "p-6 overflow-y-auto"}`}>
        <div className={isFullHeight ? "flex-1 flex flex-col min-h-0 overflow-visible" : "max-w-3xl mx-auto"}>
          <Routes>
            <Route path="/" element={<Navigate to="/food/dashboard" replace />} />
            <Route path="/food" element={<Navigate to="/food/dashboard" replace />} />
            <Route path="/food/dashboard" element={<FoodPage />} />

            <Route path="/money" element={<Navigate to="/money/dashboard" replace />} />
            <Route path="/money/dashboard"    element={<ExpensesPage tab="dashboard" />} />
            <Route path="/money/transactions" element={<ExpensesPage tab="transactions" />} />
            <Route path="/money/categories"   element={<ExpensesPage tab="categories" />} />
            <Route path="/money/lending"      element={<ExpensesPage tab="lending" />} />
            <Route path="/money/investments"  element={<ExpensesPage tab="investments" />} />
            <Route path="/money/debt"         element={<DebtDetailPage />} />

            <Route path="/time"         element={<TimePage section="log" />} />
            <Route path="/time/buckets" element={<TimePage section="buckets" />} />
            <Route path="/time/reports" element={<TimePage section="reports" />} />
            <Route path="/time/bucket/:id" element={<BucketEntriesPage />} />

            <Route path="/quests"        element={<QuestsPage filter="all" />} />
            <Route path="/quests/active" element={<QuestsPage filter="active" />} />
            <Route path="/quests/paused" element={<QuestsPage filter="paused" />} />
            <Route path="/quests/done"   element={<QuestsPage filter="done" />} />
            <Route path="/quests/board"  element={<QuestsBoardPage />} />
            <Route path="/quests/:id"    element={<QuestDetailPage />} />

            <Route path="/body"      element={<BodyPage />} />
            <Route path="/daily-log" element={<DailyLogPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
