import { DrizzleDb } from "../db";
import { InvestmentDAL } from "../data-access-layer/InvestmentDAL";
import {
  GetInvestmentsResponse,
  CreateInvestmentAccountResponse,
  UpdateInvestmentAccountResponse,
  DeleteInvestmentAccountResponse,
  CreateInvestmentAssetResponse,
  UpdateInvestmentAssetResponse,
  DeleteInvestmentAssetResponse,
  AddCashFlowResponse,
  DeleteCashFlowResponse,
  UpdateAssetValueResponse,
  AccountEntry,
  AssetEntry,
  PortfolioSummary,
  CreateInvestmentAccountRequest,
  UpdateInvestmentAccountRequest,
  CreateInvestmentAssetRequest,
  UpdateInvestmentAssetRequest,
  AddCashFlowRequest,
  UpdateAssetValueRequest,
} from "../schemas";

function computeXirr(
  cashFlows: { amount: number; date: string }[],
  terminalValue: number,
  terminalDate: string,
): number | null {
  if (cashFlows.length === 0 || terminalValue <= 0) return null;

  const allFlows = [
    ...cashFlows.map((cf) => ({ amount: -cf.amount, date: cf.date })),
    { amount: terminalValue, date: terminalDate },
  ];

  const dates = allFlows.map((f) => new Date(f.date).getTime());
  const t0 = dates[0];
  const amounts = allFlows.map((f) => f.amount);
  const years = dates.map((d) => (d - t0) / (365.25 * 24 * 3600 * 1000));

  function npv(rate: number): number {
    return amounts.reduce((sum, amt, i) => sum + amt / Math.pow(1 + rate, years[i]), 0);
  }

  let lo = -0.999;
  let hi = 100;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-8) break;
  }
  const result = (lo + hi) / 2;
  if (!isFinite(result) || isNaN(result)) return null;
  return Math.round(result * 10000) / 100;
}

