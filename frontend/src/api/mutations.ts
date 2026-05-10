import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import type {
  CreateWalletResponse,
  UpdateWalletResponse,
  WalletTypeEnum,
  CreateRecurringTransactionResponse,
  UpdateRecurringTransactionResponse,
  CreateBodyMetricResponse,
  CreateBodyMeasurementResponse,
  CreateQuestResponse,
  UpdateTaskStatusResponse,
  QuestCategoryEnum,
  QuestStatusEnum,
  TaskStatusEnum,
  MilestoneStatusEnum,
  BudgetPeriodEnum,
  CreateDebtResponse,
  UpdateDebtResponse,
  AddRepaymentResponse,
  DebtTypeEnum,
} from "@/schemas";
import type {
  RecurringTransactionPeriodEnum,
  RecurringTransactionTypeEnum,
  RecurringEndConditionEnum,
} from "@/schemas";

// ── Wallet mutations ──────────────────────────────────────────────────────────

export interface CreateWalletInput {
  name: string;
  type: WalletTypeEnum;
  credit_limit?: number;
  initial_balance?: number;
}

export interface UpdateWalletInput {
  name?: string;
  type?: WalletTypeEnum;
  credit_limit?: number | null;
  current_balance?: number;
}

export function useMutationCreateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWalletInput) =>
      apiClient.post<CreateWalletResponse>("/api/wallet", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationUpdateWallet(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWalletInput) =>
      apiClient.patch<UpdateWalletResponse>(`/api/wallet/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationDeleteWallet(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/wallet/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
      qc.invalidateQueries({ queryKey: ["/api/query/transactions"] });
    },
  });
}

export function useGetWalletRecordCount() {
  return (id: number) =>
    apiClient.get<{ isSuccess: boolean; count: number }>(`/api/wallet/${id}/record-count`);
}

// ── Expense mutations ─────────────────────────────────────────────────────────

export interface CreateExpenseInput {
  date: string;
  amount: number;
  currency?: string;
  category_id: number;
  description?: string;
  wallet_id: number;
}

export interface UpdateExpenseInput {
  date?: string;
  amount?: number;
  currency?: string;
  category_id?: number;
  description?: string | null;
  wallet_id?: number | null;
}

export function useMutationCreateExpense(from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseInput) =>
      apiClient.post<{ isSuccess: boolean }>("/api/entry/expense", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationUpdateExpense(id: number, from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExpenseInput) =>
      apiClient.patch<{ isSuccess: boolean }>(`/api/entry/expense/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationDeleteExpense(from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean }>(`/api/entry/expense/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

// ── Income (Deposit) mutations ────────────────────────────────────────────────

export interface CreateIncomeInput {
  wallet_id: number;
  date: string;
  amount: number;
  currency?: string;
  category_id: number;
  description?: string;
}

export interface UpdateIncomeInput {
  wallet_id?: number;
  date?: string;
  amount?: number;
  currency?: string;
  category_id?: number;
  description?: string | null;
}

export function useMutationCreateIncome(from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncomeInput) =>
      apiClient.post<{ isSuccess: boolean }>("/api/entry/income", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationUpdateIncome(id: number, from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIncomeInput) =>
      apiClient.patch<{ isSuccess: boolean }>(`/api/entry/income/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationDeleteIncome(from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean }>(`/api/entry/income/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

// ── Transfer mutations ────────────────────────────────────────────────────────

export interface CreateTransferInput {
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  currency?: string;
  description?: string;
  date: string;
}

export interface UpdateTransferInput {
  from_wallet_id?: number;
  to_wallet_id?: number;
  amount?: number;
  currency?: string;
  description?: string | null;
  date?: string;
}

export function useMutationCreateTransfer(from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferInput) =>
      apiClient.post<{ isSuccess: boolean }>("/api/entry/transfer", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationUpdateTransfer(id: number, from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTransferInput) =>
      apiClient.patch<{ isSuccess: boolean }>(`/api/entry/transfer/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationDeleteTransfer(from: string, to: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean }>(`/api/entry/transfer/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/transactions", from, to] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

// ── Recurring Transaction mutations ──────────────────────────────────────────

export interface CreateRecurringTransactionInput {
  type: RecurringTransactionTypeEnum;
  name: string;
  amount: number;
  category_id?: number;
  wallet_id?: number;
  period: RecurringTransactionPeriodEnum;
  interval: number;
  week_days?: number[];
  month_end: boolean;
  end_condition: RecurringEndConditionEnum;
  end_date?: string;
  occurrences?: number;
  description?: string;
  start_date: string;
  to_wallet_id?: number;
  asset_id?: number;
  from_asset_id?: number;
}

export interface UpdateRecurringTransactionInput {
  type?: RecurringTransactionTypeEnum;
  name?: string;
  amount?: number;
  category_id?: number | null;
  wallet_id?: number | null;
  period?: RecurringTransactionPeriodEnum;
  interval?: number;
  week_days?: number[];
  month_end?: boolean;
  end_condition?: RecurringEndConditionEnum;
  end_date?: string | null;
  occurrences?: number | null;
  description?: string | null;
  start_date?: string;
  to_wallet_id?: number | null;
  asset_id?: number | null;
  from_asset_id?: number | null;
}

export function useMutationCreateRecurringTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringTransactionInput) =>
      apiClient.post<CreateRecurringTransactionResponse>("/api/recurring-transaction", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/recurring-transactions"] });
    },
  });
}

export function useMutationUpdateRecurringTransaction(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRecurringTransactionInput) =>
      apiClient.patch<UpdateRecurringTransactionResponse>(`/api/recurring-transaction/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/recurring-transactions"] });
    },
  });
}

// ── Body measurement mutations ────────────────────────────────────────────────

export interface CreateBodyMetricInput {
  name: string;
  unit: string;
}

export function useMutationCreateBodyMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBodyMetricInput) =>
      apiClient.post<CreateBodyMetricResponse>("/api/body/metric", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/body/metrics"] });
    },
  });
}

