import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import FoodPage from "./food";
import ExpensesPage from "./expenses";
import TimePage from "./time";
import BucketEntriesPage from "./time/BucketEntriesPage";
import BodyPage from "./body";
import SettingsPage from "./settings";
import ScratchpadPage from "./scratchpad";
import QuestsPage from "./quests";
import QuestDetailPage from "./quests/[id]";
import QuestsBoardPage from "./quests/board";
import DebtDetailPage from "./money/debt";

const WIDE_PATHS = ["/money", "/quests", "/quests/board", "/money/debt", "/time"];

export default function DashboardPage() {
  const location = useLocation();
  const isWide = WIDE_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith("/quests/") || location.pathname.startsWith("/time/"),
  );

  const isMoneyRoute =
    location.pathname === "/money" ||
    location.pathname.startsWith("/money") ||
    location.pathname === "/food" ||
    location.pathname === "/time" ||
    location.pathname.startsWith("/time/");

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className={`flex-1 ${isMoneyRoute ? "p-0 overflow-hidden flex flex-col" : "p-6 overflow-y-auto"}`}>
        <div className={isMoneyRoute ? "flex-1 flex flex-col min-h-0 overflow-hidden" : isWide ? "w-full" : "max-w-3xl mx-auto"}>
          <Routes>
            <Route path="/" element={<Navigate to="/food" replace />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/money" element={<ExpensesPage />} />
            <Route path="/time" element={<TimePage />} />
            <Route path="/time/bucket/:id" element={<BucketEntriesPage />} />
            <Route path="/body" element={<BodyPage />} />
            <Route path="/scratchpad" element={<ScratchpadPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/quests/board" element={<QuestsBoardPage />} />
            <Route path="/quests/:id" element={<QuestDetailPage />} />
            <Route path="/money/debt" element={<DebtDetailPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
