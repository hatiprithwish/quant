import { useState } from "react";
import { useGetFoodItems } from "@/api/cachedQueries";
import { useMutationUpdateFoodItem } from "@/api/mutations";
import type { FoodItemRow } from "@/schemas";
import { FoodItemReviewStatusEnum, FoodItemSourceEnum } from "@/schemas";

const BG = "#030a06";
const ACCENT = "#10b981";
const DIM = "#4a5568";
const BORDER = "#1a2e1f";

const SOURCE_COLOR: Record<FoodItemSourceEnum, string> = {
  [FoodItemSourceEnum.USDA]: "#06b6d4",
  [FoodItemSourceEnum.OpenFoodFacts]: "#f97316",
  [FoodItemSourceEnum.Browser]: "#eab308",
  [FoodItemSourceEnum.AiEstimated]: "#a78bfa",
};

const SOURCE_LABEL: Record<FoodItemSourceEnum, string> = {
  [FoodItemSourceEnum.USDA]: "USDA",
  [FoodItemSourceEnum.OpenFoodFacts]: "OPEN FOOD FACTS",
  [FoodItemSourceEnum.Browser]: "WEB SCRAPE",
  [FoodItemSourceEnum.AiEstimated]: "AI EST.",
};

function ApproveButton({ item }: { item: FoodItemRow }) {
  const mutation = useMutationUpdateFoodItem(item.id);
  return (
    <button
      onClick={() => mutation.mutateAsync({ review_status: FoodItemReviewStatusEnum.Approved })}
      disabled={mutation.isPending}
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "10px",
        letterSpacing: "0.1em",
        padding: "4px 10px",
        border: `1px solid ${ACCENT}`,
        borderRadius: "2px",
        background: mutation.isPending ? "#1a2e1f" : "transparent",
        color: ACCENT,
        cursor: mutation.isPending ? "not-allowed" : "pointer",
        opacity: mutation.isPending ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {mutation.isPending ? "…" : "APPROVE"}
    </button>
  );
}

function EditableKeywords({ item }: { item: FoodItemRow }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.keywords.join(", "));
  const mutation = useMutationUpdateFoodItem(item.id);

  const save = () => {
    const keywords = value.split(",").map((k) => k.trim()).filter(Boolean);
    mutation.mutateAsync({ keywords }).then(() => setEditing(false));
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "10px",
          background: "#0f1f14",
          border: `1px solid ${ACCENT}`,
          borderRadius: "2px",
          color: ACCENT,
          padding: "2px 6px",
          width: "140px",
          outline: "none",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{
        cursor: "pointer",
        color: DIM,
        fontSize: "10px",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {item.keywords.slice(0, 2).join(", ") || "—"}
      {item.keywords.length > 2 ? ` +${item.keywords.length - 2}` : ""}
    </span>
  );
}

export default function FoodReviewPage() {
  const { data, isLoading } = useGetFoodItems("pending");
  const items = data?.items ?? [];

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: "JetBrains Mono, monospace",
        padding: "24px",
        color: "#e2e8f0",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px" }}>
          <span style={{ fontSize: "20px", color: ACCENT, fontWeight: 700, letterSpacing: "0.15em" }}>
            ◈ DB REVIEW
          </span>
          <span
            style={{
              fontSize: "10px",
              background: "#1a2e1f",
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              borderRadius: "2px",
              padding: "2px 8px",
              letterSpacing: "0.1em",
            }}
          >
            {items.length} ITEM{items.length !== 1 ? "S" : ""} PENDING REVIEW
          </span>
        </div>
        <div style={{ fontSize: "11px", color: DIM, letterSpacing: "0.05em" }}>
          food nutrition database — newly discovered items
        </div>
      </div>

      {isLoading && (
        <div style={{ color: DIM, fontSize: "11px", letterSpacing: "0.1em" }}>
          LOADING…
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "4px",
            padding: "48px",
            textAlign: "center",
            color: DIM,
            fontSize: "12px",
            letterSpacing: "0.15em",
          }}
        >
          NO PENDING ITEMS — ALL CLEAR
        </div>
      )}

      {items.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
              letterSpacing: "0.05em",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["NAME", "BRAND", "SOURCE", "CAL/100g", "P", "C", "F", "KEYWORDS", "ACTION"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: DIM,
                      fontWeight: 400,
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <td style={{ padding: "10px 12px", color: "#e2e8f0", maxWidth: "180px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600 }}>{item.name}</div>
                    {item.is_branded && (
                      <div style={{ fontSize: "9px", color: DIM, marginTop: "2px" }}>BRANDED</div>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: DIM, fontSize: "10px" }}>
                    {item.brand ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        color: SOURCE_COLOR[item.source] ?? "#888",
                        border: `1px solid ${SOURCE_COLOR[item.source] ?? "#888"}`,
                        borderRadius: "2px",
                        padding: "2px 6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {SOURCE_LABEL[item.source] ?? item.source}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: ACCENT, fontWeight: 600 }}>
                    {Math.round(item.calories_per_100g)}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#e2e8f0" }}>
                    {item.protein_g.toFixed(1)}g
                  </td>
                  <td style={{ padding: "10px 12px", color: "#e2e8f0" }}>
                    {item.carb_g.toFixed(1)}g
                  </td>
                  <td style={{ padding: "10px 12px", color: "#e2e8f0" }}>
                    {item.fat_g.toFixed(1)}g
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <EditableKeywords item={item} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <ApproveButton item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