export function useMutationUpdateBodyMetric(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient.patch<{ isSuccess: boolean; message: string }>(`/api/body/metric/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/body/metrics"] });
    },
  });
}

export function useMutationDeleteBodyMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/body/metric/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/body/metrics"] });
    },
  });
}

export interface CreateBodyMeasurementInput {
  metric_id: number;
  value: number;
  recorded_at: string;
}

export function useMutationCreateBodyMeasurement(metricId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBodyMeasurementInput) =>
      apiClient.post<CreateBodyMeasurementResponse>("/api/body/measurement", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/body/measurements", metricId] });
      qc.invalidateQueries({ queryKey: ["/api/query/body/metrics"] });
    },
  });
}

// ── Time bucket mutations ─────────────────────────────────────────────────────

export interface CreateTimeBucketInput {
  name: string;
  color: string;
  is_distraction: boolean;
  quest_id?: string | null;
}

export interface UpdateTimeBucketInput {
  name?: string;
  color?: string;
  is_distraction?: boolean;
  quest_id?: string | null;
}

export function useMutationCreateTimeBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeBucketInput) =>
      apiClient.post<{ isSuccess: boolean; bucket_id: number }>("/api/time-bucket", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/time-bucket"] });
    },
  });
}

export function useMutationUpdateTimeBucket(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTimeBucketInput) =>
      apiClient.patch<{ isSuccess: boolean; message: string }>(`/api/time-bucket/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/time-bucket"] });
    },
  });
}

export function useMutationDeleteTimeBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/time-bucket/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/time-bucket"] });
    },
  });
}

// ── Quest mutations ───────────────────────────────────────────────────────────

export interface CreateQuestInput {
  name: string;
  description?: string;
  category: QuestCategoryEnum;
  color: string;
  deadline?: string;
}

export interface UpdateQuestInput {
  name?: string;
  description?: string | null;
  category?: QuestCategoryEnum;
  color?: string;
  status?: QuestStatusEnum;
  deadline?: string | null;
}

export function useMutationCreateQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestInput) =>
      apiClient.post<CreateQuestResponse>("/api/quest", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests"] });
    },
  });
}

export function useMutationUpdateQuest(questId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateQuestInput) =>
      apiClient.patch<{ isSuccess: boolean; message: string }>(`/api/quest/${questId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests"] });
      qc.invalidateQueries({ queryKey: ["/api/query/quests/detail", questId] });
    },
  });
}

export function useMutationDeleteQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/quest/${questId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests"] });
    },
  });
}

// ── Milestone mutations ───────────────────────────────────────────────────────

export interface CreateMilestoneInput {
  name: string;
  xp_reward?: number;
  due_date?: string;
  order?: number;
}

export interface UpdateMilestoneInput {
  name?: string;
  xp_reward?: number;
  due_date?: string | null;
  status?: MilestoneStatusEnum;
  order?: number;
}

export function useMutationCreateMilestone(questId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMilestoneInput) =>
      apiClient.post<{ isSuccess: boolean; milestone_id: number }>(`/api/quest/${questId}/milestone`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests/detail", questId] });
    },
  });
}

export function useMutationUpdateMilestone(questId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, ...data }: UpdateMilestoneInput & { milestoneId: number }) =>
      apiClient.patch<{ isSuccess: boolean; message: string }>(`/api/quest/milestone/${milestoneId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests/detail", questId] });
    },
  });
}

// ── Task mutations ────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  name: string;
  milestone_id?: number;
  xp_reward?: number;
  due_date?: string;
}

export function useMutationCreateTask(questId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      apiClient.post<{ isSuccess: boolean; task_id: number; xp_awarded: number }>(`/api/quest/${questId}/task`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests/detail", questId] });
      qc.invalidateQueries({ queryKey: ["/api/query/quests/kanban"] });
    },
  });
}

