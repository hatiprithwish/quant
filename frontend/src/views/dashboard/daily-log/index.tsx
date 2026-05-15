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
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    <div
      style={{
        border: `1px solid ${ACCENT}33`,
        borderRadius: 8,
        padding: 16,
        background: "rgba(234,88,12,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: ACCENT,
            letterSpacing: 1,
          }}
        >
          ◈ WEEKLY REVIEW
        </span>
        <button
          onClick={onClose}
          style={{
            fontSize: 16,
            color: "#888",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: 12, color: "#888" }}>From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
          }}
        />
        <label style={{ fontSize: 12, color: "#888" }}>To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
          }}
        />
        <button
          onClick={() => mutation.mutate({ from, to })}
          disabled={mutation.isPending}
          style={{
            fontSize: 12,
            padding: "5px 14px",
            borderRadius: 4,
            border: "none",
            background: ACCENT,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {mutation.isPending ? "Analyzing…" : "Generate Review"}
        </button>
      </div>
      {mutation.isError && (
        <p style={{ fontSize: 12, color: "#ef4444" }}>
          Failed to generate review. Try again.
        </p>
      )}
      {result?.isSuccess && result.review && (
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {result.review.wins.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>
                ✓ Wins
              </p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.review.wins.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {result.review.misses.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>
                ✗ Misses
              </p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.review.misses.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {result.review.recommendations.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 600, color: ACCENT, marginBottom: 4 }}>
                → Next Week
              </p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.review.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {result.review.metrics_summary && (
            <p
              style={{
                color: "#888",
                borderTop: "1px solid #333",
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              {result.review.metrics_summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compare Days Panel ────────────────────────────────────────────────────────

function CompareDaysPanel({
  currentDate,
  onClose,
}: {
  currentDate: string;
  onClose: () => void;
}) {
  const today = toLocalDateString();
  const [date1, setDate1] = useState(addDays(currentDate, -1));
  const [date2, setDate2] = useState(currentDate);
  const mutation = useMutationCompareDays();
  const result = mutation.data as CompareDaysResponse | undefined;

  return (
    <div
      style={{
        border: `1px solid #06b6d433`,
        borderRadius: 8,
        padding: 16,
        background: "rgba(6,182,212,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: "#06b6d4",
            letterSpacing: 1,
          }}
        >
          ⇄ COMPARE DAYS
        </span>
        <button
          onClick={onClose}
          style={{
            fontSize: 16,
            color: "#888",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="date"
          value={date1}
          max={today}
          onChange={(e) => setDate1(e.target.value)}
          style={{
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
          }}
        />
        <span style={{ color: "#888", fontSize: 12 }}>vs</span>
        <input
          type="date"
          value={date2}
          max={today}
          onChange={(e) => setDate2(e.target.value)}
          style={{
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
          }}
        />
        <button
          onClick={() => mutation.mutate({ date1, date2 })}
          disabled={mutation.isPending}
          style={{
            fontSize: 12,
            padding: "5px 14px",
            borderRadius: 4,
            border: "none",
            background: "#06b6d4",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {mutation.isPending ? "Comparing…" : "Compare"}
        </button>
      </div>
      {mutation.isError && (
        <p style={{ fontSize: 12, color: "#ef4444" }}>
          Failed to compare. Try again.
        </p>
      )}
      {result?.isSuccess && result.comparison && (
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {result.comparison.verdict && (
            <p
              style={{
                fontWeight: 600,
                marginBottom: 8,
                padding: "6px 10px",
                borderRadius: 4,
                background: "rgba(6,182,212,0.1)",
                border: "1px solid #06b6d433",
              }}
            >
              {result.comparison.verdict}
            </p>
          )}
          {result.comparison.better_areas.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>
                ↑ Better
              </p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.comparison.better_areas.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {result.comparison.worse_areas.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>
                ↓ Worse
              </p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.comparison.worse_areas.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {result.comparison.one_percent_suggestions.length > 0 && (
            <div>
              <p style={{ fontWeight: 600, color: ACCENT, marginBottom: 4 }}>
                +1% Tomorrow
              </p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.comparison.one_percent_suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({
  selectedDate,
  today,
  onSelect,
}: {
  selectedDate: string;
  today: string;
  onSelect: (d: string) => void;
}) {
  const [y, m] = selectedDate.split("-").map(Number);
  const [viewYear, setViewYear] = useState(y);
  const [viewMonth, setViewMonth] = useState(m);

  useEffect(() => {
    const [ny, nm] = selectedDate.split("-").map(Number);
    setViewYear(ny);
    setViewMonth(nm);
  }, [selectedDate]);

  const todayParts = today.split("-").map(Number);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((v) => v - 1);
    } else setViewMonth((v) => v - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth =
      viewYear === todayParts[0] && viewMonth === todayParts[1];
    if (isCurrentMonth) return;
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((v) => v + 1);
    } else setViewMonth((v) => v + 1);
  };

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const isCurrentMonth =
    viewYear === todayParts[0] && viewMonth === todayParts[1];
  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" },
  );

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #2a2a2a",
        background: "#0d0d0d",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            fontSize: 12,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#888",
            padding: "2px 6px",
          }}
        >
          ←
        </button>
        <span
          style={{
            fontSize: 11,
            color: "#aaa",
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          {monthLabel.toUpperCase()}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          style={{
            fontSize: 12,
            background: "none",
            border: "none",
            cursor: isCurrentMonth ? "not-allowed" : "pointer",
            color: isCurrentMonth ? "#333" : "#888",
            padding: "2px 6px",
          }}
        >
          →
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          textAlign: "center",
        }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span
            key={d}
            style={{
              fontSize: 9,
              color: "#555",
              paddingBottom: 4,
              letterSpacing: 0.5,
            }}
          >
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const dayStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFuture = dayStr > today;
          const isSelected = dayStr === selectedDate;
          const isToday = dayStr === today;
          return (
            <button
              key={i}
              onClick={() => !isFuture && onSelect(dayStr)}
              disabled={isFuture}
              style={{
                fontSize: 10,
                padding: "3px 0",
                borderRadius: 4,
                border: "none",
                cursor: isFuture ? "not-allowed" : "pointer",
                background: isSelected
                  ? ACCENT
                  : isToday
                    ? "rgba(234,88,12,0.2)"
                    : "transparent",
                color: isFuture
                  ? "#333"
                  : isSelected
                    ? "#fff"
                    : isToday
                      ? ACCENT
                      : "#999",
                fontWeight: isSelected || isToday ? 700 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sidebar Panel (right panel on desktop, collapsible on mobile) ─────────────

function SidebarPanel({
  date,
  today,
  setDate,
  isToday,
  saveGlyph,
  saveLabel,
  saveColor,
  analyzeLabel,
  analyzeBg,
  analyzeColor,
  analyzeBorder,
  analyzeStatus,
  text,
  handleAnalyze,
  showWeeklyReview,
  setShowWeeklyReview,
  showCompare,
  setShowCompare,
  mobileOpen,
  setMobileOpen,
}: {
  date: string;
  today: string;
  setDate: (d: string) => void;
  isToday: boolean;
  saveGlyph: string;
  saveLabel: string;
  saveColor: string;
  analyzeLabel: string;
  analyzeBg: string;
  analyzeColor: string;
  analyzeBorder: string;
  analyzeStatus: string;
  text: string;
  handleAnalyze: () => void;
  showWeeklyReview: boolean;
  setShowWeeklyReview: (v: boolean) => void;
  showCompare: boolean;
  setShowCompare: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const content = (
    <>
      <span
        style={{
          color: ACCENT,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.2em",
          marginBottom: 16,
          display: "block",
        }}
      >
        ◈ DAILY LOG
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <button
          onClick={() => setDate(addDays(date, -1))}
          style={{
            fontSize: 13,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#666",
            padding: "2px 4px",
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <span
          style={{
            fontSize: 11,
            color: "#ccc",
            textAlign: "center",
            letterSpacing: "0.03em",
          }}
        >
          {formatDisplayDate(date)}
          {isToday && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 9,
                color: ACCENT,
                letterSpacing: "0.1em",
              }}
            >
              TODAY
            </span>
          )}
        </span>
        <button
          onClick={() => setDate(addDays(date, 1))}
          disabled={isToday}
          style={{
            fontSize: 13,
            background: "none",
            border: "none",
            cursor: isToday ? "not-allowed" : "pointer",
            color: isToday ? "#2a2a2a" : "#666",
            padding: "2px 4px",
            lineHeight: 1,
          }}
        >
          →
        </button>
      </div>

      <MiniCalendar selectedDate={date} today={today} onSelect={setDate} />

      <div style={{ height: 1, background: "#1e1e1e", margin: "12px 0" }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          color: saveColor,
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        <span>{saveGlyph}</span>
        <span>{saveLabel}</span>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={analyzeStatus === "pending" || !text.trim()}
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: 4,
          border: `1px solid ${analyzeBorder}`,
          background: analyzeBg,
          color: analyzeColor,
          cursor:
            analyzeStatus === "pending" || !text.trim()
              ? "not-allowed"
              : "pointer",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          transition: "opacity 0.15s",
          opacity: analyzeStatus === "pending" || !text.trim() ? 0.5 : 1,
        }}
      >
        {analyzeLabel}
      </button>

      <div style={{ height: 1, background: "#1e1e1e", margin: "14px 0" }} />

      <button
        onClick={() => {
          setShowWeeklyReview(!showWeeklyReview);
          setShowCompare(false);
        }}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 4,
          border: showWeeklyReview
            ? `1px solid ${ACCENT}55`
            : "1px solid #2a2a2a",
          background: showWeeklyReview
            ? `rgba(234,88,12,0.08)`
            : "transparent",
          color: showWeeklyReview ? ACCENT : "#666",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          transition: "all 0.15s",
        }}
      >
        ◈ WEEKLY REVIEW
      </button>
      <button
        onClick={() => {
          setShowCompare(!showCompare);
          setShowWeeklyReview(false);
        }}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 4,
          marginTop: 6,
          border: showCompare ? "1px solid #06b6d455" : "1px solid #2a2a2a",
          background: showCompare ? "rgba(6,182,212,0.08)" : "transparent",
          color: showCompare ? "#06b6d4" : "#666",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          transition: "all 0.15s",
        }}
      >
        ⇄ COMPARE DAYS
      </button>
    </>
  );

  return (
    <>
      {/* Desktop right panel */}
      <div
        className="hidden md:flex"
        style={{
          width: 280,
          flexShrink: 0,
          flexDirection: "column",
          borderRight: "1px solid #1e1e1e",
          paddingRight: 16,
          overflowY: "auto",
        }}
      >
        {content}
      </div>

      {/* Mobile: floating button to open panel */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: ACCENT,
          border: "none",
          color: "#fff",
          fontSize: 18,
          cursor: "pointer",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px ${ACCENT}66`,
        }}
      >
        ◈
      </button>

      {/* Mobile panel overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 48,
          }}
          className="md:hidden"
        />
      )}

      {/* Mobile slide-up panel */}
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: mobileOpen ? 0 : "-100%",
          left: 0,
          right: 0,
          height: "85vh",
          background: "#0d0d0d",
          borderTop: `1px solid ${ACCENT}33`,
          borderRadius: "16px 16px 0 0",
          zIndex: 49,
          transition: "bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: "20px 20px 32px",
          overflowY: "auto",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em" }}>DAILY LOG CONTROLS</span>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}
          >
            ✕
          </button>
        </div>
        {content}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DailyLogPage() {
  const today = toLocalDateString();
  const [date, setDate] = useState(today);
  const [text, setText] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >("saved");
  const [analyzeStatus, setAnalyzeStatus] = useState<
    "idle" | "pending" | "done" | "error"
  >("idle");
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

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
    if (blockedRef.current) {
      blockedRef.current = false;
      failCountRef.current = 0;
    }
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

  const drawerOpen = showWeeklyReview || showCompare;

  const saveGlyph =
    saveStatus === "saved"
      ? "●"
      : saveStatus === "saving"
        ? "◌"
        : saveStatus === "unsaved"
          ? "○"
          : "✗";
  const saveLabel =
    saveStatus === "saved"
      ? "SAVED"
      : saveStatus === "saving"
        ? "SAVING…"
        : saveStatus === "unsaved"
          ? "UNSAVED"
          : "SAVE FAILED";
  const saveColor =
    saveStatus === "saved"
      ? "#22c55e"
      : saveStatus === "saving"
        ? ACCENT
        : saveStatus === "unsaved"
          ? "#555"
          : "#ef4444";

  const analyzeLabel =
    analyzeStatus === "pending"
      ? "ANALYZING…"
      : analyzeStatus === "done" || isProcessed
        ? "✓ LOGGED"
        : analyzeStatus === "error"
          ? "✗ FAILED"
          : "◈ ANALYZE & LOG";
  const analyzeBg =
    isProcessed || analyzeStatus === "done"
      ? "rgba(34,197,94,0.12)"
      : "rgba(234,88,12,0.1)";
  const analyzeColor =
    isProcessed || analyzeStatus === "done"
      ? "#22c55e"
      : analyzeStatus === "error"
        ? "#ef4444"
        : ACCENT;
  const analyzeBorder =
    isProcessed || analyzeStatus === "done"
      ? "#22c55e55"
      : analyzeStatus === "error"
        ? "#ef444455"
        : `${ACCENT}88`;

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 48px)",
        gap: 20,
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* ── LEFT PANEL (EDITOR) ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Spinner />
          </div>
        ) : (
          <textarea
            style={{
              flex: 1,
              width: "100%",
              borderRadius: 8,
              border: `1px solid ${saveStatus === "error" ? "#ef4444" : "#1e1e1e"}`,
              background: "transparent",
              padding: "16px",
              fontSize: 14,
              lineHeight: 1.8,
              color: "inherit",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            placeholder={`Write anything for ${formatDisplayDate(date)}…\n\nFood, expenses, time spent, thoughts — anything goes.\nAt the end of the day, hit Analyze & Log to extract and save it all.`}
            value={text}
            onChange={handleChange}
          />
        )}
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <SidebarPanel
        date={date}
        today={today}
        setDate={setDate}
        isToday={isToday}
        saveGlyph={saveGlyph}
        saveLabel={saveLabel}
        saveColor={saveColor}
        analyzeLabel={analyzeLabel}
        analyzeBg={analyzeBg}
        analyzeColor={analyzeColor}
        analyzeBorder={analyzeBorder}
        analyzeStatus={analyzeStatus}
        text={text}
        handleAnalyze={handleAnalyze}
        showWeeklyReview={showWeeklyReview}
        setShowWeeklyReview={setShowWeeklyReview}
        showCompare={showCompare}
        setShowCompare={setShowCompare}
        mobileOpen={mobilePanelOpen}
        setMobileOpen={setMobilePanelOpen}
      />

      {/* ── BACKDROP ───────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => {
            setShowWeeklyReview(false);
            setShowCompare(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 49,
          }}
        />
      )}

      {/* ── SLIDE-IN DRAWER (Weekly Review / Compare Days) ─────────────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: drawerOpen ? 0 : "-100vw",
          width: "min(420px, 100vw)",
          height: "100vh",
          background: "#0d0d0d",
          borderLeft: `1px solid ${ACCENT}33`,
          zIndex: 50,
          transition: "right 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: "24px 20px",
          overflowY: "auto",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      >
        {showWeeklyReview && (
          <WeeklyReviewPanel onClose={() => setShowWeeklyReview(false)} />
        )}
        {showCompare && (
          <CompareDaysPanel
            currentDate={date}
            onClose={() => setShowCompare(false)}
          />
        )}
      </div>
    </div>
  );
}
