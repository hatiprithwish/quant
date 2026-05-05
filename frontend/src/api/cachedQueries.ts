import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import type {
  GetFoodSummaryResponse,
  GetExpenseSummaryResponse,
  GetTimeSummaryResponse,
  GetScratchpadResponse,
  GetWalletsResponse,
  GetBudgetsResponse,
  GetDebtsResponse,
  GetRecurringTransactionsResponse,
  GetTransactionsResponse,
  GetBodyMetricsResponse,
  GetBodyMeasurementsResponse,
} from "@/schemas";
import { BudgetPeriodEnum } from "@/schemas";

export function useGetFood(from: string, to: string) {
  const isEnabled = Boolean(from && to);
  return useQuery({
    queryKey: ["/api/query/food", from, to],
    queryFn: () =>
      apiClient.post<GetFoodSummaryResponse>("/api/query/food", { from, to }),
    enabled: isEnabled,
  });
}

export function useGetExpenses(
  from: string,
  to: string,
  category?: string
) {
  const isEnabled = Boolean(from && to);
  return useQuery({
    queryKey: ["/api/query/expenses", from, to, category],
    queryFn: () =>
      apiClient.post<GetExpenseSummaryResponse>("/api/query/expenses", {
        from,
        to,
        category,
      }),
    enabled: isEnabled,
  });
}

export function useGetTime(from: string, to: string, bucket?: string) {
  const isEnabled = Boolean(from && to);
  return useQuery({
    queryKey: ["/api/query/time", from, to, bucket],
    queryFn: () =>
      apiClient.post<GetTimeSummaryResponse>("/api/query/time", {
        from,
        to,
        bucket,
      }),
    enabled: isEnabled,
  });
}

export function useGetScratchpad() {
  return useQuery({
    queryKey: ["/api/scratchpad"],
    queryFn: () => apiClient.get<GetScratchpadResponse>("/api/scratchpad"),
  });
}

export function useGetWallets() {
  return useQuery({
    queryKey: ["/api/query/wallets"],
    queryFn: () => apiClient.post<GetWalletsResponse>("/api/query/wallets", {}),
  });
}

export function useGetBudgets(period: BudgetPeriodEnum, startDate: string) {
  const isEnabled = Boolean(startDate);
  return useQuery({
    queryKey: ["/api/query/budgets", period, startDate],
    queryFn: () =>
      apiClient.post<GetBudgetsResponse>("/api/query/budgets", { period, startDate }),
    enabled: isEnabled,
  });
}

export function useGetDebts() {
  return useQuery({
    queryKey: ["/api/query/debts"],
    queryFn: () => apiClient.post<GetDebtsResponse>("/api/query/debts", {}),
  });
}

export function useGetRecurringTransactions() {
  return useQuery({
    queryKey: ["/api/query/recurring-transactions"],
    queryFn: () =>
      apiClient.post<GetRecurringTransactionsResponse>("/api/query/recurring-transactions", {}),
  });
}

export function useGetTransactions(from: string, to: string) {
  const isEnabled = Boolean(from && to);
  return useQuery({
    queryKey: ["/api/query/transactions", from, to],
    queryFn: () =>
      apiClient.post<GetTransactionsResponse>("/api/query/transactions", { from, to }),
    enabled: isEnabled,
  });
}

export function useGetBodyMetrics() {
  return useQuery({
    queryKey: ["/api/query/body/metrics"],
    queryFn: () => apiClient.get<GetBodyMetricsResponse>("/api/query/body/metrics"),
  });
}

export function useGetBodyMeasurements(metricId: number, from: string, to: string) {
  const isEnabled = Boolean(metricId && from && to);
  return useQuery({
    queryKey: ["/api/query/body/measurements", metricId, from, to],
    queryFn: () =>
      apiClient.post<GetBodyMeasurementsResponse>("/api/query/body/measurements", {
        metric_id: metricId,
        from,
        to,
      }),
    enabled: isEnabled,
  });
}