export function useMutationUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatusEnum }) =>
      apiClient.patch<UpdateTaskStatusResponse>(`/api/quest/task/${taskId}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests"] });
      qc.invalidateQueries({ queryKey: ["/api/query/quests/detail"] });
      qc.invalidateQueries({ queryKey: ["/api/query/quests/kanban"] });
    },
  });
}

export function useMutationDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/quest/task/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/quests/detail"] });
      qc.invalidateQueries({ queryKey: ["/api/query/quests/kanban"] });
    },
  });
}

// ── Budget mutations ──────────────────────────────────────────────────────────

export interface CreateBudgetInput {
  name: string;
  color: string;
  category_ids: number[];
  amount: number;
  period: BudgetPeriodEnum;
}

export interface UpdateBudgetInput {
  name?: string;
  color?: string;
  category_ids?: number[];
  amount?: number;
  period?: BudgetPeriodEnum;
}

export function useMutationCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetInput) =>
      apiClient.post<{ isSuccess: boolean; message: string }>("/api/budget", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/budgets"] });
    },
  });
}

export function useMutationUpdateBudget(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBudgetInput) =>
      apiClient.patch<{ isSuccess: boolean; message: string }>(`/api/budget/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/budgets"] });
    },
  });
}

export function useMutationDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/budget/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/budgets"] });
    },
  });
}

// ── Money Category mutations ──────────────────────────────────────────────────

export interface CreateMoneyCategoryInput {
  name: string;
  display_label: string;
  color: string;
  type: "expense" | "income";
}

export interface UpdateMoneyCategoryInput {
  display_label?: string;
  color?: string;
}

export function useMutationCreateMoneyCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMoneyCategoryInput) =>
      apiClient.post<{ isSuccess: boolean; message: string }>("/api/money-category", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/money-category"] });
    },
  });
}

export function useMutationUpdateMoneyCategory(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMoneyCategoryInput) =>
      apiClient.patch<{ isSuccess: boolean; message: string }>(`/api/money-category/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/money-category"] });
    },
  });
}

export function useMutationDeleteMoneyCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/money-category/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/money-category"] });
    },
  });
}

// ── Debt mutations ────────────────────────────────────────────────────────────

export interface CreateDebtInput {
  type: DebtTypeEnum;
  counterparty_name: string;
  amount: number;
  date: string;
  color: string;
  description?: string;
  wallet_id: number;
}

export interface UpdateDebtInput {
  counterparty_name?: string;
  amount?: number;
  date?: string;
  color?: string;
  description?: string | null;
}

export interface AddRepaymentInput {
  amount: number;
  date: string;
  note?: string;
  wallet_id: number;
}

export function useMutationCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDebtInput) =>
      apiClient.post<CreateDebtResponse>("/api/debt", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/debts"] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateDebtInput & { id: number }) =>
      apiClient.put<UpdateDebtResponse>(`/api/debt/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/debts"] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

export function useMutationAddRepayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ debtId, ...data }: AddRepaymentInput & { debtId: number }) =>
      apiClient.post<AddRepaymentResponse>(`/api/debt/${debtId}/repayment`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/query/debts"] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
    },
  });
}

// ── Investment mutations ─────────────────────────────────────────────────────

import type {
  CreateInvestmentAccountResponse,
  UpdateInvestmentAccountResponse,
  CreateInvestmentAssetResponse,
  UpdateInvestmentAssetResponse,
  AddCashFlowResponse,
  UpdateAssetValueResponse,
} from "@/schemas";

const INV_KEY = "/api/investments";

export function useMutationCreateInvestmentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient.post<CreateInvestmentAccountResponse>("/api/investments/accounts", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [INV_KEY] }); },
  });
}

export function useMutationUpdateInvestmentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string }) =>
      apiClient.patch<UpdateInvestmentAccountResponse>(`/api/investments/accounts/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [INV_KEY] }); },
  });
}

export function useMutationDeleteInvestmentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/investments/accounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [INV_KEY] }); },
  });
}

export function useMutationCreateInvestmentAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, name }: { accountId: number; name: string }) =>
      apiClient.post<CreateInvestmentAssetResponse>(`/api/investments/accounts/${accountId}/assets`, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [INV_KEY] }); },
  });
}

export function useMutationUpdateInvestmentAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      apiClient.patch<UpdateInvestmentAssetResponse>(`/api/investments/assets/${id}`, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [INV_KEY] }); },
  });
}

export function useMutationDeleteInvestmentAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/investments/assets/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [INV_KEY] }); },
  });
}

export function useMutationAddCashFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, ...data }: { assetId: number; amount: number; date: string; wallet_id?: number; description?: string }) =>
      apiClient.post<AddCashFlowResponse>(`/api/investments/assets/${assetId}/cashflows`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INV_KEY] });
      qc.invalidateQueries({ queryKey: ["/api/query/wallets"] });
      qc.invalidateQueries({ queryKey: ["/api/query/transactions"] });
    },
  });
}

export function useMutationDeleteCashFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ isSuccess: boolean; message: string }>(`/api/investments/cashflows/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INV_KEY] });
      qc.invalidateQueries({ queryKey: ["/api/query/transactions"] });
    },
  });
}

export function useMutationUpdateAssetValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, ...data }: { assetId: number; value: number; snapshot_date: string }) =>
      apiClient.post<UpdateAssetValueResponse>(`/api/investments/assets/${assetId}/value`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [INV_KEY] }); },
  });
}
