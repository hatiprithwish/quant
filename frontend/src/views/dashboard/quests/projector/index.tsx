import { useState, useMemo } from "react";
import { useGetTrajectoryConfig } from "@/api/cachedQueries";
import { useMutationUpsertTrajectoryConfig } from "@/api/mutations";
import Spinner from "@/components/common/Spinner";

const MONO = "'JetBrains Mono','Fira Code','Courier New',monospace";

function formatInr(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatYears(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}mo`;
  if (m === 0) return `${y}yr`;
  return `${y}yr ${m}mo`;
}

interface ProjectionPoint {
  month: number;
  invested: number;
  corpus: number;
}

function computeProjection(monthly: number, annualRate: number, targetCorpus: number): ProjectionPoint[] {
  const monthlyRate = annualRate / 100 / 12;
  const points: ProjectionPoint[] = [];
  let corpus = 0;
  let invested = 0;
  const maxMonths = 360; // 30 years cap

  for (let m = 1; m <= maxMonths; m++) {
    corpus = (corpus + monthly) * (1 + monthlyRate);
    invested += monthly;
    if (m % 12 === 0 || corpus >= targetCorpus) {
      points.push({ month: m, invested, corpus });
    }
    if (corpus >= targetCorpus) break;
  }
  return points;
}

function monthsToReachTarget(monthly: number, annualRate: number, target: number): number {
  const monthlyRate = annualRate / 100 / 12;
  let corpus = 0;
  for (let m = 1; m <= 360; m++) {
    corpus = (corpus + monthly) * (1 + monthlyRate);
    if (corpus >= target) return m;
  }
  return 360;
}

function SparkChart({ points, targetCorpus }: { points: ProjectionPoint[]; targetCorpus: number }) {
  if (points.length < 2) return null;
  const maxC = Math.max(...points.map((p) => p.corpus));
  const h = 80;
  const w = 100;
  const padX = 2;
  const padY = 6;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const corpusPath = points
    .map((p, i) => {
      const x = padX + (i / (points.length - 1)) * innerW;
      const y = padY + (1 - p.corpus / maxC) * innerH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const investedPath = points
    .map((p, i) => {
      const x = padX + (i / (points.length - 1)) * innerW;
      const y = padY + (1 - p.invested / maxC) * innerH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Target line
  const targetY = padY + (1 - Math.min(targetCorpus, maxC) / maxC) * innerH;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area under corpus */}
      <path
        d={`${corpusPath} L ${padX + innerW} ${padY + innerH} L ${padX} ${padY + innerH} Z`}
        fill="url(#corpusGrad)"
      />
      {/* Invested principal line */}
      <path d={investedPath} stroke="#22c55e" strokeWidth="0.8" fill="none" strokeDasharray="2,2" opacity="0.6" />
      {/* Corpus line */}
      <path d={corpusPath} stroke="#a78bfa" strokeWidth="1.2" fill="none" />
      {/* Target line */}
      {targetCorpus <= maxC && (
        <line x1={padX} y1={targetY} x2={padX + innerW} y2={targetY} stroke="#ef4444" strokeWidth="0.7" strokeDasharray="3,2" opacity="0.7" />
      )}
    </svg>
  );
}

function NumericInput({
  label, value, onChange, prefix, suffix, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; hint?: string;
}) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: "rgba(167,139,250,0.6)", fontWeight: 700, marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 4, overflow: "hidden" }}>
        {prefix && (
          <div style={{ background: "rgba(139,92,246,0.08)", padding: "7px 10px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#a78bfa", borderRight: "1px solid rgba(139,92,246,0.15)", flexShrink: 0 }}>{prefix}</div>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#eab308", padding: "6px 10px" }}
        />
        {suffix && (
          <div style={{ background: "rgba(139,92,246,0.08)", padding: "7px 10px", fontFamily: MONO, fontSize: 10, color: "rgba(167,139,250,0.5)", borderLeft: "1px solid rgba(139,92,246,0.15)", flexShrink: 0 }}>{suffix}</div>
        )}
      </div>
      {hint && <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

export default function CompoundProjectorPage() {
  const { data: configData, isLoading } = useGetTrajectoryConfig();
  const upsertMutation = useMutationUpsertTrajectoryConfig();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local form state, seeded from config
  const config = configData?.config;
  const [escapeNumber, setEscapeNumber] = useState(String(config?.escape_number ?? 24000000));
  const [monthlyInvestment, setMonthlyInvestment] = useState(String(config?.monthly_investment_target ?? 28000));
  const [annualReturn, setAnnualReturn] = useState(String(config?.assumed_annual_return_rate != null ? config.assumed_annual_return_rate * 100 : 12));
  const [currentIncome, setCurrentIncome] = useState(String(config?.current_monthly_income ?? 0));
  const [incomeY1, setIncomeY1] = useState(String(config?.income_milestone_year1 ?? 0));
  const [incomeY3, setIncomeY3] = useState(String(config?.income_milestone_year3 ?? 0));

  const target = Number(escapeNumber) || 24000000;
  const monthly = Number(monthlyInvestment) || 28000;
  const rate = Number(annualReturn) || 12;

  const points = useMemo(() => computeProjection(monthly, rate, target), [monthly, rate, target]);
  const monthsNeeded = useMemo(() => monthsToReachTarget(monthly, rate, target), [monthly, rate, target]);

  const lastPoint = points[points.length - 1];
  const totalInvested = lastPoint?.invested ?? 0;
  const finalCorpus = lastPoint?.corpus ?? 0;
  const gains = finalCorpus - totalInvested;
  const gainsPct = totalInvested > 0 ? Math.round((gains / totalInvested) * 100) : 0;

  // Monthly SIP required to reach target in exactly N months
  function sipForMonths(months: number): number {
    const r = rate / 100 / 12;
    if (r === 0) return target / months;
    return (target * r) / (Math.pow(1 + r, months) - 1);
  }
  const sip5 = sipForMonths(60);
  const sip3 = sipForMonths(36);
  const sip10 = sipForMonths(120);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertMutation.mutateAsync({
        escape_number: Number(escapeNumber) || null,
        monthly_investment_target: Number(monthlyInvestment) || null,
        assumed_annual_return_rate: (Number(annualReturn) || 12) / 100,
        current_monthly_income: Number(currentIncome) || null,
        income_milestone_year1: Number(incomeY1) || null,
        income_milestone_year3: Number(incomeY3) || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .proj-shell { display: flex; flex: 1; height: 100%; min-height: 0; background: #07050f; position: relative; overflow: hidden; flex-direction: column; }
        .proj-shell::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.007) 2px, rgba(139,92,246,0.007) 4px); pointer-events: none; z-index: 0; }
        .proj-shell::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 80% 20%, rgba(234,179,8,0.06) 0%, transparent 50%), radial-gradient(ellipse at 10% 80%, rgba(109,40,217,0.1) 0%, transparent 50%); pointer-events: none; z-index: 0; }
        .proj-scroll { flex: 1; overflow-y: auto; padding: 20px 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
        .proj-scroll::-webkit-scrollbar { width: 4px; }
        .proj-scroll::-webkit-scrollbar-track { background: transparent; }
        .proj-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 2px; }
        @keyframes projIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .proj-animate { animation: projIn 0.25s ease-out forwards; }
      `}</style>

      <div className="proj-shell">
        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(139,92,246,0.1)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,4,12,0.55)", backdropFilter: "blur(2px)", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: "rgba(234,179,8,0.5)", textShadow: "0 0 10px rgba(234,179,8,0.3)" }}>◎</span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#ffffff" }}>COMPOUND PROJECTOR</div>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: "rgba(234,179,8,0.4)", marginTop: 1 }}>SIP · compounding · escape number modelling</div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", fontWeight: 700, padding: "6px 16px", borderRadius: 3, background: saved ? "rgba(34,197,94,0.15)" : "#7c3aed", border: saved ? "1px solid rgba(34,197,94,0.3)" : "none", color: saved ? "#22c55e" : "#fff", cursor: "pointer", boxShadow: saved ? "none" : "0 0 16px rgba(124,58,237,0.4)" }}
          >
            {saving ? "SAVING…" : saved ? "✓ SAVED" : "SAVE CONFIG"}
          </button>
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <Spinner />
          </div>
        ) : (
          <div className="proj-scroll proj-animate">
            {/* Config inputs */}
            <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 8, padding: "16px" }}>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(139,92,246,0.5)", fontWeight: 700, marginBottom: 12 }}>PROJECTION CONFIG</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                <NumericInput label="ESCAPE NUMBER" value={escapeNumber} onChange={setEscapeNumber} prefix="₹" hint="Pre-tax corpus for financial freedom" />
                <NumericInput label="MONTHLY SIP" value={monthlyInvestment} onChange={setMonthlyInvestment} prefix="₹" hint="Monthly investment amount" />
                <NumericInput label="EXPECTED RETURN" value={annualReturn} onChange={setAnnualReturn} suffix="% p.a." hint="Annual return rate (equity: 10–14%)" />
                <NumericInput label="CURRENT MONTHLY INCOME" value={currentIncome} onChange={setCurrentIncome} prefix="₹" hint="For escape % tracking" />
                <NumericInput label="INCOME GOAL (1 YEAR)" value={incomeY1} onChange={setIncomeY1} prefix="₹" hint="Target monthly income at 1 yr" />
                <NumericInput label="INCOME GOAL (3 YEARS)" value={incomeY3} onChange={setIncomeY3} prefix="₹" hint="Target monthly income at 3 yr" />
              </div>
            </div>

            {/* Primary result */}
            <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, padding: "16px" }}>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(234,179,8,0.5)", fontWeight: 700, marginBottom: 14 }}>PROJECTION RESULT</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "TIME TO TARGET", value: formatYears(monthsNeeded), color: "#a78bfa", big: true },
                  { label: "FINAL CORPUS", value: formatInr(finalCorpus), color: "#eab308", big: true },
                  { label: "TOTAL INVESTED", value: formatInr(totalInvested), color: "#22c55e", big: false },
                  { label: "COMPOUND GAINS", value: formatInr(gains), color: "#06b6d4", big: false },
                  { label: "GAINS MULTIPLE", value: `${gainsPct}%`, color: "#f97316", big: false },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "10px 8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6 }}>
                    <div style={{ fontFamily: MONO, fontSize: s.big ? 18 : 14, fontWeight: 700, color: s.color, letterSpacing: "0.02em" }}>{s.value}</div>
                    <div style={{ fontFamily: MONO, fontSize: 6, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Sparkline chart */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 20, height: 1.5, background: "#a78bfa" }} />
                    <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.35)" }}>CORPUS</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 20, height: 1.5, background: "#22c55e", opacity: 0.6 }} />
                    <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.35)" }}>INVESTED</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 20, height: 1.5, background: "#ef4444", opacity: 0.7 }} />
                    <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.35)" }}>TARGET</span>
                  </div>
                </div>
                <SparkChart points={points} targetCorpus={target} />
              </div>

              {/* Year-by-year milestones */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontFamily: MONO, fontSize: 7, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 8 }}>YEARLY MILESTONES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {points.filter((_, i) => i < points.length - 1 || points.length <= 6).map((p, i) => {
                    const yr = Math.round(p.month / 12);
                    if (p.month % 12 !== 0 && p.month < 360) return null;
                    const pctOfTarget = Math.min(100, Math.round((p.corpus / target) * 100));
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)", width: 28, flexShrink: 0 }}>YR {yr}</span>
                        <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${pctOfTarget}%`, height: "100%", background: pctOfTarget >= 100 ? "#22c55e" : "#a78bfa", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 7, color: "#a78bfa", width: 55, textAlign: "right", flexShrink: 0 }}>{formatInr(p.corpus)}</span>
                        <span style={{ fontFamily: MONO, fontSize: 7, color: pctOfTarget >= 100 ? "#22c55e" : "rgba(255,255,255,0.25)", width: 30, textAlign: "right", flexShrink: 0 }}>{pctOfTarget}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SIP scenarios */}
            <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 8, padding: "16px" }}>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(139,92,246,0.5)", fontWeight: 700, marginBottom: 12 }}>SIP NEEDED BY HORIZON</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "3-YEAR SPRINT", months: 36, sip: sip3, color: "#ef4444", colorRgb: "239,68,68" },
                  { label: "5-YEAR PATH", months: 60, sip: sip5, color: "#eab308", colorRgb: "234,179,8" },
                  { label: "10-YEAR PATH", months: 120, sip: sip10, color: "#22c55e", colorRgb: "34,197,94" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", background: `rgba(${s.colorRgb},0.04)`, border: `1px solid rgba(${s.colorRgb},0.14)`, borderRadius: 6 }}>
                    <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: s.color }}>
                      {s.sip >= 1_00_00_000 ? "N/A" : formatInr(s.sip)}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 6, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginTop: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 7, color: `rgba(${s.colorRgb},0.5)`, marginTop: 4 }}>/ month</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Income gap tracker */}
            {Number(currentIncome) > 0 && (
              <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(6,182,212,0.14)", borderRadius: 8, padding: "16px" }}>
                <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(6,182,212,0.5)", fontWeight: 700, marginBottom: 12 }}>INCOME GAP TRACKER</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Number(incomeY1) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.4)", width: 60, flexShrink: 0 }}>1-YEAR</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, (Number(currentIncome) / Number(incomeY1)) * 100)}%`, height: "100%", background: "#06b6d4", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: "#06b6d4", width: 65, textAlign: "right", flexShrink: 0 }}>{formatInr(Number(currentIncome))} / {formatInr(Number(incomeY1))}</span>
                    </div>
                  )}
                  {Number(incomeY3) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.4)", width: 60, flexShrink: 0 }}>3-YEAR</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, (Number(currentIncome) / Number(incomeY3)) * 100)}%`, height: "100%", background: "#a78bfa", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: "#a78bfa", width: 65, textAlign: "right", flexShrink: 0 }}>{formatInr(Number(currentIncome))} / {formatInr(Number(incomeY3))}</span>
                    </div>
                  )}
                  <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                    Current monthly income vs income milestones
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
