import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function ShapFactorsList({ factors }) {
  if (!factors || factors.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {factors.map((item, idx) => {
        const isPositive = item.shap_impact > 0;
        return (
          <div
            key={idx}
            style={{
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              background: "rgba(15, 23, 42, 0.5)",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {isPositive ? (
                <ArrowUpRight color="#f43f5e" size={18} />
              ) : (
                <ArrowDownRight color="#10b981" size={18} />
              )}
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#f8fafc" }}>
                {item.label}
              </span>
              {item.value !== null && item.value !== undefined && (
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  ({item.value})
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: isPositive ? "#fb7185" : "#34d399"
              }}
            >
              {isPositive ? "Riski Artırıyor" : "Koruyucu Etki"} ({Math.abs(item.shap_impact).toFixed(3)})
            </div>
          </div>
        );
      })}
    </div>
  );
}
