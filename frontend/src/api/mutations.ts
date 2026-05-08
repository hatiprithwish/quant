import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import type {
  CreateWalletResponse,
  UpdateWalletResponse,
  WalletTypeEnum,
  DepositCategoryEnum,
  ExpenseCategoryLabelEnum,
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
  category: ExpenseCategoryLabelEnum;
  description?: string;
  wallet_id: number;
}

export interface UpdateExpenseInput {
  date?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategoryLabelEnum;
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
  category: DepositCategoryEnum;
  description?: string;
}

export interface UpdateIncomeInput {
  wallet_id?: number;
  date?: string;
  amount?: number;
  currency?: string;
  category?: DepositCategoryEnum;
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
  category: ExpenseCategoryLabelEnum;
  wallet_id: number;
  period: RecurringTransactionPeriodEnum;
  interval: number;
  week_days?: number[];
  month_end: boolean;
  end_condition: RecurringEndConditionEnum;
  end_date?: string;
  occurrences?: number;
  description?: string;
  start_date: string;
}

export interface UpdateRecurringTransactionInput {
  type?: RecurringTransactionTypeEnum;
  name?: string;
  amount?: number;
  category?: ExpenseCategoryLabelEnum;
  wallet_id?: number;
  period?: RecurringTransactionPeriodEnum;
  interval?: number;
  week_days?: number[];
  month_end?: boolean;
  end_condition?: RecurringEndConditionEnum;
  end_date?: string | null;
  occurrences?: number | null;
  description?: string | null;
  start_date?: string;
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
  categories: ExpenseCategoryLabelEnum[];
  amount: number;
  period: BudgetPeriodEnum;
}

export interface UpdateBudgetInput {
  name?: string;
  color?: string;
  categories?: ExpenseCategoryLabelEnum[];
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
