import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const G = "'JetBrains Mono','Fira Code',monospace";

// ── Date helpers ──────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}
export function drToday() {
  return isoDate(new Date());
}
function yesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1); return isoDate(d);
}
function startOfWeek() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); return isoDate(d);
}
function endOfWeek() {
  const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); return isoDate(d);
}
function startOfLastWeek() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay() - 7); return isoDate(d);
}
function endOfLastWeek() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay() - 1); return isoDate(d);
}
function startOfMonth() {
  const d = new Date(); d.setDate(1); return isoDate(d);
}
function startOfLastMonth() {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return isoDate(d);
}
function endOfLastMonth() {
  const d = new Date(); d.setDate(0); return isoDate(d);
}
function startOfYear() {
  const d = new Date(); d.setMonth(0, 1); return isoDate(d);
}
function startOfLastYear() {
  const d = new Date(); d.setFullYear(d.getFullYear() - 1, 0, 1); return isoDate(d);
}
function endOfLastYear() {
  const d = new Date(); d.setFullYear(d.getFullYear() - 1, 11, 31); return isoDate(d);
}

// ── Presets ───────────────────────────────────────────────────────────────────

export type PresetKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear";

const PRESET_DEFS: { key: PresetKey; label: string; from: () => string; to: () => string }[] = [
  { key: "today",      label: "Today",       from: drToday,          to: drToday         },
  { key: "yesterday",  label: "Yesterday",   from: yesterday,        to: yesterday       },
  { key: "thisWeek",   label: "This Week",   from: startOfWeek,      to: endOfWeek       },
  { key: "lastWeek",   label: "Last Week",   from: startOfLastWeek,  to: endOfLastWeek   },
  { key: "thisMonth",  label: "This Month",  from: startOfMonth,     to: drToday         },
  { key: "lastMonth",  label: "Last Month",  from: startOfLastMonth, to: endOfLastMonth  },
  { key: "thisYear",   label: "This Year",   from: startOfYear,      to: drToday         },
  { key: "lastYear",   label: "Last Year",   from: startOfLastYear,  to: endOfLastYear   },
];

/** Returns the { from, to } ISO date strings for a given preset key. */
export function getPresetRange(key: PresetKey): { from: string; to: string } {
  const p = PRESET_DEFS.find((d) => d.key === key)!;
  return { from: p.from(), to: p.to() };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** Hex or CSS color string — controls button, border, and text accent. */
  accent: string;
  /** rgba background for the panel, e.g. "#020c10". Defaults to "#0a0a0a". */
  panelBg?: string;
  /** Align the panel to the left or right of the trigger button. Default "left". */
  align?: "left" | "right";
}

export default function DateRangeDropdown({
  from,
  to,
  onChange,
  accent,
  panelBg = "#0a0a0a",
  align = "left",
}: Props) {
  const [open, setOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo]   = useState(to);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalFrom(from); }, [from]);
  useEffect(() => { setLocalTo(to); }, [to]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const inTrigger = ref.current?.contains(e.target as Node);
      const inPanel = panelRef.current?.contains(e.target as Node);
      if (!inTrigger && !inPanel) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const activePreset = PRESET_DEFS.find((p) => p.from() === from && p.to() === to);
  const label = activePreset
    ? activePreset.label
    : from === to
      ? from.slice(5).replace("-", "/")
      : `${from.slice(5).replace("-", "/")} – ${to.slice(5).replace("-", "/")}`;

  // Derived rgba from hex for subtle tints
  const hex = accent.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    fontSize: 9,
    border: `1px solid ${rgba(0.2)}`,
    borderRadius: 3,
    padding: "4px 6px",
    background: panelBg,
    color: accent,
    fontFamily: "inherit",
    outline: "none",
    colorScheme: "dark",
  };

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 6,
        ...(align === "right"
          ? { right: window.innerWidth - rect.right }
          : { left: rect.left }),
        zIndex: 9999,
      });
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={ref}>
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={toggleOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          background: rgba(0.07),
          border: `1px solid ${rgba(0.22)}`,
          borderRadius: 4,
          fontFamily: G,
          fontSize: 10,
          letterSpacing: "0.08em",
          color: accent,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = rgba(0.13); }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = rgba(0.07); }}
      >
        <span style={{ opacity: 0.55 }}>◷</span>
        {label}
        <span style={{ opacity: 0.4, fontSize: 8 }}>▾</span>
      </button>

      {/* Panel — rendered in a portal to escape all stacking contexts */}
      {open && createPortal(
        <div
          ref={panelRef}
          style={{
            ...panelStyle,
            background: panelBg,
            border: `1px solid ${rgba(0.18)}`,
            borderRadius: 6,
            overflow: "hidden",
            minWidth: "13rem",
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${rgba(0.04)}`,
            fontFamily: G,
          }}
        >
          {/* Preset list */}
          {PRESET_DEFS.map((p) => {
            const active = activePreset?.key === p.key;
            return (
              <button
                key={p.key}
                onClick={() => { onChange(p.from(), p.to()); setOpen(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 12px",
                  background: active ? rgba(0.1) : "transparent",
                  border: "none",
                  borderBottom: `1px solid ${rgba(0.05)}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: active ? accent : rgba(0.55),
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = rgba(0.06);
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {p.label}
                {active && <span style={{ fontSize: 9, opacity: 0.7 }}>✓</span>}
              </button>
            );
          })}

          {/* Custom date inputs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 10px",
              borderTop: `1px solid ${rgba(0.1)}`,
            }}
          >
            <input
              type="date"
              value={localFrom}
              max={localTo}
              onChange={(e) => {
                setLocalFrom(e.target.value);
                if (e.target.value && localTo && e.target.value <= localTo)
                  onChange(e.target.value, localTo);
              }}
              style={inputStyle}
            />
            <span style={{ color: rgba(0.3), fontSize: 10 }}>→</span>
            <input
              type="date"
              value={localTo}
              min={localFrom}
              max={drToday()}
              onChange={(e) => {
                setLocalTo(e.target.value);
                if (e.target.value && localFrom && localFrom <= e.target.value)
                  onChange(localFrom, e.target.value);
              }}
              style={inputStyle}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
