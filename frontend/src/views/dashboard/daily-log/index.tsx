import { useEffect, useRef, useState } from "react";
import { useGetDailyLog } from "@/api/cachedQueries";
import {
  useMutationSaveDailyLog,
  useMutationAnalyzeDailyLog,
  useMutationWeeklyReview,
  useMutationCompareDays,
} from "@/api/mutations";
import Spinner from "@/components/common/Spinner";
import type { WeeklyReviewResponse, CompareDaysResponse } from "@/schemas";

const ACCENT = "#ea580c";
const AUTOSAVE_MS = 10_000;
const MAX_FAILS = 3;

function toLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function addDays(dateStr: string, n: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  return toLocalDateString(date);
}

// ── Weekly Review Panel ───────────────────────────────────────────────────────

function WeeklyReviewPanel({ onClose }: { onClose: () => void }) {
  const today = toLocalDateString();
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);
  const mutation = useMutationWeeklyReview();
  const result = mutation.data as WeeklyReviewResponse | undefined;

  return (
    <div style={{ border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 16, marginTop: 12, background: "rgba(234,88,12,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: ACCENT, letterSpacing: 1 }}>◈ WEEKLY REVIEW</span>
        <button onClick={onClose} style={{ fontSize: 16, color: "#888", background: "none", border: "none", cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 12, color: "#888" }}>From</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #444", background: "transparent", color: "inherit" }} />
        <label style={{ fontSize: 12, color: "#888" }}>To</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #444", background: "transparent", color: "inherit" }} />
        <button
          onClick={() => mutation.mutate({ from, to })}
          disabled={mutation.isPending}
          style={{ fontSize: 12, padding: "5px 14px", borderRadius: 4, border: "none", background: ACCENT, color: "#fff", cursor: "pointer", fontWeight: 600 }}
        >
          {mutation.isPending ? "Analyzing…" : "Generate Review"}
        </button>
      </div>
      {mutation.isError && <p style={{ fontSize: 12, color: "#ef4444" }}>Failed to generate review. Try again.</p>}
      {result?.isSuccess && result.review && (
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {result.review.wins.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>✓ Wins</p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>{result.review.wins.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          {result.review.misses.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>✗ Misses</p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>{result.review.misses.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}
          {result.review.recommendations.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 600, color: ACCENT, marginBottom: 4 }}>→ Next Week</p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>{result.review.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          {result.review.metrics_summary && (
            <p style={{ color: "#888", borderTop: "1px solid #333", paddingTop: 8, marginTop: 4 }}>{result.review.metrics_summary}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compare Days Panel ────────────────────────────────────────────────────────

function CompareDaysPanel({ currentDate, onClose }: { currentDate: string; onClose: () => void }) {
  const today = toLocalDateString();
  const [date1, setDate1] = useState(addDays(currentDate, -1));
  const [date2, setDate2] = useState(currentDate);
  const mutation = useMutationCompareDays();
  const result = mutation.data as CompareDaysResponse | undefined;

  return (
    <div style={{ border: `1px solid #06b6d433`, borderRadius: 8, padding: 16, marginTop: 12, background: "rgba(6,182,212,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "#06b6d4", letterSpacing: 1 }}>⇄ COMPARE DAYS</span>
        <button onClick={onClose} style={{ fontSize: 16, color: "#888", background: "none", border: "none", cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" value={date1} max={today} onChange={e => setDate1(e.target.value)}
          style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #444", background: "transparent", color: "inherit" }} />
        <span style={{ color: "#888", fontSize: 12 }}>vs</span>
        <input type="date" value={date2} max={today} onChange={e => setDate2(e.target.value)}
          style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #444", background: "transparent", color: "inherit" }} />
        <button
          onClick={() => mutation.mutate({ date1, date2 })}
          disabled={mutation.isPending}
          style={{ fontSize: 12, padding: "5px 14px", borderRadius: 4, border: "none", background: "#06b6d4", color: "#fff", cursor: "pointer", fontWeight: 600 }}
        >
          {mutation.isPending ? "Comparing…" : "Compare"}
        </button>
      </div>
      {mutation.isError && <p style={{ fontSize: 12, color: "#ef4444" }}>Failed to compare. Try again.</p>}
      {result?.isSuccess && result.comparison && (
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {result.comparison.verdict && (
            <p style={{ fontWeight: 600, marginBottom: 8, padding: "6px 10px", borderRadius: 4, background: "rgba(6,182,212,0.1)", border: "1px solid #06b6d433" }}>
              {result.comparison.verdict}
            </p>
          )}
          {result.comparison.better_areas.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>↑ Better</p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>{result.comparison.better_areas.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          {result.comparison.worse_areas.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>↓ Worse</p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>{result.comparison.worse_areas.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          {result.comparison.one_percent_suggestions.length > 0 && (
            <div>
              <p style={{ fontWeight: 600, color: ACCENT, marginBottom: 4 }}>+1% Tomorrow</p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>{result.comparison.one_percent_suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DailyLogPage() {
  const today = toLocalDateString();
  const [date, setDate] = useState(today);
  const [text, setText] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [analyzeStatus, setAnalyzeStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const pendingRef = useRef(false);
  const textRef = useRef(text);
  const failCountRef = useRef(0);
  const blockedRef = useRef(false);

  const { data, isLoading } = useGetDailyLog(date);
  const saveMutation = useMutationSaveDailyLog(date);
  const analyzeMutation = useMutationAnalyzeDailyLog();

  useEffect(() => {
    if (data?.log?.content !== undefined) {
      setText(data.log.content);
      setSaveStatus("saved");
      pendingRef.current = false;
      failCountRef.current = 0;
      blockedRef.current = false;
    } else if (data && !data.log) {
      setText("");
      setSaveStatus("saved");
    }
  }, [date, data?.log?.content]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const save = async () => {
    if (!pendingRef.current || blockedRef.current) return;
    setSaveStatus("saving");
    try {
      await saveMutation.mutateAsync(textRef.current);
      pendingRef.current = false;
      failCountRef.current = 0;
      setSaveStatus("saved");
    } catch {
      failCountRef.current++;
      if (failCountRef.current >= MAX_FAILS) {
        blockedRef.current = true;
        setSaveStatus("error");
      } else {
        setSaveStatus("unsaved");
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(save, AUTOSAVE_MS);
    return () => clearInterval(interval);
  }, [date]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    pendingRef.current = true;
    if (blockedRef.current) { blockedRef.current = false; failCountRef.current = 0; }
    setSaveStatus("unsaved");
  };

  const handleAnalyze = async () => {
    setAnalyzeStatus("pending");
    try {
      await analyzeMutation.mutateAsync(date);
      setAnalyzeStatus("done");
    } catch {
      setAnalyzeStatus("error");
    }
  };

  const isToday = date === today;
  const isProcessed = data?.log?.ai_processed ?? false;

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: ACCENT, fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>◈ DAILY LOG</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setDate(d => addDays(d, -1))}
              style={{ fontSize: 14, background: "none", border: "none", cursor: "pointer", color: "#888", padding: "2px 6px" }}
            >←</button>
            <span style={{ fontSize: 13, color: "#ccc", minWidth: 200, textAlign: "center" }}>
              {formatDisplayDate(date)}
              {isToday && <span style={{ marginLeft: 6, fontSize: 10, color: ACCENT, letterSpacing: 1 }}>TODAY</span>}
            </span>
            <button
              onClick={() => setDate(d => addDays(d, 1))}
              disabled={isToday}
              style={{ fontSize: 14, background: "none", border: "none", cursor: isToday ? "not-allowed" : "pointer", color: isToday ? "#444" : "#888", padding: "2px 6px" }}
            >→</button>
          </div>
        </div>
        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzeStatus === "pending" || !text.trim()}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 4, border: `1px solid ${ACCENT}`,
            background: isProcessed ? "rgba(34,197,94,0.15)" : analyzeStatus === "done" ? "rgba(34,197,94,0.15)" : "rgba(234,88,12,0.15)",
            color: isProcessed || analyzeStatus === "done" ? "#22c55e" : analyzeStatus === "error" ? "#ef4444" : ACCENT,
            cursor: analyzeStatus === "pending" || !text.trim() ? "not-allowed" : "pointer",
            fontWeight: 600, letterSpacing: 1,
          }}
        >
          {analyzeStatus === "pending" ? "Analyzing…"
            : analyzeStatus === "done" || isProcessed ? "✓ Logged"
            : analyzeStatus === "error" ? "✗ Failed"
            : "Analyze & Log"}
        </button>
      </div>

      {/* Editor */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner /></div>
      ) : (
        <textarea
          style={{
            width: "100%", height: "60vh", borderRadius: 8,
            border: `1px solid ${saveStatus === "error" ? "#ef4444" : "#333"}`,
            background: "transparent", padding: 16, fontSize: 14, lineHeight: 1.7,
            color: "inherit", resize: "none", outline: "none",
            fontFamily: "inherit",
          }}
          placeholder={`Write anything for ${formatDisplayDate(date)}…\n\nFood, expenses, time spent, thoughts — anything goes.\nAt the end of the day, click Analyze & Log to extract and save it all.`}
          value={text}
          onChange={handleChange}
        />
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 11, color: saveStatus === "error" ? "#ef4444" : "#666" }}>
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "unsaved" && "Unsaved changes"}
          {saveStatus === "error" && "Save failed — changes not saved"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setShowWeeklyReview(v => !v); setShowCompare(false); }}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid #333", background: "transparent", color: "#ccc", cursor: "pointer" }}
          >
            Weekly Review
          </button>
          <button
            onClick={() => { setShowCompare(v => !v); setShowWeeklyReview(false); }}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid #333", background: "transparent", color: "#ccc", cursor: "pointer" }}
          >
            Compare Days
          </button>
        </div>
      </div>

      {/* Inline panels */}
      {showWeeklyReview && <WeeklyReviewPanel onClose={() => setShowWeeklyReview(false)} />}
      {showCompare && <CompareDaysPanel currentDate={date} onClose={() => setShowCompare(false)} />}
    </div>
  );
}
