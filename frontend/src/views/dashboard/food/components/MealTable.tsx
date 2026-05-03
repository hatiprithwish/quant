import { useState } from "react";
import type { DailyFoodSummary } from "@/schemas";
import { mealTypeDisplayLabel } from "@/schemas";

interface Props {
  days: DailyFoodSummary[];
}

export default function MealTable({ days }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (days.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
        No food logged for this period.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...days].reverse().map((day) => (
        <div
          key={day.date}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-5 py-3 flex justify-between items-center">
            <span className="font-medium text-gray-800 dark:text-gray-200">{day.date}</span>
            <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {day.total_calories} kcal
              </span>
              <span>P {day.total_protein_g.toFixed(0)}g</span>
              <span>C {day.total_carb_g.toFixed(0)}g</span>
              <span>F {day.total_fat_g.toFixed(0)}g</span>
            </div>
          </div>

          {day.meals.map((meal) => {
            const key = `${day.date}-${meal.meal_type}`;
            const isOpen = expanded === key;
            return (
              <div key={key} className="border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full px-5 py-2.5 flex justify-between items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {mealTypeDisplayLabel[meal.meal_type]}
                  </span>
                  <div className="flex gap-3 text-gray-400 dark:text-gray-500">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {meal.total_calories} kcal
                    </span>
                    <span>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-3 space-y-1">
                    {meal.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs text-gray-600 dark:text-gray-400 py-1 border-t border-gray-50 dark:border-gray-800"
                      >
                        <span>
                          {item.name}
                          {item.amount && item.unit
                            ? ` (${item.amount}${item.unit})`
                            : ""}
                        </span>
                        <span className="text-gray-500 dark:text-gray-500">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
