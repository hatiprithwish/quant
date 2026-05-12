import type { GetTimeSummaryResponse } from "@/schemas";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface Props {
  data: GetTimeSummaryResponse;
}

export default function TimeHero({ data }: Props) {
  const sessionCount = data.days.reduce(
    (s, d) => s + d.buckets.reduce((bs, b) => bs + b.activities.length, 0),
    0,
  );
  const topBucket = [...data.byBucket].sort((a, b) => b.total_minutes - a.total_minutes)[0];
  const avgMins = data.days.length > 0 ? Math.round(data.totalMinutes / data.days.length) : 0;

  const stats: { label: string; value: string; sub: string; accent?: string }[] = [
    {
      label: "TOTAL TIME",
      value: fmtMins(data.totalMinutes),
      sub: `${data.days.length} day${data.days.length !== 1 ? "s" : ""}`,
      accent: A,
    },
    {
      label: "SESSIONS",
      value: String(sessionCount),
      sub: "entries logged",
    },
    {
      label: "AVG PER DAY",
      value: fmtMins(avgMins),
      sub: "daily average",
    },
    ...(topBucket
      ? [
          {
            label: "TOP BUCKET",
            value: topBucket.bucket_name,
            sub: fmtMins(topBucket.total_minutes),
            accent: topBucket.bucket_color,
          },
        ]
      : []),
  ];

  return (
    <div
      style={{
        background: "rgba(6,182,212,0.04)",
        border: "1px solid rgba(6,182,212,0.14)",
        borderRadius: 8,
        padding: "18px 22px",
        display: "grid",
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 20,
      }}
    >
      {stats.map((stat, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div
            style={{
              fontFamily: G,
              fontSize: 8,
              letterSpacing: "0.2em",
              color: "rgba(6,182,212,0.45)",
              textTransform: "uppercase",
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontFamily: G,
              fontSize: 20,
              fontWeight: 700,
              color: stat.accent ?? "rgba(255,255,255,0.85)",
              textShadow: stat.accent === A ? `0 0 18px rgba(6,182,212,0.35)` : "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontFamily: G,
              fontSize: 8,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            {stat.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
