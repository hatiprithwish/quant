import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import type {
  GetFoodSummaryResponse,
  GetExpenseSummaryResponse,
  GetTimeSummaryResponse,
  GetTimeBucketsResponse,
  GetBucketEntriesResponse,
  GetWalletsResponse,
  GetBudgetsResponse,
  GetDebtsResponse,
  GetRecurringTransactionsResponse,
  GetTransactionsResponse,
  GetBodyMetricsResponse,
  GetBodyMeasurementsResponse,
  GetQuestsDashboardResponse,
  GetQuestDetailResponse,
  GetQuestsKanbanResponse,
  GetMoneyCategoriesResponse,
  GetInvestmentsResponse,
  GetDailyLogResponse,
  ListDailyLogsResponse,
  GetTrajectoryDashboardResponse,
  GetVaultResponse,
  GetTrajectoryConfigResponse,
  GetWeeklyCheckinResponse,
  GetCheckinHistoryResponse,
  GetEliminationItemsResponse,
} from "@/schemas";
import { BudgetPeriodEnum } from "@/schemas";

// ── Trajectory queries ────────────────────────────────────────────────────────

export function useGetTrajectoryDashboard() {
  return useQuery({
    queryKey: ["/api/trajectory/dashboard"],
    queryFn: () => apiClient.get<GetTrajectoryDashboardResponse>("/api/trajectory/dashboard"),
  });
}

export function useGetTrajectoryConfig() {
  return useQuery({
    queryKey: ["/api/trajectory/config"],
    queryFn: () => apiClient.get<GetTrajectoryConfigResponse>("/api/trajectory/config"),
  });
}

export function useGetVault() {
  return useQuery({
    queryKey: ["/api/trajectory/vault"],
    queryFn: () => apiClient.get<GetVaultResponse>("/api/trajectory/vault"),
  });
}

export function useGetWeeklyCheckin(weekStart: string) {
  const isEnabled = Boolean(weekStart);
  return useQuery({
    queryKey: ["/api/trajectory/checkin", weekStart],
    queryFn: () => apiClient.get<GetWeeklyCheckinResponse>(`/api/trajectory/checkin/${weekStart}`),
    enabled: isEnabled,
  });
}

export function useGetCheckinHistory() {
  return useQuery({
    queryKey: ["/api/trajectory/checkins"],
    queryFn: () => apiClient.get<GetCheckinHistoryResponse>("/api/trajectory/checkins"),
  });
}

export function useGetEliminationItems(weekStart: string) {
  const isEnabled = Boolean(weekStart);
  return useQuery({
    queryKey: ["/api/trajectory/elimination", weekStart],
    queryFn: () => apiClient.get<GetEliminationItemsResponse>(`/api/trajectory/elimination/${weekStart}`),
    enabled: isEnabled,
  });
}

// ── Habits queries ────────────────────────────────────────────────────────────

export interface GetHabitsResponse {
  isSuccess: boolean;
  message: string;
  week_from: string;
  week_to: string;
  habits: HabitData[];
  daysWithDailyLog: number;
  totalDays: number;
}

export interface HabitData {
  key: string;
  label: string;
  category: "time" | "food" | "money" | "investment" | "manual";
  is_distraction: boolean;
  occurred_days: number;
  total_days: number;
  hours?: number;
  amount?: number;
  count?: number;
  source: "auto" | "ai" | "manual";
  badge: "AUTO" | "AI" | "MANUAL";
  details: string;
  trend: "good" | "bad" | "neutral";
}

export function useGetHabits(from: string, to: string) {
  const isEnabled = Boolean(from && to);
  return useQuery({
    queryKey: ["/api/habits", from, to],
    queryFn: () => apiClient.get<GetHabitsResponse>(`/api/habits?from=${from}&to=${to}`),
    enabled: isEnabled,
  });
}

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

export function useGetTime(from: string, to: string, bucket_id?: number) {
  const isEnabled = Boolean(from && to);
  return useQuery({
    queryKey: ["/api/query/time", from, to, bucket_id],
    queryFn: () =>
      apiClient.post<GetTimeSummaryResponse>("/api/query/time", {
        from,
        to,
        bucket_id,
      }),
    enabled: isEnabled,
  });
}

export function useGetTimeBuckets() {
  return useQuery({
    queryKey: ["/api/time-bucket"],
    queryFn: () => apiClient.get<GetTimeBucketsResponse>("/api/time-bucket"),
  });
}

export function useGetBucketEntries(
  bucketId: number,
  page: number,
  search: string,
  pageSize = 25,
) {
  return useQuery({
    queryKey: ["/api/time-entry", bucketId, page, search, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({
        bucket_id: String(bucketId),
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.set("search", search);
      return apiClient.get<GetBucketEntriesResponse>(`/api/time-entry?${params.toString()}`);
    },
    enabled: bucketId > 0,
  });
}

export function useGetQuestsDashboard(from: string, to: string) {
  const isEnabled = Boolean(from && to);
  return useQuery({
    queryKey: ["/api/query/quests", from, to],
    queryFn: () =>
      apiClient.post<GetQuestsDashboardResponse>("/api/query/quests", { from, to }),
    enabled: isEnabled,
  });
}

export function useGetQuestDetail(questId: string) {
  const isEnabled = Boolean(questId);
  return useQuery({
    queryKey: ["/api/query/quests/detail", questId],
    queryFn: () =>
      apiClient.post<GetQuestDetailResponse>(`/api/query/quests/detail/${questId}`, {}),
    enabled: isEnabled,
  });
}

export function useGetQuestsKanban() {
  return useQuery({
    queryKey: ["/api/query/quests/kanban"],
    queryFn: () =>
      apiClient.post<GetQuestsKanbanResponse>("/api/query/quests/kanban", {}),
  });
}

export function useGetDailyLog(date: string) {
  const isEnabled = Boolean(date);
  return useQuery({
    queryKey: ["/api/daily-log", date],
    queryFn: () => apiClient.get<GetDailyLogResponse>(`/api/daily-log/${date}`),
    enabled: isEnabled,
  });
}

export function useGetDailyLogs() {
  return useQuery({
    queryKey: ["/api/daily-logs"],
    queryFn: () => apiClient.get<ListDailyLogsResponse>("/api/daily-log"),
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

export function useGetMoneyCategories() {
  return useQuery({
    queryKey: ["/api/money-category"],
    queryFn: () => apiClient.get<GetMoneyCategoriesResponse>("/api/money-category"),
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

export function useGetInvestments() {
  return useQuery({
    queryKey: ["/api/investments"],
    queryFn: () => apiClient.get<GetInvestmentsResponse>("/api/investments"),
  });
}
