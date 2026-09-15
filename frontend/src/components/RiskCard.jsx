import React from "react";
import { Activity, Heart, ShieldAlert } from "lucide-react";

const icons = {
  diabetes: <Activity color="#06b6d4" size={24} />,
  cardiovascular: <Heart color="#f43f5e" size={24} />,
  kidney: <ShieldAlert color="#f59e0b" size={24} />
};

const titleMap = {
  diabetes: "Diyabet Riski",
  cardiovascular: "Kardiyovasküler Risk",
  kidney: "Böbrek Hastalığı Riski"
};

export default function RiskCard({ targetKey, data }) {
  if (!data) return null;

  const probPct = ((data.probability || 0) * 100).toFixed(1);
  const badgeClass =
    data.risk_label === "Yüksek Risk"
      ? "badge-high"
      : data.risk_label === "Orta Risk"
      ? "badge-mid"
      : "badge-low";

  return (
    <div className="glass-card" style={{ padding: "1.5rem", flex: 1, minWidth: "260px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {icons[targetKey] || <Activity size={24} />}
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc" }}>{titleMap[targetKey] || targetKey}</h3>
        </div>
        <span className={badgeClass}>{data.risk_label}</span>
      </div>

      <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#f8fafc", fontFamily: "Outfit, sans-serif" }}>
          %{probPct}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.25rem" }}>
          Kalibre Edilmiş Risk Olasılığı
        </div>
      </div>

      <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "right" }}>
        Model Versiyonu: {data.model_version || "v1"}
      </div>
    </div>
  );
}
