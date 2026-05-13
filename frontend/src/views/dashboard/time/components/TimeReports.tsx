import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import DateRangeDropdown, { getPresetRange } from "@/components/common/DateRangeDropdown";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";

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

// ── Pie legend ────────────────────────────────────────────────────────────────

function PieLegend({
  data,
}: {
  data: { name: string; color: string; mins: number }[];
}) {
  const total = data.reduce((s, d) => s + d.mins, 0);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        marginTop: 10,
      }}
    >
      {data.map((d) => (
        <div
          key={d.name}
          style={{ display: "flex", alignItems: "center", gap: 7 }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: d.color,
              flexShrink: 0,
            }}
          />
          <div
            style={{
              flex: 1,
              fontFamily: G,
              fontSize: 9,
              color: "rgba(255,255,255,0.65)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {d.name}
          </div>
          <div
            style={{
              fontFamily: G,
              fontSize: 8,
              color: "rgba(255,255,255,0.35)",
              flexShrink: 0,
            }}
          >
            {fmtMins(d.mins)}
          </div>
          <div
            style={{
              fontFamily: G,
              fontSize: 8,
              color: "rgba(255,255,255,0.25)",
              width: 30,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {total > 0 ? Math.round((d.mins / total) * 100) : 0}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Entries grouped by bucket ─────────────────────────────────────────────────

type EntryItem = {
  id: number;
  bucket_id: number;
  bucket_name: string;
  bucket_color: string;
  activity: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
};

interface BucketGroup {
  bucket_id: number;
  bucket_name: string;
  bucket_color: string;
  total_mins: number;
  activities: EntryItem[];
}

function EntriesByBucket({ activities }: { activities: EntryItem[] }) {
  const groups = useMemo((): BucketGroup[] => {
    const map = new Map<number, BucketGroup>();
    for (const a of activities) {
      const dur = Math.max(0, a.duration_minutes);
      if (!map.has(a.bucket_id)) {
        map.set(a.bucket_id, {
          bucket_id: a.bucket_id,
          bucket_name: a.bucket_name,
          bucket_color: a.bucket_color,
          total_mins: 0,
          activities: [],
        });
      }
      const g = map.get(a.bucket_id)!;
      g.total_mins += dur;
      g.activities.push(a);
    }
    return Array.from(map.values()).sort((a, b) => b.total_mins - a.total_mins);
  }, [activities]);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const totalCount = activities.length;

  return (
    <div
      style={{
        border: "1px solid rgba(6,182,212,0.1)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Table header */}
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
        <div
          style={{
            fontFamily: G,
            fontSize: 8,
            letterSpacing: "0.18em",
            fontWeight: 700,
            color: "rgba(6,182,212,0.55)",
          }}
        >
          ENTRIES
        </div>
        <div
          style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.3)" }}
        >
          {totalCount} result{totalCount !== 1 ? "s" : ""}
        </div>
      </div>

      {groups.length === 0 ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            fontFamily: G,
            fontSize: 9,
            color: "rgba(6,182,212,0.3)",
          }}
        >
          NO MATCHING ENTRIES
        </div>
      ) : (
        groups.map((g) => {
          const open = expanded.has(g.bucket_id);
          return (
            <div
              key={g.bucket_id}
              style={{ borderTop: "1px solid rgba(6,182,212,0.07)" }}
            >
              {/* Bucket header row */}
              <button
                onClick={() => toggle(g.bucket_id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  background: "rgba(6,182,212,0.04)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(6,182,212,0.07)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(6,182,212,0.04)";
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: g.bucket_color,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    fontFamily: G,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: g.bucket_color,
                  }}
                >
                  {g.bucket_name}
                </div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 8,
                    color: "rgba(255,255,255,0.3)",
                    marginRight: 6,
                  }}
                >
                  {g.activities.length} session
                  {g.activities.length !== 1 ? "s" : ""}
                </div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    width: 52,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {fmtMins(g.total_mins)}
                </div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 9,
                    color: "rgba(6,182,212,0.4)",
                    width: 14,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {open ? "▾" : "▸"}
                </div>
              </button>

              {/* Activity rows */}
              {open &&
                g.activities.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 16px 7px 32px",
                      borderTop: "1px solid rgba(6,182,212,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(6,182,212,0.025)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "transparent";
                    }}
                  >
                    <div
                      style={{
                        fontFamily: G,
                        fontSize: 8,
                        color: "rgba(6,182,212,0.3)",
                        width: 40,
                        flexShrink: 0,
                      }}
                    >
                      {a.started_at.slice(5, 10).replace("-", "/")}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontFamily: G,
                        fontSize: 10,
                        color: "rgba(255,255,255,0.7)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.activity}
                    </div>
                    <div
                      style={{
                        fontFamily: G,
                        fontSize: 8,
                        color: "rgba(6,182,212,0.35)",
                        flexShrink: 0,
                      }}
                    >
                      {a.started_at.slice(11, 16)} – {a.ended_at.slice(11, 16)}
                    </div>
                    <div
                      style={{
                        fontFamily: G,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.35)",
                        width: 42,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {fmtMins(Math.max(0, a.duration_minutes))}
                    </div>
                  </div>
                ))}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── BucketFilterDropdown ──────────────────────────────────────────────────────

interface BucketOption { id: number; name: string; color: string }

function BucketFilterDropdown({
  buckets,
  selected,
  onToggle,
  onClear,
}: {
  buckets: BucketOption[];
  selected: number[];
  onToggle: (id: number) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const label =
    selected.length === 0
      ? "All buckets"
      : selected.length === 1
        ? buckets.find((b) => b.id === selected[0])?.name ?? "1 bucket"
        : `${selected.length} buckets`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          borderRadius: 4,
          border: "1px solid rgba(6,182,212,0.22)",
          background: "rgba(6,182,212,0.07)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          fontFamily: G,
          fontSize: 10,
          letterSpacing: "0.08em",
          color: A,
        }}
      >
        {selected.length > 0 && (
          <div style={{ display: "flex", gap: 3 }}>
            {selected.slice(0, 3).map((id) => {
              const b = buckets.find((x) => x.id === id);
              return b ? (
                <div key={id} style={{ width: 6, height: 6, borderRadius: "50%", background: b.color }} />
              ) : null;
            })}
          </div>
        )}
        {label}
        <span style={{ opacity: 0.4, fontSize: 8 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 100,
            background: "#0a1015",
            border: "1px solid rgba(6,182,212,0.18)",
            borderRadius: 4,
            minWidth: 180,
            maxHeight: 280,
            overflowY: "auto",
            padding: "4px 0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
        >
          {selected.length > 0 && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              style={{
                width: "100%",
                padding: "6px 12px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(6,182,212,0.08)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: G,
                fontSize: 8,
                letterSpacing: "0.18em",
                color: "rgba(6,182,212,0.5)",
              }}
            >
              CLEAR ALL
            </button>
          )}
          {buckets.map((b) => {
            const active = selected.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => onToggle(b.id)}
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  background: active ? "rgba(6,182,212,0.07)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: b.color, opacity: active ? 1 : 0.35, flexShrink: 0 }} />
                <span style={{ fontFamily: G, fontSize: 9, letterSpacing: "0.08em", color: active ? A : "rgba(6,182,212,0.45)", flex: 1, textAlign: "left" }}>
                  {b.name}
                </span>
                {active && (
                  <span style={{ fontSize: 9, color: A, opacity: 0.7 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TimeReports() {
  const [from, setFrom] = useState(() => getPresetRange("thisWeek").from);
  const [to, setTo] = useState(() => getPresetRange("thisWeek").to);
  const [selectedBuckets, setSelectedBuckets] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useGetTime(from, to);
  const { data: bucketsData } = useGetTimeBuckets();

  const activeBuckets =
    bucketsData?.buckets.filter((b) => !b.is_archived) ?? [];

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
        if (
          selectedBuckets.length > 0 &&
          !selectedBuckets.includes(a.bucket_id)
        )
          return false;
        if (search && !a.activity.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      })
      .sort((a, b) => b.started_at.localeCompare(a.started_at));
  }, [data, selectedBuckets, search]);

  const pieData = useMemo(() => {
    if (!data) return [];
    const bucketMap: Record<
      number,
      { name: string; color: string; mins: number }
    > = {};
    filteredActivities.forEach((a) => {
      const dur = Math.max(0, a.duration_minutes);
      if (!bucketMap[a.bucket_id]) {
        bucketMap[a.bucket_id] = {
          name: a.bucket_name,
          color: a.bucket_color,
          mins: 0,
        };
      }
      bucketMap[a.bucket_id].mins += dur;
    });
    return Object.values(bucketMap)
      .filter((b) => b.mins > 0)
      .sort((a, b) => b.mins - a.mins);
  }, [filteredActivities, data]);

  const barData = useMemo((): {
    rows: Record<string, string | number>[];
    bucketNames: string[];
    bucketColorMap: Record<string, string>;
  } => {
    const bucketNames = [
      ...new Set(filteredActivities.map((a) => a.bucket_name)),
    ];
    const bucketColorMap: Record<string, string> = {};
    filteredActivities.forEach((a) => {
      bucketColorMap[a.bucket_name] = a.bucket_color;
    });

    const dayMap: Record<string, Record<string, number>> = {};
    filteredActivities.forEach((a) => {
      const date = a.started_at.slice(0, 10);
      if (!dayMap[date]) dayMap[date] = {};
      dayMap[date][a.bucket_name] =
        (dayMap[date][a.bucket_name] ?? 0) +
        Math.max(0, a.duration_minutes) / 60;
    });

    return {
      rows: Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, buckets]) => ({ date: fmtDate(date), ...buckets })),
      bucketNames,
      bucketColorMap,
    };
  }, [filteredActivities]);

  const totalFiltered = filteredActivities.reduce(
    (s, a) => s + Math.max(0, a.duration_minutes),
    0,
  );

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
        <DateRangeDropdown
          accent={A}
          panelBg="#020c10"
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />

        {/* Bucket filter dropdown */}
        <BucketFilterDropdown
          buckets={activeBuckets}
          selected={selectedBuckets}
          onToggle={toggleBucket}
          onClear={() => setSelectedBuckets([])}
        />

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
            style={
              {
                background: "rgba(6,182,212,0.04)",
                border: "1px solid rgba(6,182,212,0.15)",
                borderRadius: 4,
                padding: "5px 10px 5px 24px",
                fontFamily: G,
                fontSize: 10,
                color: "#fff",
                outline: "none",
                width: 180,
              } as React.CSSProperties
            }
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = A;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "rgba(6,182,212,0.15)";
            }}
          />
        </div>
      </div>

      {isLoading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "64px 0",
            gap: 12,
          }}
        >
          <Spinner />
          <div
            style={{
              fontFamily: G,
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "rgba(6,182,212,0.4)",
            }}
          >
            LOADING…
          </div>
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
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 8,
                    letterSpacing: "0.15em",
                    color: "rgba(6,182,212,0.4)",
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 20,
                    fontWeight: 700,
                    color: A,
                    textShadow: "0 0 14px rgba(6,182,212,0.3)",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Row 1: bar chart full width */}
          {pieData.length > 0 && (
            <div
              style={{
                background: "rgba(6,182,212,0.03)",
                border: "1px solid rgba(6,182,212,0.1)",
                borderRadius: 8,
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: G,
                  fontSize: 8,
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                  color: "rgba(6,182,212,0.5)",
                  marginBottom: 14,
                }}
              >
                DAILY HOURS BY BUCKET
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData.rows} barSize={14}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(6,182,212,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fontFamily: G,
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontFamily: G,
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                    }}
                    unit="h"
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    domain={[0, "auto"]}
                    allowDataOverflow={false}
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
                      <span
                        style={{
                          fontFamily: G,
                          fontSize: 9,
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        {value}
                      </span>
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
          )}

          {/* Row 2: entries (left, flex-1) + pie (right, fixed width) */}
          {pieData.length > 0 && (
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Entries grouped by bucket */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <EntriesByBucket activities={filteredActivities} />
              </div>

              {/* Pie chart */}
              <div
                style={{
                  width: 280,
                  flexShrink: 0,
                  background: "rgba(6,182,212,0.03)",
                  border: "1px solid rgba(6,182,212,0.1)",
                  borderRadius: 8,
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    color: "rgba(6,182,212,0.5)",
                    marginBottom: 14,
                  }}
                >
                  TIME BY BUCKET
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="mins"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={false}
                      labelLine={false}
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
                      formatter={(v, name) => [`${fmtMins(Number(v))}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <PieLegend data={pieData} />
              </div>
            </div>
          )}

          {/* Fallback entries when no pie data (all filtered) */}
          {pieData.length === 0 && filteredActivities.length > 0 && (
            <EntriesByBucket activities={filteredActivities} />
          )}
        </>
      )}
    </div>
  );
}
