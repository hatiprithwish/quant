interface Preset {
  label: string;
  from: string;
  to: string;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function startOfQuarter() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3);
  d.setMonth(q * 3, 1);
  return d.toISOString().split("T")[0];
}

function startOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().split("T")[0];
}

type PresetGroupKey = "today" | "food" | "expenses" | "time" | "body";

function getPresets(group: PresetGroupKey): Preset[] {
  const t = today();
  switch (group) {
    case "today":
      return [{ label: "Today", from: t, to: t }];
    case "food":
      return [
        { label: "Today", from: t, to: t },
        { label: "7 days", from: daysAgo(6), to: t },
        { label: "30 days", from: daysAgo(29), to: t },
      ];
    case "expenses":
      return [
        { label: "Today", from: t, to: t },
        { label: "7 days", from: daysAgo(6), to: t },
        { label: "Month", from: startOfMonth(), to: t },
        { label: "Quarter", from: startOfQuarter(), to: t },
        { label: "Year", from: startOfYear(), to: t },
      ];
    case "time":
      return [
        { label: "Today", from: t, to: t },
        { label: "7 days", from: daysAgo(6), to: t },
        { label: "Month", from: startOfMonth(), to: t },
        { label: "Year", from: startOfYear(), to: t },
      ];
    case "body":
      return [
        { label: "30 days", from: daysAgo(29), to: t },
        { label: "90 days", from: daysAgo(89), to: t },
        { label: "6 months", from: daysAgo(179), to: t },
        { label: "Year", from: startOfYear(), to: t },
      ];
  }
}

export type PresetGroup = PresetGroupKey;

interface Props {
  group: PresetGroup;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangeSelector({ group, from, to, onChange }: Props) {
  const presets: Preset[] = getPresets(group);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((p) => {
        const active = p.from === from && p.to === to;
        return (
          <button
            key={p.label}
            onClick={() => onChange(p.from, p.to)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            {p.label}
          </button>
        );
      })}
      <div className="flex items-center gap-1 ml-2">
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onChange(e.target.value, to)}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700"
        />
        <span className="text-gray-400 dark:text-gray-500 text-xs">→</span>
        <input
          type="date"
          value={to}
          min={from}
          max={today()}
          onChange={(e) => onChange(from, e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700"
        />
      </div>
    </div>
  );
}
