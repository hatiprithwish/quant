import { useState } from "react";
import { useGetInvestments, useGetWallets } from "@/api/cachedQueries";
import {
  useMutationCreateInvestmentAccount,
  useMutationUpdateInvestmentAccount,
  useMutationDeleteInvestmentAccount,
  useMutationCreateInvestmentAsset,
  useMutationUpdateInvestmentAsset,
  useMutationDeleteInvestmentAsset,
  useMutationAddCashFlow,
  useMutationDeleteCashFlow,
  useMutationUpdateAssetValue,
} from "@/api/mutations";
import type { AccountEntry, AssetEntry } from "@/schemas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function xirrColor(x: number | null) {
  if (x === null) return "text-gray-400 dark:text-neutral-500";
  if (x >= 0) return "text-emerald-500";
  return "text-red-400";
}

function xirrLabel(x: number | null) {
  if (x === null) return "—";
  return (x >= 0 ? "+" : "") + x.toFixed(1) + "%";
}

// ── Graph helpers ─────────────────────────────────────────────────────────────

function buildPortfolioGraphData(accounts: AccountEntry[]) {
  const dateSet = new Set<string>();
  for (const acc of accounts)
    for (const asset of acc.assets)
      for (const snap of asset.snapshots)
        dateSet.add(snap.snapshot_date);

  const dates = Array.from(dateSet).sort();
  return dates.map((date) => {
    let value = 0;
    let invested = 0;
    for (const acc of accounts) {
      for (const asset of acc.assets) {
        const snapsOnOrBefore = asset.snapshots.filter((s) => s.snapshot_date <= date);
        if (snapsOnOrBefore.length > 0) {
          const latest = snapsOnOrBefore.sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)).at(-1)!;
          value += latest.value;
        }
        invested += asset.cash_flows.filter((cf) => cf.date <= date).reduce((s, cf) => s + cf.amount, 0);
      }
    }
    return { date, value: Math.round(value), invested: Math.round(invested) };
  });
}

function buildAccountGraphData(account: AccountEntry) {
  const dateSet = new Set<string>();
  for (const asset of account.assets)
    for (const snap of asset.snapshots)
      dateSet.add(snap.snapshot_date);

  const dates = Array.from(dateSet).sort();
  return dates.map((date) => {
    let value = 0;
    let invested = 0;
    for (const asset of account.assets) {
      const snapsOnOrBefore = asset.snapshots.filter((s) => s.snapshot_date <= date);
      if (snapsOnOrBefore.length > 0) {
        const latest = snapsOnOrBefore.sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)).at(-1)!;
        value += latest.value;
      }
      invested += asset.cash_flows.filter((cf) => cf.date <= date).reduce((s, cf) => s + cf.amount, 0);
    }
    return { date, value: Math.round(value), invested: Math.round(invested) };
  });
}

