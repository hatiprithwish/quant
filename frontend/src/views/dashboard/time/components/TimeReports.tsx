import { useState, useMemo, useRef, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useGetTime, useGetTimeBuckets } from "@/api/cachedQueries";
import Spinner from "@/components/common/Spinner";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";

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
function startOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().split("T")[0];
}
function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

const PRESETS = [
  { label: "7D",     from: () => daysAgo(6),     to: () => today() },
  { label: "30D",    from: () => daysAgo(29),    to: () => today() },
  { label: "MONTH",  from: () => startOfMonth(),  to: () => today() },
  { label: "YEAR",   from: () => startOfYear(),   to: () => today() },
];

// ── Date range dropdown ───────────────────────────────────────────────────────

function DateRangeDropdown({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (f: string, t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [lf, setLf] = useState(from);
  const [lt, setLt] = useState(to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setLf(from); }, [from]);
  useEffect(() => { setLt(to); }, [to]);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const label =
    from === to
      ? from.slice(5).replace("-", "/")
      : `${from.slice(5).replace("-", "/")} – ${to.slice(5).replace("-", "/")}`;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          background: "rgba(6,182,212,0.07)",
          border: "1px solid rgba(6,182,212,0.22)",
          borderRadius: 4,
          fontFamily: G,
          fontSize: 10,
          letterSpacing: "0.08em",
          color: A,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ opacity: 0.55 }}>◷</span>
        {label}
        <span style={{ opacity: 0.4, fontSize: 8 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 6px)",
            zIndex: 50,
            background: "#020c10",
            border: "1px solid rgba(6,182,212,0.18)",
            borderRadius: 6,
            padding: 12,
            minWidth: "15rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            fontFamily: G,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {PRESETS.map((p) => {
              const pf = p.from();
              const pt = p.to();
              const active = from === pf && to === pt;
              return (
                <button
                  key={p.label}
                  onClick={() => { onChange(pf, pt); setOpen(false); }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 3,
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    border: "1px solid",
                    background: active ? A : "transparent",
                    borderColor: active ? A : "rgba(6,182,212,0.2)",
                    color: active ? "#000" : "rgba(6,182,212,0.6)",
                    transition: "all 0.15s",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="date"
              value={lf}
              max={lt}
              onChange={(e) => {
                setLf(e.target.value);
                if (e.target.value && lt && e.target.value <= lt) onChange(e.target.value, lt);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 9,
                border: "1px solid rgba(6,182,212,0.2)",
                borderRadius: 3,
                padding: "4px 6px",
                background: "#020c10",
                color: A,
                fontFamily: "inherit",
                outline: "none",
                colorScheme: "dark",
              } as React.CSSProperties}
            />
            <span style={{ color: "rgba(6,182,212,0.3)", fontSize: 10 }}>→</span>
            <input
              type="date"
              value={lt}
              min={lf}
              max={today()}
              onChange={(e) => {
                setLt(e.target.value);
                if (e.target.value && lf && lf <= e.target.value) onChange(lf, e.target.value);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 9,
                border: "1px solid rgba(6,182,212,0.2)",
                borderRadius: 3,
                padding: "4px 6px",
                background: "#020c10",
                color: A,
                fontFamily: "inherit",
                outline: "none",
                colorScheme: "dark",
              } as React.CSSProperties}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom pie label ──────────────────────────────────────────────────────────

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number;
  percent: number;
}) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontFamily: G, fontSize: 9, fontWeight: 700 }}>
      {Math.round(percent * 100)}%
    </text>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TimeReports() {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const [selectedBuckets, setSelectedBuckets] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useGetTime(from, to);
  const { data: bucketsData } = useGetTimeBuckets();

  const activeBuckets = bucketsData?.buckets.filter((b) => !b.is_archived) ?? [];

  function toggleBucket(id: number) {
    setSelectedBuckets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const filteredActivities = useMemo(() => {
    if (!data) return [];
    return data.days
      .flatMap((d) =>
        d.buckets.flatMap((b) =>
          b.activities.map((a) => ({ ...a, dayDate: d.date })),
        ),
      )
      .filter((a) => {
        if (selectedBuckets.length > 0 && !selectedBuckets.includes(a.bucket_id)) return false;
        if (search && !a.activity.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.start_time.localeCompare(a.start_time));
  }, [data, selectedBuckets, search]);

  const pieData = useMemo(() => {
    if (!data) return [];
    const bucketMap: Record<number, { name: string; color: string; mins: number }> = {};
    filteredActivities.forEach((a) => {
      if (!bucketMap[a.bucket_id]) {
        bucketMap[a.bucket_id] = { name: a.bucket_name, color: a.bucket_color, mins: 0 };
      }
      bucketMap[a.bucket_id].mins += a.duration_minutes;
    });
    return Object.values(bucketMap).sort((a, b) => b.mins - a.mins);
  }, [filteredActivities, data]);

  const barData = useMemo((): { rows: Record<string, string | number>[]; bucketNames: string[]; bucketColorMap: Record<string, string> } => {
    const bucketNames = [...new Set(filteredActivities.map((a) => a.bucket_name))];
    const bucketColorMap: Record<string, string> = {};
    filteredActivities.forEach((a) => { bucketColorMap[a.bucket_name] = a.bucket_color; });

    const dayMap: Record<string, Record<string, number>> = {};
    filteredActivities.forEach((a) => {
      const date = a.start_time.slice(0, 10);
      if (!dayMap[date]) dayMap[date] = {};
      dayMap[date][a.bucket_name] = (dayMap[date][a.bucket_name] ?? 0) + a.duration_minutes / 60;
    });

    return {
      rows: Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, buckets]) => ({ date: fmtDate(date), ...buckets })),
      bucketNames,
      bucketColorMap,
    };
  }, [filteredActivities]);

  const totalFiltered = filteredActivities.reduce((s, a) => s + a.duration_minutes, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          padding: "12px 16px",
          background: "rgba(6,182,212,0.04)",
          border: "1px solid rgba(6,182,212,0.12)",
          borderRadius: 8,
        }}
      >
        <DateRangeDropdown from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />

        {/* Bucket filter chips */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
          {activeBuckets.map((b) => {
            const active = selectedBuckets.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => toggleBucket(b.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px",
                  borderRadius: 20,
                  border: `1px solid ${active ? b.color : "rgba(255,255,255,0.1)"}`,
                  background: active ? `${b.color}18` : "transparent",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: b.color,
                    opacity: active ? 1 : 0.4,
                  }}
                />
                <span
                  style={{
                    fontFamily: G,
                    fontSize: 8,
                    letterSpacing: "0.08em",
                    color: active ? b.color : "rgba(255,255,255,0.3)",
                  }}
                >
                  {b.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(6,182,212,0.35)",
              fontSize: 10,
              pointerEvents: "none",
            }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description…"
            style={{
              background: "rgba(6,182,212,0.04)",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: 4,
              padding: "5px 10px 5px 24px",
              fontFamily: G,
              fontSize: 10,
              color: "#fff",
              outline: "none",
              width: 180,
            } as React.CSSProperties}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = A; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(6,182,212,0.15)"; }}
          />
        </div>
      </div>

      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 0", gap: 12 }}>
          <Spinner />
          <div style={{ fontFamily: G, fontSize: 9, letterSpacing: "0.2em", color: "rgba(6,182,212,0.4)" }}>LOADING…</div>
        </div>
      )}

      {error && (
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.07)",
            borderRadius: 6,
            padding: "12px 16px",
            fontFamily: G,
            fontSize: 10,
            color: "rgba(239,68,68,0.8)",
          }}
        >
          ✕ FAILED TO LOAD DATA
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {[
              { label: "TOTAL TIME", value: fmtMins(totalFiltered) },
              { label: "SESSIONS", value: String(filteredActivities.length) },
              { label: "BUCKETS", value: String(pieData.length) },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(6,182,212,0.04)",
                  border: "1px solid rgba(6,182,212,0.1)",
                  borderRadius: 6,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.4)", marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: G, fontSize: 20, fontWeight: 700, color: A, textShadow: "0 0 14px rgba(6,182,212,0.3)" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {pieData.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Pie chart */}
              <div
                style={{
                  background: "rgba(6,182,212,0.03)",
                  border: "1px solid rgba(6,182,212,0.1)",
                  borderRadius: 8,
                  padding: "16px",
                }}
              >
                <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.18em", fontWeight: 700, color: "rgba(6,182,212,0.5)", marginBottom: 14 }}>
                  TIME BY BUCKET
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="mins"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) =>
                      PieLabel({ cx: cx ?? 0, cy: cy ?? 0, midAngle: midAngle ?? 0, innerRadius: innerRadius ?? 0, outerRadius: outerRadius ?? 0, percent: percent ?? 0 })
                    }
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#020c10",
                        border: "1px solid rgba(6,182,212,0.2)",
                        borderRadius: 6,
                        fontFamily: G,
                        fontSize: 11,
                        color: "#fff",
                      }}
                      formatter={(v) => [`${fmtMins(Number(v))}`, ""]}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ fontFamily: G, fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div
                style={{
                  background: "rgba(6,182,212,0.03)",
                  border: "1px solid rgba(6,182,212,0.1)",
                  borderRadius: 8,
                  padding: "16px",
                }}
              >
                <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.18em", fontWeight: 700, color: "rgba(6,182,212,0.5)", marginBottom: 14 }}>
                  DAILY HOURS BY BUCKET
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData.rows} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontFamily: G, fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontFamily: G, fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                      unit="h"
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#020c10",
                        border: "1px solid rgba(6,182,212,0.2)",
                        borderRadius: 6,
                        fontFamily: G,
                        fontSize: 11,
                        color: "#fff",
                      }}
                      formatter={(v) => [`${Number(v ?? 0).toFixed(1)}h`, ""]}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ fontFamily: G, fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{value}</span>
                      )}
                    />
                    {barData.bucketNames.map((name) => (
                      <Bar
                        key={name}
                        dataKey={name}
                        stackId="a"
                        fill={barData.bucketColorMap[name]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Activity table */}
          <div
            style={{
              border: "1px solid rgba(6,182,212,0.1)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(6,182,212,0.08)",
                background: "rgba(6,182,212,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.18em", fontWeight: 700, color: "rgba(6,182,212,0.55)" }}>
                ENTRIES
              </div>
              <div style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.3)" }}>
                {filteredActivities.length} result{filteredActivities.length !== 1 ? "s" : ""}
              </div>
            </div>

            {filteredActivities.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", fontFamily: G, fontSize: 9, color: "rgba(6,182,212,0.3)" }}>
                NO MATCHING ENTRIES
              </div>
            ) : (
              filteredActivities.slice(0, 100).map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    borderTop: "1px solid rgba(6,182,212,0.05)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(6,182,212,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.3)", width: 40, flexShrink: 0 }}>
                    {a.start_time.slice(5, 10).replace("-", "/")}
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.bucket_color, flexShrink: 0 }} />
                  <div style={{ fontFamily: G, fontSize: 8, color: a.bucket_color, opacity: 0.75, width: 72, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.bucket_name}
                  </div>
                  <div style={{ flex: 1, fontFamily: G, fontSize: 10, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.activity}
                  </div>
                  <div style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.35)", flexShrink: 0 }}>
                    {a.start_time.slice(11, 16)} – {a.end_time.slice(11, 16)}
                  </div>
                  <div style={{ fontFamily: G, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", width: 42, textAlign: "right", flexShrink: 0 }}>
                    {fmtMins(a.duration_minutes)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
