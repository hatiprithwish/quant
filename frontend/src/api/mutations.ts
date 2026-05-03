import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import type {
  CreateWalletResponse,
  UpdateWalletResponse,
  WalletTypeEnum,
  DepositCategoryEnum,
  ExpenseCategoryLabelEnum,
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
