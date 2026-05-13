import type { UserLevelInfo } from "@/schemas";

interface Props {
  levelInfo: UserLevelInfo;
  currentStreak: number;
  activeQuestsCount: number;
  focusScore: number;
}

export default function XpHeroStrip({ levelInfo, currentStreak, activeQuestsCount, focusScore }: Props) {
  const xpPct = levelInfo.xp_for_next > 0
    ? Math.min((levelInfo.xp_in_level / levelInfo.xp_for_next) * 100, 100)
    : 100;

  return (
    <div style={{
      background: "rgba(20,12,40,0.85)",
      border: "1px solid rgba(139,92,246,0.2)",
      borderRadius: 8,
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 15% 50%, rgba(109,40,217,0.12) 0%, transparent 60%)",
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)",
      }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        {/* Level orb + XP bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <div style={{
            width: 62, height: 62, borderRadius: "50%", flexShrink: 0,
            background: "radial-gradient(circle at 35% 35%, rgba(167,139,250,0.2) 0%, rgba(109,40,217,0.45) 100%)",
            border: "2px solid rgba(139,92,246,0.45)",
            boxShadow: "0 0 22px rgba(139,92,246,0.3), inset 0 0 14px rgba(139,92,246,0.12)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 22, fontWeight: 700,
              color: "#c4b5fd",
              textShadow: "0 0 12px rgba(196,181,253,0.8)",
              lineHeight: 1,
            }}>{levelInfo.level}</div>
            <div style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 7, letterSpacing: "0.2em",
              color: "rgba(167,139,250,0.55)",
              marginTop: 2,
            }}>LVL</div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 8, letterSpacing: "0.2em",
              color: "rgba(139,92,246,0.5)",
              marginBottom: 4,
              textTransform: "uppercase",
            }}>{levelInfo.title}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 15, fontWeight: 700,
                color: "#fbbf24",
                textShadow: "0 0 8px rgba(251,191,36,0.45)",
              }}>{levelInfo.xp_in_level.toLocaleString()} XP</span>
              <span style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 8,
                color: "rgba(139,92,246,0.38)",
              }}>/ {levelInfo.xp_for_next.toLocaleString()} to next</span>
            </div>
            <div style={{
              width: 200, height: 5,
              background: "rgba(139,92,246,0.12)",
              borderRadius: 3, overflow: "hidden",
              border: "1px solid rgba(139,92,246,0.12)",
            }}>
              <div style={{
                height: "100%",
                width: `${xpPct}%`,
                background: "linear-gradient(90deg, #6d28d9, #a78bfa)",
                borderRadius: 3,
                boxShadow: "0 0 8px rgba(139,92,246,0.55)",
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 24, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
          <Stat label="STREAK" value={`${currentStreak}d`} glow={currentStreak >= 7} icon="🔥" accent="#fbbf24" />
          <Stat label="ACTIVE" value={`${activeQuestsCount}`} icon="⚔" accent="#a78bfa" />
          <Stat label="FOCUS" value={`${Math.round(focusScore)}%`} icon="◎" accent={focusScore >= 70 ? "#10b981" : "#a78bfa"} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, glow, icon, accent }: { label: string; value: string; glow?: boolean; icon?: string; accent: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 7, letterSpacing: "0.15em",
        color: "rgba(139,92,246,0.4)",
        marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 19, fontWeight: 700,
        color: accent,
        textShadow: glow ? `0 0 14px ${accent}` : "none",
        display: "flex", alignItems: "center", gap: 3, justifyContent: "center",
      }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}{value}
      </div>
    </div>
  );
}
