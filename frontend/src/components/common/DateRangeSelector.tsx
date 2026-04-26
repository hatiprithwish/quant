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

const PRESETS = {
  today: [{ label: "Today", from: today(), to: today() }],
  food: [
    { label: "Today", from: today(), to: today() },
    { label: "7 days", from: daysAgo(6), to: today() },
    { label: "30 days", from: daysAgo(29), to: today() },
  ],
  expenses: [
    { label: "Today", from: today(), to: today() },
    { label: "7 days", from: daysAgo(6), to: today() },
    { label: "Month", from: startOfMonth(), to: today() },
    { label: "Quarter", from: startOfQuarter(), to: today() },
    { label: "Year", from: startOfYear(), to: today() },
  ],
  time: [
    { label: "Today", from: today(), to: today() },
    { label: "7 days", from: daysAgo(6), to: today() },
    { label: "Month", from: startOfMonth(), to: today() },
    { label: "Year", from: startOfYear(), to: today() },
  ],
};

export type PresetGroup = keyof typeof PRESETS;

interface Props {
  group: PresetGroup;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangeSelector({ group, from, to, onChange }: Props) {
  const presets: Preset[] = PRESETS[group];

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
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
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
          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-300"
        />
        <span className="text-gray-400 text-xs">→</span>
        <input
          type="date"
          value={to}
          min={from}
          max={today()}
          onChange={(e) => onChange(from, e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-300"
        />
      </div>
    </div>
  );
}