function buildAssetEntry(
  asset: { id: number; name: string },
  flows: { id: number; amount: number; date: string; wallet_id: number | null; wallet_name: string | null; description: string | null }[],
  snapshots: { id: number; value: number; snapshot_date: string }[],
): AssetEntry {
  const sortedSnapshots = [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  const latestSnapshot = sortedSnapshots.at(-1) ?? null;
  const investedAmount = flows.reduce((s, f) => s + f.amount, 0);

  const xirr = latestSnapshot
    ? computeXirr(flows, latestSnapshot.value, latestSnapshot.snapshot_date)
    : null;

  return {
    id: asset.id,
    name: asset.name,
    current_value: latestSnapshot?.value ?? null,
    last_snapshot_date: latestSnapshot?.snapshot_date ?? null,
    invested_amount: investedAmount,
    xirr,
    cash_flows: flows.map((f) => ({
      id: f.id,
      amount: f.amount,
      date: f.date,
      wallet_id: f.wallet_id,
      wallet_name: f.wallet_name,
      description: f.description,
    })),
    snapshots: sortedSnapshots.map((s) => ({
      id: s.id,
      value: s.value,
      snapshot_date: s.snapshot_date,
    })),
  };
}

export class InvestmentRepo {
  static async getInvestments(userId: string, db: DrizzleDb): Promise<GetInvestmentsResponse> {
    const accountRows = await InvestmentDAL.findAccountsByUserId(userId, db);
    if (accountRows.length === 0) {
      return {
        isSuccess: true,
        message: "Investments retrieved",
        summary: { total_current_value: 0, total_invested: 0, xirr: null },
        accounts: [],
      };
    }

    const allAssetIds: number[] = [];
    const assetsByAccount = new Map<number, { id: number; name: string; account_id: number; created_at: string; deleted_at: string | null }[]>();

    for (const acc of accountRows) {
      const assets = await InvestmentDAL.findAssetsByAccountId(acc.id, db);
      assetsByAccount.set(acc.id, assets as any);
      for (const a of assets) allAssetIds.push(a.id);
    }

    const [allFlows, allSnapshots] = await Promise.all([
      InvestmentDAL.findCashFlowsByAssetIds(allAssetIds, db),
      InvestmentDAL.findSnapshotsByAssetIds(allAssetIds, db),
    ]);

    const flowsByAsset = new Map<number, typeof allFlows>();
    for (const f of allFlows) {
      if (!flowsByAsset.has(f.asset_id)) flowsByAsset.set(f.asset_id, []);
      flowsByAsset.get(f.asset_id)!.push(f);
    }

    const snapshotsByAsset = new Map<number, typeof allSnapshots>();
    for (const s of allSnapshots) {
      if (!snapshotsByAsset.has(s.asset_id)) snapshotsByAsset.set(s.asset_id, []);
      snapshotsByAsset.get(s.asset_id)!.push(s);
    }

    const accounts: AccountEntry[] = accountRows.map((acc) => {
      const assets = (assetsByAccount.get(acc.id) ?? []) as { id: number; name: string }[];
      const assetEntries = assets.map((a) =>
        buildAssetEntry(a, flowsByAsset.get(a.id) ?? [], snapshotsByAsset.get(a.id) ?? []),
      );

      const accountCurrentValue = assetEntries.reduce((s, a) => s + (a.current_value ?? 0), 0);
      const accountInvested = assetEntries.reduce((s, a) => s + a.invested_amount, 0);

      const allAccFlows = assetEntries.flatMap((a) =>
        a.cash_flows.map((cf) => ({ amount: cf.amount, date: cf.date })),
      );
      const latestSnapDate = assetEntries
        .map((a) => a.last_snapshot_date)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null;

      const accountXirr = latestSnapDate
        ? computeXirr(allAccFlows, accountCurrentValue, latestSnapDate)
        : null;

      return {
        id: acc.id,
        name: acc.name,
        current_value: accountCurrentValue,
        invested_amount: accountInvested,
        xirr: accountXirr,
        assets: assetEntries,
      };
    });

    const totalCurrentValue = accounts.reduce((s, a) => s + a.current_value, 0);
    const totalInvested = accounts.reduce((s, a) => s + a.invested_amount, 0);
    const allPortfolioFlows = accounts.flatMap((a) =>
      a.assets.flatMap((asset) => asset.cash_flows.map((cf) => ({ amount: cf.amount, date: cf.date }))),
    );
    const latestPortfolioDate = accounts
      .flatMap((a) => a.assets.map((asset) => asset.last_snapshot_date))
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    const portfolioXirr = latestPortfolioDate
      ? computeXirr(allPortfolioFlows, totalCurrentValue, latestPortfolioDate)
      : null;

    const summary: PortfolioSummary = {
      total_current_value: totalCurrentValue,
      total_invested: totalInvested,
      xirr: portfolioXirr,
    };

    return { isSuccess: true, message: "Investments retrieved", summary, accounts };
  }

  static async createAccount(userId: string, req: CreateInvestmentAccountRequest, db: DrizzleDb): Promise<CreateInvestmentAccountResponse> {
    const acc = await InvestmentDAL.createAccount({ userId, name: req.name }, db);
    return {
      isSuccess: true,
      message: "Account created",
      account: { id: acc.id, name: acc.name, current_value: 0, invested_amount: 0, xirr: null },
    };
  }

  static async updateAccount(userId: string, id: number, req: UpdateInvestmentAccountRequest, db: DrizzleDb): Promise<UpdateInvestmentAccountResponse> {
    const acc = await InvestmentDAL.updateAccount({ id, userId, name: req.name }, db);
    if (!acc) throw new Error("Account not found");
    return {
      isSuccess: true,
      message: "Account updated",
      account: { id: acc.id, name: acc.name, current_value: 0, invested_amount: 0, xirr: null },
    };
  }

  static async deleteAccount(userId: string, id: number, db: DrizzleDb): Promise<DeleteInvestmentAccountResponse> {
    await InvestmentDAL.softDeleteAccount(id, userId, db);
    return { isSuccess: true, message: "Account deleted" };
  }

  static async createAsset(accountId: number, req: CreateInvestmentAssetRequest, db: DrizzleDb): Promise<CreateInvestmentAssetResponse> {
    const asset = await InvestmentDAL.createAsset({ accountId, name: req.name }, db);
    return {
      isSuccess: true,
      message: "Asset created",
      asset: buildAssetEntry(asset, [], []),
    };
  }

  static async updateAsset(id: number, req: UpdateInvestmentAssetRequest, db: DrizzleDb): Promise<UpdateInvestmentAssetResponse> {
    const asset = await InvestmentDAL.updateAsset({ id, name: req.name }, db);
    if (!asset) throw new Error("Asset not found");
    const [flows, snaps] = await Promise.all([
      InvestmentDAL.findCashFlowsByAssetId(id, db),
      InvestmentDAL.findSnapshotsByAssetId(id, db),
    ]);
    return { isSuccess: true, message: "Asset updated", asset: buildAssetEntry(asset, flows, snaps) };
  }

  static async deleteAsset(id: number, db: DrizzleDb): Promise<DeleteInvestmentAssetResponse> {
    await InvestmentDAL.softDeleteAsset(id, db);
    return { isSuccess: true, message: "Asset deleted" };
  }

  static async addCashFlow(assetId: number, req: AddCashFlowRequest, db: DrizzleDb): Promise<AddCashFlowResponse> {
    const cf = await InvestmentDAL.addCashFlow({
      assetId,
      amount: req.amount,
      date: req.date,
      walletId: req.wallet_id,
      description: req.description,
    }, db);
    const walletName = req.wallet_id
      ? (await InvestmentDAL.findCashFlowsByAssetId(assetId, db)).find((f) => f.id === cf.id)?.wallet_name ?? null
      : null;
    return {
      isSuccess: true,
      message: "Cash flow added",
      cash_flow: { id: cf.id, amount: cf.amount, date: cf.date, wallet_id: cf.wallet_id, wallet_name: walletName, description: cf.description },
    };
  }

  static async deleteCashFlow(id: number, db: DrizzleDb): Promise<DeleteCashFlowResponse> {
    await InvestmentDAL.deleteCashFlow(id, db);
    return { isSuccess: true, message: "Cash flow deleted" };
  }

  static async updateAssetValue(assetId: number, req: UpdateAssetValueRequest, db: DrizzleDb): Promise<UpdateAssetValueResponse> {
    const snap = await InvestmentDAL.addSnapshot({
      assetId,
      value: req.value,
      snapshotDate: req.snapshot_date,
    }, db);
    return {
      isSuccess: true,
      message: "Value updated",
      snapshot: { id: snap.id, value: snap.value, snapshot_date: snap.snapshot_date },
    };
  }
}
