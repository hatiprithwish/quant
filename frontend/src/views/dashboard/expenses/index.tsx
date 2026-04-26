import { useState } from "react";
import { useGetExpenses } from "@/api/cachedQueries";
import DateRangeSelector from "@/components/common/DateRangeSelector";
import ExpenseCharts from "./components/ExpenseCharts";
import { expenseCategoryDisplayLabel } from "@/schemas";

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function ExpensesPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const { data, isLoading, error } = useGetExpenses(from, to);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
        <DateRangeSelector
          group="expenses"
          from={from}
          to={to}
          onChange={(f, t) => { setFrom(f); setTo(t); }}
        />
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          Failed to load expense data.
        </div>
      )}

      {data && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <span className="text-sm text-gray-500">Total spent</span>
            <span className="text-3xl font-bold text-gray-900">
              ₹{data.grandTotal.toFixed(0)}
            </span>
          </div>

          <ExpenseCharts data={data} />

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              All Entries
            </div>
            {data.byDay.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No expenses logged for this period.
              </div>
            ) : (
              data.byDay
                .slice()
                .reverse()
                .map((day) => (
                  <div key={day.date}>
                    <div className="px-5 py-2 bg-gray-50 text-xs font-medium text-gray-500 flex justify-between">
                      <span>{day.date}</span>
                      <span>₹{day.total.toFixed(0)}</span>
                    </div>
                    {day.items.map((item) => (
                      <div
                        key={item.id}
                        className="px-5 py-2.5 flex justify-between items-center border-t border-gray-50 text-sm"
                      >
                        <div>
                          <span className="text-gray-800">{item.description ?? "—"}</span>
                          <span className="ml-2 text-xs text-gray-400">
                            {expenseCategoryDisplayLabel[item.category]}
                          </span>
                          {item.payment_method && (
                            <span className="ml-2 text-xs text-gray-400">
                              · {item.payment_method}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-700">
                          {item.currency} {item.amount.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
