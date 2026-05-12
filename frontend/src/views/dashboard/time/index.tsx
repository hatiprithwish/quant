import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetTime, useGetTimeBuckets } from "@/api/cachedQueries";
import type { TimeActivity } from "@/schemas";
import TimeHero from "./components/TimeHero";
import ActivityLog from "./components/ActivityLog";
import LogTimeModal from "./components/LogTimeModal";
import BucketsManager from "./components/BucketsManager";
import TimeReports from "./components/TimeReports";
import Spinner from "@/components/common/Spinner";
import DateRangeDropdown, { drToday } from "@/components/common/DateRangeDropdown";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";

type Section = "log" | "buckets" | "reports";

const RAIL_NAV: { label: string; sub: string; glyph: string; value: Section }[] = [
  { label: "CHRONICLE", sub: "activity log",  glyph: "◎", value: "log" },
  { label: "BUCKETS",   sub: "manage",        glyph: "◈", value: "buckets" },
  { label: "REPORTS",   sub: "analytics",     glyph: "△", value: "reports" },
];

// ── Left rail ─────────────────────────────────────────────────────────────────

function TimeRail({
  section,
  setSection,
}: {
  section: Section;
  setSection: (s: Section) => void;
}) {
  return (
    <aside
      style={{
        width: 160,
        flexShrink: 0,
        background: "rgba(2,12,16,0.8)",
        borderRight: "1px solid rgba(6,182,212,0.1)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
        position: "relative",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 20%, rgba(6,182,212,0.04) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          padding: "0 12px 12px",
          borderBottom: "1px solid rgba(6,182,212,0.08)",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: G,
            fontSize: 8,
            letterSpacing: "0.22em",
            color: "rgba(6,182,212,0.4)",
            marginBottom: 2,
          }}
        >
          SECTOR
        </div>
        <div
          style={{
            fontFamily: G,
            fontSize: 11,
            letterSpacing: "0.18em",
            fontWeight: 700,
            color: A,
            textShadow: `0 0 12px rgba(6,182,212,0.5)`,
          }}
        >
          TIME
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "0 6px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {RAIL_NAV.map((item) => {
          const active = section === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setSection(item.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 8px",
                background: active ? "rgba(6,182,212,0.08)" : "transparent",
                border: "none",
                borderLeftWidth: 2,
                borderLeftStyle: "solid",
                borderLeftColor: active ? A : "transparent",
                borderRadius: "0 4px 4px 0",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,182,212,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                <span
                  style={{
                    fontSize: 10,
                    color: active ? A : "rgba(6,182,212,0.25)",
                    textShadow: active ? `0 0 8px rgba(6,182,212,0.7)` : "none",
                    flexShrink: 0,
                    transition: "color 0.15s",
                  }}
                >
                  {item.glyph}
                </span>
                <span
                  style={{
                    fontFamily: G,
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                    color: active ? "#fff" : "rgba(255,255,255,0.3)",
                    transition: "color 0.15s",
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
                {active && (
                  <div
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: A,
                      boxShadow: `0 0 6px ${A}`,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontFamily: G,
                  fontSize: 7,
                  letterSpacing: "0.1em",
                  color: active ? `rgba(6,182,212,0.55)` : "rgba(255,255,255,0.18)",
                  marginLeft: 16,
                  marginTop: 1,
                  transition: "color 0.15s",
                }}
              >
                {item.sub}
              </div>
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: "10px 12px 0",
          borderTop: "1px solid rgba(6,182,212,0.07)",
          marginTop: 8,
        }}
      >
        <div
          style={{
            fontFamily: G,
            fontSize: 7,
            letterSpacing: "0.1em",
            color: "rgba(6,182,212,0.2)",
            lineHeight: 1.6,
          }}
        >
          <div>SYS · TIME</div>
          <div>STATUS · ONLINE</div>
        </div>
      </div>
    </aside>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TimePage({ initialSection }: { initialSection?: Section }) {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>(initialSection ?? "log");

  function handleSetSection(s: Section) {
    setSection(s);
    if (s === "log") navigate("/time", { replace: true });
    else if (s === "reports") navigate("/time/reports", { replace: true });
    else if (s === "buckets") navigate("/time/buckets", { replace: true });
  }
  const [from, setFrom] = useState(drToday);
  const [to, setTo] = useState(drToday);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeActivity | null>(null);

  const { data, isLoading, error } = useGetTime(from, to);
  const { data: bucketsData } = useGetTimeBuckets();
  const activeBuckets = bucketsData?.buckets.filter((b) => !b.is_archived) ?? [];

  function openCreate() {
    setEditEntry(null);
    setShowLogModal(true);
  }
  function openEdit(entry: TimeActivity) {
    setEditEntry(entry);
    setShowLogModal(true);
  }
  function closeModal() {
    setShowLogModal(false);
    setEditEntry(null);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

        .time-shell {
          display: flex;
          flex: 1;
          height: 100%;
          min-height: 0;
          background: #020c10;
          position: relative;
          overflow: hidden;
        }
        .time-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(6,182,212,0.006) 2px,
            rgba(6,182,212,0.006) 4px
          );
          pointer-events: none;
          z-index: 0;
        }
        .time-shell::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 50%, rgba(6,182,212,0.04) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 15%, rgba(34,211,153,0.02) 0%, transparent 45%);
          pointer-events: none;
          z-index: 0;
        }
        .time-rail-wrapper {
          position: relative;
          z-index: 2;
        }
        .time-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
          z-index: 1;
          overflow: visible;
        }
        .time-header {
          border-bottom: 1px solid rgba(6,182,212,0.09);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(2,12,16,0.45);
          backdrop-filter: blur(2px);
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 10px;
        }
        .time-body {
          flex: 1;
          overflow-y: auto;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .time-body::-webkit-scrollbar { width: 4px; }
        .time-body::-webkit-scrollbar-track { background: transparent; }
        .time-body::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.18); border-radius: 2px; }
        .time-body::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.35); }
        @media (max-width: 640px) {
          .time-rail-wrapper { display: none; }
          .time-body { padding: 14px 16px; }
          .time-header { padding: 10px 16px; }
        }
        @keyframes timeFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .time-animate-in {
          animation: timeFadeIn 0.22s ease-out forwards;
        }
      `}</style>

      <div className="time-shell">
        <div className="time-rail-wrapper">
          <TimeRail section={section} setSection={handleSetSection} />
        </div>

        <div className="time-content-area">
          {/* Header */}
          <div className="time-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 14,
                  color: "rgba(6,182,212,0.5)",
                  textShadow: "0 0 10px rgba(6,182,212,0.3)",
                }}
              >
                ◎
              </span>
              <div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 11,
                    letterSpacing: "0.22em",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {section === "log" ? "CHRONICLE" : section === "buckets" ? "BUCKETS" : "REPORTS"}
                </div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 8,
                    letterSpacing: "0.12em",
                    color: "rgba(6,182,212,0.4)",
                    marginTop: 1,
                  }}
                >
                  {section === "log" ? "time tracker" : section === "buckets" ? "manage buckets" : "analytics"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {section === "log" && (
                <DateRangeDropdown
                  accent={A}
                  panelBg="#020c10"
                  align="right"
                  from={from}
                  to={to}
                  onChange={(f, t) => { setFrom(f); setTo(t); }}
                />
              )}
              {section === "log" && (
                <button
                  onClick={openCreate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    background: A,
                    border: "none",
                    borderRadius: 4,
                    fontFamily: G,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    color: "#000",
                    cursor: "pointer",
                    boxShadow: "0 0 16px rgba(6,182,212,0.35)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(6,182,212,0.55)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(6,182,212,0.35)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  + LOG TIME
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="time-body">
            {/* ── CHRONICLE (LOG) section ───────────────────────────────────── */}
            {section === "log" && (
              <div className="time-animate-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {isLoading && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
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
                      letterSpacing: "0.08em",
                      color: "rgba(239,68,68,0.8)",
                    }}
                  >
                    ✕ FAILED TO LOAD TIME DATA
                  </div>
                )}

                {data && !isLoading && (
                  <>
                    <TimeHero data={data} />
                    <ActivityLog days={data.days} onEdit={openEdit} />
                  </>
                )}

                {data && data.days.length === 0 && !isLoading && (
                  <div
                    style={{
                      border: "1px solid rgba(6,182,212,0.08)",
                      borderRadius: 8,
                      padding: "56px 0",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.15 }}>◎</div>
                    <div
                      style={{
                        fontFamily: G,
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        color: "rgba(6,182,212,0.35)",
                        fontWeight: 700,
                      }}
                    >
                      NO ENTRIES
                    </div>
                    <div
                      style={{
                        fontFamily: G,
                        fontSize: 9,
                        color: "rgba(255,255,255,0.18)",
                        marginTop: 8,
                      }}
                    >
                      Hit{" "}
                      <span
                        style={{
                          color: A,
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationColor: "rgba(6,182,212,0.3)",
                        }}
                        onClick={openCreate}
                      >
                        + LOG TIME
                      </span>{" "}
                      to record your first session.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BUCKETS section ───────────────────────────────────────────── */}
            {section === "buckets" && (
              <div className="time-animate-in">
                <BucketsManager />
              </div>
            )}

            {/* ── REPORTS section ───────────────────────────────────────────── */}
            {section === "reports" && (
              <div className="time-animate-in">
                <TimeReports />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log / Edit modal */}
      {showLogModal && (
        <LogTimeModal
          entry={editEntry}
          buckets={activeBuckets}
          defaultDate={from}
          onClose={closeModal}
        />
      )}
    </>
  );
}
