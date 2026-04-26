import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import type {
  GetFoodSummaryResponse,
  GetExpenseSummaryResponse,
  GetTimeSummaryResponse,
} from "@/schemas";

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
