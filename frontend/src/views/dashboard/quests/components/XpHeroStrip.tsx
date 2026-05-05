import type { UserLevelInfo, GrowthVsDistraction } from "@/schemas";

interface Props {
  levelInfo: UserLevelInfo;
  currentStreak: number;
  activeQuestsCount: number;
  focusScore: number;
  growthVsDistraction: GrowthVsDistraction;
}

export default function XpHeroStrip({ levelInfo, currentStreak, activeQuestsCount, focusScore, growthVsDistraction }: Props) {
  const xpPct = levelInfo.xp_for_next > 0
    ? Math.min((levelInfo.xp_in_level / levelInfo.xp_for_next) * 100, 100)
    : 100;

  const growthTotal = growthVsDistraction.growth_minutes + growthVsDistraction.distraction_minutes;
  const growthBarPct = growthTotal > 0 ? (growthVsDistraction.growth_minutes / growthTotal) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 rounded-xl border border-indigo-800/50 p-5 text-white">
      <div className="flex items-start gap-5 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-indigo-700/60 border-2 border-indigo-500 flex items-center justify-center">
            <div className="text-center leading-none">
              <div className="text-lg font-bold">{levelInfo.level}</div>
              <div className="text-xs text-indigo-300 -mt-0.5">LVL</div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-indigo-300 uppercase tracking-widest mb-0.5">{levelInfo.title}</div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold">{levelInfo.xp_in_level.toLocaleString()} XP</span>
              <span className="text-xs text-indigo-400">/ {levelInfo.xp_for_next.toLocaleString()} to next</span>
            </div>
            <div className="w-48 h-2 bg-indigo-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-5 flex-wrap ml-auto">
          <Stat label="Streak" value={`${currentStreak}d`} accent={currentStreak >= 7} icon="🔥" />
          <Stat label="Active" value={`${activeQuestsCount}`} icon="⚔️" />
          <Stat label="Focus" value={`${Math.round(focusScore)}%`} icon="◎" />
          <div className="min-w-0">
            <div className="text-xs text-indigo-400 mb-1">Growth vs Distraction</div>
            <div className="w-32 h-2 bg-indigo-900/60 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400 rounded-l-full transition-all" style={{ width: `${growthBarPct}%` }} />
              <div className="h-full bg-red-400 rounded-r-full transition-all" style={{ width: `${100 - growthBarPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-indigo-300 mt-0.5">
              <span>{Math.round(growthVsDistraction.growth_minutes / 60 * 10) / 10}h growth</span>
              <span>{Math.round(growthVsDistraction.distraction_minutes / 60 * 10) / 10}h dist.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, icon }: { label: string; value: string; accent?: boolean; icon?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-indigo-400 mb-0.5">{label}</div>
      <div className={`text-lg font-bold ${accent ? "text-amber-400" : "text-white"}`}>
        {icon && <span className="mr-0.5">{icon}</span>}{value}
      </div>
    </div>
  );
}
