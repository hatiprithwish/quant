import type { GrowthVsDistraction } from "@/schemas";

interface Props {
  data: GrowthVsDistraction;
}

export default function GrowthVsDistractionChart({ data }: Props) {
  const growthH = +(data.growth_minutes / 60).toFixed(1);
  const distractionH = +(data.distraction_minutes / 60).toFixed(1);
  const total = growthH + distractionH;
  const growthPct = total > 0 ? Math.round((growthH / total) * 100) : 0;
  const distractionPct = 100 - growthPct;

  return (
    <div style={{
      background: "rgba(14,9,26,0.9)",
      border: "1px solid rgba(139,92,246,0.14)",
      borderRadius: 8,
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)",
      }} />

      <div style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 9, letterSpacing: "0.2em", fontWeight: 700,
        color: "rgba(139,92,246,0.45)",
        marginBottom: 16,
      }}>GROWTH vs DISTRACTION</div>

      {/* Stat row */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
        <StatBlock label="GROWTH" value={`${growthH}h`} color="#10b981" glow="rgba(16,185,129,0.45)" />
        <div style={{ width: 1, height: 36, background: "rgba(139,92,246,0.1)", margin: "0 20px", flexShrink: 0 }} />
        <StatBlock label="DISTRACTION" value={`${distractionH}h`} color="#ef4444" glow="rgba(239,68,68,0.45)" />
        <div style={{ width: 1, height: 36, background: "rgba(139,92,246,0.1)", margin: "0 20px", flexShrink: 0 }} />
        <StatBlock label="FOCUS SCORE" value={`${Math.round(data.growth_pct)}%`} color="#a78bfa" glow="rgba(167,139,250,0.45)" />
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative" }}>
        {/* Track */}
        <div style={{
          height: 28, borderRadius: 6,
          background: "rgba(139,92,246,0.06)",
          border: "1px solid rgba(139,92,246,0.1)",
          overflow: "hidden",
          display: "flex",
          position: "relative",
        }}>
          {/* Growth segment */}
          <div style={{
            width: `${growthPct}%`,
            height: "100%",
            background: "linear-gradient(90deg, #059669, #10b981)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 20px rgba(16,185,129,0.4)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "width 0.6s ease",
            flexShrink: 0,
          }}>
            {/* Subtle inner shimmer */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 60%)",
            }} />
            {growthPct > 12 && (
              <span style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.85)",
                position: "relative", zIndex: 1,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}>{growthPct}%</span>
            )}
          </div>

          {/* Divider line between segments */}
          {growthPct > 0 && distractionPct > 0 && (
            <div style={{
              width: 1,
              height: "100%",
              background: "rgba(0,0,0,0.4)",
              flexShrink: 0,
            }} />
          )}

          {/* Distraction segment */}
          {distractionPct > 0 && (
            <div style={{
              flex: 1,
              height: "100%",
              background: "linear-gradient(90deg, #dc2626, #ef4444)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 20px rgba(239,68,68,0.3)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 60%)",
              }} />
              {distractionPct > 8 && (
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.75)",
                  position: "relative", zIndex: 1,
                  textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}>{distractionPct}%</span>
              )}
            </div>
          )}
        </div>

        {/* Labels below bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          paddingLeft: 2,
          paddingRight: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 5px rgba(16,185,129,0.7)",
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8, color: "rgba(16,185,129,0.7)", letterSpacing: "0.08em",
            }}>GROWTH · {growthH}h</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8, color: "rgba(239,68,68,0.7)", letterSpacing: "0.08em",
            }}>DISTRACTION · {distractionH}h</span>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 5px rgba(239,68,68,0.7)",
              flexShrink: 0,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color, glow }: { label: string; value: string; color: string; glow: string }) {
  return (
    <div>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 7, letterSpacing: "0.15em",
        color: "rgba(139,92,246,0.38)",
        marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 22, fontWeight: 700,
        color,
        textShadow: `0 0 12px ${glow}`,
        lineHeight: 1,
      }}>{value}</div>
    </div>
  );
}
