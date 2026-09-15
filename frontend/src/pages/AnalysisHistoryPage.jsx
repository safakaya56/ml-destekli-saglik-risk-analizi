import React, { useState, useEffect } from "react";
import { History, Eye, X, Zap } from "lucide-react";

export default function AnalysisHistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null); // Popup Modal target

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/analysis/my-approved", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data);
      }
    } catch (err) {
      console.error("Analiz geçmişi yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (analysisId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/analysis/${analysisId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `AI_Saglik_Analiz_Raporu_${analysisId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      alert("PDF indirilemedi.");
    }
  };

  const getRiskBadge = (level, prob) => {
    const pct = prob !== undefined ? (prob * 100).toFixed(0) : 0;
    if (level === "Yüksek Risk" || level === "Kritik Risk") {
      return (
        <span style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", padding: "0.25rem 0.6rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700 }}>
          %{pct} - YÜKSEK
        </span>
      );
    }
    if (level === "Orta Risk") {
      return (
        <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", padding: "0.25rem 0.6rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700 }}>
          %{pct} - ORTA
        </span>
      );
    }
    return (
      <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "0.25rem 0.6rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700 }}>
        %{pct} - DÜŞÜK
      </span>
    );
  };

  const preds = selectedAnalysis?.predictions || {};
  const summary = selectedAnalysis?.llmSummary || {};

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Geçmiş Analizlerim</h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Doktor onaylı risk analizi ve değerlendirme raporlarınız ilk 3 gün boyunca Ana Panelinizde gösterilir. 3 günü dolan veya geçmiş tarihli tüm raporlarınız bu sayfada arşivlenmektedir.
          </p>
        </div>
      </div>

      {/* Detail Popup Modal (Request #6) */}
      {selectedAnalysis && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Yapay Zeka Risk Analiz Detayı
                </h2>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Analiz Tarihi: {new Date(selectedAnalysis.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <button
                onClick={() => setSelectedAnalysis(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Top 3 Risk Score Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
              {/* Diabetes */}
              <div style={{ border: `2px solid ${preds.diabetes?.risk_label === "Yüksek Risk" ? "#ef4444" : "#e2e8f0"}`, borderRadius: "14px", padding: "1.25rem", textAlign: "center", background: "#ffffff" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>DİYABET SKORU</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: preds.diabetes?.risk_label === "Yüksek Risk" ? "#dc2626" : "#0284c7" }}>
                  {preds.diabetes?.risk_label || "DÜŞÜK RİSK"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Olasılık: %{((preds.diabetes?.probability || 0) * 100).toFixed(1)}
                </div>
              </div>

              {/* Kidney */}
              <div style={{ border: `2px solid ${preds.kidney?.risk_label === "Yüksek Risk" ? "#ef4444" : "#e2e8f0"}`, borderRadius: "14px", padding: "1.25rem", textAlign: "center", background: "#ffffff" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>BÖBREK SKORU</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: preds.kidney?.risk_label === "Yüksek Risk" ? "#dc2626" : "#0284c7" }}>
                  {preds.kidney?.risk_label || "DÜŞÜK RİSK"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Olasılık: %{((preds.kidney?.probability || 0) * 100).toFixed(1)}
                </div>
              </div>

              {/* Heart */}
              <div style={{ border: `2px solid ${preds.cardiovascular?.risk_label === "Yüksek Risk" ? "#ef4444" : "#e2e8f0"}`, borderRadius: "14px", padding: "1.25rem", textAlign: "center", background: "#ffffff" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>KALP SKORU</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: preds.cardiovascular?.risk_label === "Yüksek Risk" ? "#dc2626" : "#0284c7" }}>
                  {preds.cardiovascular?.risk_label || "DÜŞÜK RİSK"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Olasılık: %{((preds.cardiovascular?.probability || 0) * 100).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Yapay Zeka Tavsiyesi */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0284c7", fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>
                <Zap size={18} /> Yapay Zeka Klinik Tavsiyesi
              </div>
              <p style={{ color: "#334155", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "0.75rem", fontWeight: 500 }}>
                {summary.summary}
              </p>
              {summary.recommendations && summary.recommendations.length > 0 && (
                <ul style={{ paddingLeft: "1.25rem", color: "#475569", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  {summary.recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: "0.4rem" }}>{rec}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setSelectedAnalysis(null)}
                style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Kapat
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedAnalysis._id)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none", background: "#0284c7", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
              >
                <Download size={16} /> PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {(() => {
          const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
          const archivedAnalyses = analyses.filter((item) => {
            const date = new Date(item.createdAt).getTime();
            return Date.now() - date > THREE_DAYS_MS;
          });

          if (loading) {
            return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Analiz geçmişi yükleniyor...</div>;
          }

          if (archivedAnalyses.length === 0) {
            return (
              <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                <History size={36} color="#cbd5e1" style={{ marginBottom: "0.5rem" }} />
                <div style={{ fontWeight: 600, color: "#1e293b" }}>Arşivlenmiş analiz kaydınız bulunmamaktadır.</div>
              </div>
            );
          }

          return (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>TARİH</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>DİYABET SKORU</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>BÖBREK SKORU</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>KALP SKORU</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem", textAlign: "right" }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {archivedAnalyses.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => setSelectedAnalysis(item)}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#0f172a" }}>
                      {new Date(item.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      {getRiskBadge(item.predictions?.diabetes?.risk_label, item.predictions?.diabetes?.probability)}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      {getRiskBadge(item.predictions?.kidney?.risk_label, item.predictions?.kidney?.probability)}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      {getRiskBadge(item.predictions?.cardiovascular?.risk_label, item.predictions?.cardiovascular?.probability)}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setSelectedAnalysis(item)}
                          style={{
                            background: "#e0f2fe",
                            color: "#0284c7",
                            border: "none",
                            padding: "0.45rem 0.85rem",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <Eye size={14} /> Detaylar
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(item._id)}
                          style={{
                            background: "#ffffff",
                            color: "#0284c7",
                            border: "1px solid #0284c7",
                            padding: "0.45rem 0.85rem",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <Download size={14} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
}
