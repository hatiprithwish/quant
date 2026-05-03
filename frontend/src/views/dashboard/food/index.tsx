import { useState } from "react";
import { useGetFood } from "@/api/cachedQueries";
import DateRangeSelector from "@/components/common/DateRangeSelector";
import FoodChart from "./components/FoodChart";
import MealTable from "./components/MealTable";

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function FoodPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const { data, isLoading, error } = useGetFood(from, to);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Food & Nutrition</h2>
        <DateRangeSelector
          group="food"
          from={from}
          to={to}
          onChange={(f, t) => { setFrom(f); setTo(t); }}
        />
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Failed to load food data.
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Calories", value: `${data.totalCalories} kcal`, color: "indigo" },
              { label: "Protein", value: `${data.totalProtein_g.toFixed(0)}g`, color: "emerald" },
              { label: "Carbs", value: `${data.totalCarb_g.toFixed(0)}g`, color: "amber" },
              { label: "Fat", value: `${data.totalFat_g.toFixed(0)}g`, color: "rose" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className={`text-xs font-medium text-${color}-600 dark:text-${color}-400 mb-1`}>{label}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
              </div>
            ))}
          </div>

          {data.days.length > 1 && <FoodChart days={data.days} />}

          <MealTable days={data.days} />
        </>
      )}
    </div>
  );
}