// ── Small components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-neutral-800/60 rounded-xl px-4 py-3">
      <div className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniGraph({ data }: { data: { date: string; value: number; invested: number }[] }) {
  if (data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          formatter={(v) => fmt(Number(v))}
          labelFormatter={(l) => l}
          contentStyle={{
            background: "var(--tooltip-bg, #1f2937)",
            border: "none",
            borderRadius: 8,
            fontSize: 11,
            color: "#e5e7eb",
          }}
        />
        <Line type="monotone" dataKey="value" stroke="#10b981" dot={false} strokeWidth={2} name="Value" />
        <Line type="monotone" dataKey="invested" stroke="#6b7280" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Invested" />
        <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Modal: Create/Rename Account ──────────────────────────────────────────────

function AccountModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          {initial ? "Rename Account" : "New Account"}
        </h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. U.S. Stocks"
          className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white">Cancel</button>
          <button
            onClick={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
            className="px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Create/Rename Asset ────────────────────────────────────────────────

function AssetModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          {initial ? "Rename Asset" : "New Asset"}
        </h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Apple (AAPL)"
          className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white">Cancel</button>
          <button
            onClick={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
            className="px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Add Cash Flow ──────────────────────────────────────────────────────

function AddCashFlowModal({
  assetId,
  wallets,
  onClose,
}: {
  assetId: number;
  wallets: { id: number; name: string }[];
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [walletId, setWalletId] = useState<string>("");
  const [description, setDescription] = useState("");
  const addFlow = useMutationAddCashFlow();

  function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addFlow.mutate({
      assetId,
      amount: amt,
      date,
      wallet_id: walletId ? parseInt(walletId) : undefined,
      description: description || undefined,
    }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Add Investment</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">Amount (₹)</label>
            <input
              type="number"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">From Wallet (optional)</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="">Direct (no wallet)</option>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. SIP Jan 2025"
              className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white">Cancel</button>
          <button
            onClick={submit}
            disabled={addFlow.isPending}
            className="px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {addFlow.isPending ? "Saving…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Edit Current Value ─────────────────────────────────────────────────

function EditValueModal({
  assetId,
  currentValue,
  onClose,
}: {
  assetId: number;
  currentValue: number | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentValue?.toString() ?? "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const updateValue = useMutationUpdateAssetValue();

  function submit() {
    const v = parseFloat(value);
    if (isNaN(v) || v < 0) return;
    updateValue.mutate({ assetId, value: v, snapshot_date: date }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Update Current Value</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">Current Value (₹)</label>
            <input
              type="number"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">As of Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400">Cancel</button>
          <button
            onClick={submit}
            disabled={updateValue.isPending}
            className="px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {updateValue.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Asset Detail View ─────────────────────────────────────────────────────────

function AssetDetail({
  asset,
  wallets,
  onBack,
}: {
  asset: AssetEntry;
  wallets: { id: number; name: string }[];
  onBack: () => void;
}) {
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [showEditValue, setShowEditValue] = useState(false);
  const [showEditAsset, setShowEditAsset] = useState(false);
  const deleteFlow = useMutationDeleteCashFlow();
  const updateAsset = useMutationUpdateInvestmentAsset();

  const sortedFlows = [...asset.cash_flows].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-white text-sm">← Back</button>
        <span className="text-gray-300 dark:text-neutral-600">/</span>
        <button onClick={() => setShowEditAsset(true)} className="text-sm font-semibold text-gray-900 dark:text-white hover:underline">
          {asset.name}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard
          label="Current Value"
          value={asset.current_value !== null ? fmt(asset.current_value) : "—"}
          sub={asset.last_snapshot_date ? `as of ${asset.last_snapshot_date}` : undefined}
        />
        <StatCard label="Invested" value={fmt(asset.invested_amount)} />
        <div className="bg-gray-50 dark:bg-neutral-800/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase mb-1">
            XIRR
            <span title="XIRR is computed as of the last time current value was updated" className="cursor-help text-gray-300 dark:text-neutral-600">ⓘ</span>
          </div>
          <div className={`text-lg font-bold ${xirrColor(asset.xirr)}`}>{xirrLabel(asset.xirr)}</div>
        </div>
      </div>

      <button
        onClick={() => setShowEditValue(true)}
        className="mb-5 px-4 py-2 text-sm bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors font-medium"
      >
        ✏️ Edit Current Value
      </button>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cash Flows</h3>
        <button
          onClick={() => setShowAddFlow(true)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        >
          + Add Investment
        </button>
      </div>

      {sortedFlows.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-neutral-500">No investments yet.</p>
      ) : (
        <div className="space-y-2">
          {sortedFlows.map((cf) => (
            <div key={cf.id} className="flex items-center justify-between bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {fmt(cf.amount)}
                </div>
                <div className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">
                  {cf.date} · {cf.wallet_name ?? "Direct"}
                  {cf.description ? ` · ${cf.description}` : ""}
                </div>
              </div>
              <button
                onClick={() => deleteFlow.mutate(cf.id)}
                className="text-gray-300 dark:text-neutral-600 hover:text-red-400 dark:hover:text-red-400 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddFlow && <AddCashFlowModal assetId={asset.id} wallets={wallets} onClose={() => setShowAddFlow(false)} />}
      {showEditValue && <EditValueModal assetId={asset.id} currentValue={asset.current_value} onClose={() => setShowEditValue(false)} />}
      {showEditAsset && (
        <AssetModal
          initial={asset.name}
          onSave={(name) => updateAsset.mutate({ id: asset.id, name })}
          onClose={() => setShowEditAsset(false)}
        />
      )}
    </div>
  );
}

// ── Account Detail View ───────────────────────────────────────────────────────

function AccountDetail({
  account,
  wallets,
  onBack,
}: {
  account: AccountEntry;
  wallets: { id: number; name: string }[];
  onBack: () => void;
}) {
  const [selectedAsset, setSelectedAsset] = useState<AssetEntry | null>(null);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const createAsset = useMutationCreateInvestmentAsset();
  const updateAccount = useMutationUpdateInvestmentAccount();
  const deleteAsset = useMutationDeleteInvestmentAsset();

  const graphData = buildAccountGraphData(account);

  // If looking at an asset, delegate
  const liveAsset = selectedAsset
    ? account.assets.find((a) => a.id === selectedAsset.id) ?? selectedAsset
    : null;

  if (liveAsset) {
    return (
      <AssetDetail
        asset={liveAsset}
        wallets={wallets}
        onBack={() => setSelectedAsset(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-white text-sm">← Back</button>
        <span className="text-gray-300 dark:text-neutral-600">/</span>
        <button onClick={() => setShowEditAccount(true)} className="text-sm font-semibold text-gray-900 dark:text-white hover:underline">
          {account.name}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Value" value={fmt(account.current_value)} />
        <StatCard label="Invested" value={fmt(account.invested_amount)} />
        <div className="bg-gray-50 dark:bg-neutral-800/60 rounded-xl px-4 py-3">
          <div className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase mb-1">XIRR</div>
          <div className={`text-lg font-bold ${xirrColor(account.xirr)}`}>{xirrLabel(account.xirr)}</div>
        </div>
      </div>

      {graphData.length >= 2 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 p-4 mb-5">
          <MiniGraph data={graphData} />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assets</h3>
        <button
          onClick={() => setShowAddAsset(true)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        >
          + Add Asset
        </button>
      </div>

      {account.assets.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-neutral-500">No assets yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {account.assets.map((asset) => (
            <div
              key={asset.id}
              className="group flex items-center justify-between bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 px-4 py-3 cursor-pointer hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
              onClick={() => setSelectedAsset(asset)}
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</div>
                <div className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">
                  {asset.current_value !== null ? fmt(asset.current_value) : "No value"} · Invested {fmt(asset.invested_amount)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${xirrColor(asset.xirr)}`}>{xirrLabel(asset.xirr)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAsset.mutate(asset.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-neutral-600 hover:text-red-400 text-xs transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddAsset && (
        <AssetModal
          onSave={(name) => createAsset.mutate({ accountId: account.id, name })}
          onClose={() => setShowAddAsset(false)}
        />
      )}
      {showEditAccount && (
        <AccountModal
          initial={account.name}
          onSave={(name) => updateAccount.mutate({ id: account.id, name })}
          onClose={() => setShowEditAccount(false)}
        />
      )}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

export default function InvestmentsTab() {
  const { data, isLoading } = useGetInvestments();
  const { data: walletsData } = useGetWallets();
  const [selectedAccount, setSelectedAccount] = useState<AccountEntry | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const createAccount = useMutationCreateInvestmentAccount();
  const deleteAccount = useMutationDeleteInvestmentAccount();

  const wallets = walletsData?.wallets ?? [];

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-sm">Loading…</div>;
  }

  const summary = data?.summary ?? { total_current_value: 0, total_invested: 0, xirr: null };
  const accounts = data?.accounts ?? [];

  // If drilling into account, show account detail
  const liveAccount = selectedAccount
    ? accounts.find((a) => a.id === selectedAccount.id) ?? selectedAccount
    : null;

  if (liveAccount) {
    return (
      <AccountDetail
        account={liveAccount}
        wallets={wallets}
        onBack={() => setSelectedAccount(null)}
      />
    );
  }

  const portfolioData = buildPortfolioGraphData(accounts);

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5">
        <div className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase mb-3">Portfolio</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{fmt(summary.total_current_value)}</div>
        <div className="flex gap-4 text-xs text-gray-500 dark:text-neutral-400 mb-4">
          <span>Invested {fmt(summary.total_invested)}</span>
          <span className={xirrColor(summary.xirr)}>XIRR {xirrLabel(summary.xirr)}</span>
        </div>
        {portfolioData.length >= 2 && <MiniGraph data={portfolioData} />}
      </div>

      {/* Account list */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accounts</h3>
        <button
          onClick={() => setShowAddAccount(true)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        >
          + Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-neutral-500">No accounts yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="group flex items-center justify-between bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 px-5 py-4 cursor-pointer hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
              onClick={() => setSelectedAccount(account)}
            >
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{account.name}</div>
                <div className="text-xs text-gray-400 dark:text-neutral-500">
                  {fmt(account.current_value)} · Invested {fmt(account.invested_amount)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${xirrColor(account.xirr)}`}>{xirrLabel(account.xirr)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAccount.mutate(account.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-neutral-600 hover:text-red-400 text-xs transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddAccount && (
        <AccountModal
          onSave={(name) => createAccount.mutate({ name })}
          onClose={() => setShowAddAccount(false)}
        />
      )}
    </div>
  );
}
