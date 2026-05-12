import type { AchievementItem } from "@/schemas";

interface Props {
  achievements: AchievementItem[];
}

export default function AchievementsSection({ achievements }: Props) {
  if (achievements.length === 0) return null;

  return (
    <div>
      <div style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 9, letterSpacing: "0.2em", fontWeight: 700,
        color: "rgba(139,92,246,0.45)",
        marginBottom: 12,
      }}>ACHIEVEMENTS</div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 10,
      }}>
        {achievements.map(a => (
          <div
            key={a.key}
            style={{
              background: "rgba(14,9,26,0.9)",
              border: "1px solid rgba(139,92,246,0.14)",
              borderRadius: 8, padding: 14,
              display: "flex", alignItems: "flex-start", gap: 12,
              position: "relative", overflow: "hidden",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "rgba(251,191,36,0.25)";
              el.style.boxShadow = "0 0 16px rgba(251,191,36,0.06)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "rgba(139,92,246,0.14)";
              el.style.boxShadow = "none";
            }}
          >
            {/* Gold shimmer top line */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.35), transparent)",
            }} />

            {/* Badge icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 6, flexShrink: 0,
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 0 10px rgba(251,191,36,0.08)",
            }}>{a.icon}</div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                color: "#fbbf24",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                marginBottom: 4,
              }}>{a.title}</div>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 7, color: "rgba(167,139,250,0.38)",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}>{a.description}</div>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 7, color: "rgba(139,92,246,0.22)",
                marginTop: 5,
                letterSpacing: "0.06em",
              }}>{a.unlocked_at.slice(0, 10)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
