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


function buildAssetEntry(
  asset: { id: number; name: string },
  flows: { id: number; amount: number; date: string; wallet_id: number | null; wallet_name: string | null; description: string | null }[],
  snapshots: { id: number; value: number; snapshot_date: string }[],
): AssetEntry {
  const sortedSnapshots = [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  const latestSnapshot = sortedSnapshots.at(-1) ?? null;
  const investedAmount = flows.reduce((s, f) => s + f.amount, 0);

  return {
    id: asset.id,
    name: asset.name,
    current_value: latestSnapshot?.value ?? null,
    last_snapshot_date: latestSnapshot?.snapshot_date ?? null,
    invested_amount: investedAmount,
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
        summary: { total_current_value: 0, total_invested: 0 },
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

      return {
        id: acc.id,
        name: acc.name,
        current_value: accountCurrentValue,
        invested_amount: accountInvested,
        assets: assetEntries,
      };
    });

    const totalCurrentValue = accounts.reduce((s, a) => s + a.current_value, 0);
    const totalInvested = accounts.reduce((s, a) => s + a.invested_amount, 0);

    const summary: PortfolioSummary = {
      total_current_value: totalCurrentValue,
      total_invested: totalInvested,
    };

    return { isSuccess: true, message: "Investments retrieved", summary, accounts };
  }

  static async createAccount(userId: string, req: CreateInvestmentAccountRequest, db: DrizzleDb): Promise<CreateInvestmentAccountResponse> {
    const acc = await InvestmentDAL.createAccount({ userId, name: req.name }, db);
    return {
      isSuccess: true,
      message: "Account created",
      account: { id: acc.id, name: acc.name, current_value: 0, invested_amount: 0 },
    };
  }

  static async updateAccount(userId: string, id: number, req: UpdateInvestmentAccountRequest, db: DrizzleDb): Promise<UpdateInvestmentAccountResponse> {
    const acc = await InvestmentDAL.updateAccount({ id, userId, name: req.name }, db);
    if (!acc) throw new Error("Account not found");
    return {
      isSuccess: true,
      message: "Account updated",
      account: { id: acc.id, name: acc.name, current_value: 0, invested_amount: 0 },
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
