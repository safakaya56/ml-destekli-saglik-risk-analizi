import React, { useState, useEffect } from "react";
import api from "../services/api";
import { AlertTriangle, AlertCircle, Calendar, User, CheckCircle2, Activity, X, Send } from "lucide-react";

export default function DoctorDashboard() {
  const [highRiskAnalyses, setHighRiskAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [detailAnalysis, setDetailAnalysis] = useState(null);

  // Approval Form State
  const [approveAnalysisItem, setApproveAnalysisItem] = useState(null);
  const [singleNoteText, setSingleNoteText] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveMsg, setApproveMsg] = useState("");

  const handleOpenApproveModal = (item) => {
    if (item.isApprovedByDoctor) return;
    setApproveAnalysisItem(item);
    setApproveMsg("");

    const summaryText = item.llmSummary?.summary || "Sağlık profilinize göre yapılan yapay zeka analizleri sonucunda kişiselleştirilmiş klinik tavsiyeler hazırlanmıştır.";
    const recs = item.llmSummary?.recommendations || [];

    let combined = summaryText;
    if (recs.length > 0) {
      combined += "\n\nÖnemli Sağlık ve Yaşam Tarzı Tavsiyeleri:\n" + recs.map(r => `• ${r}`).join("\n");
    }
    if (item.doctorNotes) {
      combined += `\n\nHekim Ek Notu: ${item.doctorNotes}`;
    }

    setSingleNoteText(combined);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveAnalysisItem) return;
    setApproveLoading(true);

    try {
      await api.put(`/analysis/${approveAnalysisItem._id}/approve`, {
        fullNote: singleNoteText
      });

      setApproveMsg("Değerlendirme raporu onaylandı ve hastaya iletildi!");
      setTimeout(() => {
        setApproveAnalysisItem(null);
        fetchHighRiskAnalyses();
      }, 1200);
    } catch (err) {
      alert("Onaylama işlemi başarısız.");
    } finally {
      setApproveLoading(false);
    }
  };

  // Appointment Modal Form State
  const [appointmentForm, setAppointmentForm] = useState({
    date: "",
    time: "10:00"
  });
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  useEffect(() => {
    fetchHighRiskAnalyses();
  }, []);

  const fetchHighRiskAnalyses = async () => {
    try {
      const res = await api.get("/analysis/high-risk");
      setHighRiskAnalyses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAppointmentModal = (analysis) => {
    setSelectedAnalysis(analysis);
    setModalError("");
    setModalSuccess("");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2);

    setAppointmentForm({
      date: tomorrow.toISOString().split("T")[0],
      time: "10:00"
    });
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!selectedAnalysis) return;

    const preds = selectedAnalysis.predictions || {};
    const riskTypes = [];
    if (preds.diabetes?.risk_label === "Yüksek Risk") riskTypes.push("Diyabet");
    if (preds.kidney?.risk_label === "Yüksek Risk") riskTypes.push("Böbrek");
    if (preds.cardiovascular?.risk_label === "Yüksek Risk") riskTypes.push("Kalp");

    try {
      await api.post("/appointments", {
        patientId: selectedAnalysis.patientId?._id || selectedAnalysis.patientId,
        analysisId: selectedAnalysis._id,
        date: appointmentForm.date,
        time: appointmentForm.time,
        riskTypes
      });

      setModalSuccess("Randevu başarıyla oluşturuldu ve hastaya iletildi!");
      setTimeout(() => {
        setSelectedAnalysis(null);
        fetchHighRiskAnalyses();
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || "Randevu verilemedi. Lütfen bilgileri kontrol ediniz.");
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Dashboard Title Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ width: "8px", height: "24px", background: "#0284c7", borderRadius: "4px" }}></div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", fontFamily: "Outfit, sans-serif" }}>
          Klinik Karar Destek Sistemi (CDSS) - Doktor Paneli
        </h1>
      </div>

      {/* Main Glass Card Section */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)",
          overflow: "hidden"
        }}
      >
        {/* Red Alert Header Container */}
        <div
          style={{
            background: "linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)",
            borderBottom: "1px solid #fecaca",
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                background: "#ef4444",
                color: "#ffffff",
                padding: "0.75rem",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                Yüksek Riskli Hastalar (Klinik Triyaj Kuyruğu)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                Yapay Zeka tarafından acil klinik müdahale gerektirdiği tespit edilen takipli hastalarınız
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "0.35rem 0.85rem",
              borderRadius: "20px",
              fontWeight: 700,
              fontSize: "0.85rem"
            }}
          >
            {highRiskAnalyses.length} Kritik Riskli Hasta
          </div>
        </div>

        {/* Table View */}
        <div style={{ padding: "1.5rem 2rem" }}>
          {loading ? (
            <div style={{ color: "#64748b", padding: "2rem", textAlign: "center" }}>
              Kritik riskli hastalar taranıyor...
            </div>
          ) : highRiskAnalyses.length === 0 ? (
            <div style={{ color: "#64748b", padding: "3rem", textAlign: "center" }}>
              Takipli hastalarınız arasında acil yüksek riskli hasta bulunmamaktadır.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "0.8rem", fontWeight: 700 }}>
                    <th style={{ padding: "1rem 0.5rem" }}>#</th>
                    <th style={{ padding: "1rem 0.5rem" }}>HASTA</th>
                    <th style={{ padding: "1rem 0.5rem" }}>T.C. KİMLİK NO</th>
                    <th style={{ padding: "1rem 0.5rem" }}>TESPİT EDİLEN RİSKLER</th>
                    <th style={{ padding: "1rem 0.5rem" }}>TARİH</th>
                    <th style={{ padding: "1rem 0.5rem" }}>BİLGİLENDİRME DURUMU</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>KLİNİK İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskAnalyses.map((item, idx) => {
                    const patient = typeof item.patientId === "object" && item.patientId !== null ? item.patientId : {};
                    const preds = item.predictions || {};

                    const riskBadges = [];
                    if (preds.diabetes) {
                      const r = preds.diabetes.risk_label;
                      riskBadges.push({ label: `Diyabet: ${r}`, isHigh: r === "Yüksek Risk", isMod: r === "Orta Risk" });
                    }
                    if (preds.cardiovascular) {
                      const r = preds.cardiovascular.risk_label;
                      riskBadges.push({ label: `Kalp: ${r}`, isHigh: r === "Yüksek Risk", isMod: r === "Orta Risk" });
                    }
                    if (preds.kidney) {
                      const r = preds.kidney.risk_label;
                      riskBadges.push({ label: `Böbrek: ${r}`, isHigh: r === "Yüksek Risk", isMod: r === "Orta Risk" });
                    }

                    const isApproved = item.isApprovedByDoctor;

                    return (
                      <tr key={item._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "1rem 0.5rem", color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: "1rem 0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <User size={18} />
                            </div>
                            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                              {patient.name || "Hasta"}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "1rem 0.5rem", color: "#475569", fontSize: "0.9rem" }}>
                          {patient.tcNo || "Girilmedi"}
                        </td>
                        <td style={{ padding: "1rem 0.5rem" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {riskBadges.map((b, bIdx) => (
                              <span
                                key={bIdx}
                                style={{
                                  background: b.isHigh ? "#fee2e2" : b.isMod ? "#fef3c7" : "#dcfce7",
                                  color: b.isHigh ? "#dc2626" : b.isMod ? "#b45309" : "#166534",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600
                                }}
                              >
                                {b.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "1rem 0.5rem", color: "#475569", fontSize: "0.9rem" }}>
                          {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                        </td>
                        <td style={{ padding: "1rem 0.5rem" }}>
                          {isApproved ? (
                            <span style={{ background: "#dcfce7", color: "#166534", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                              <CheckCircle2 size={14} /> Bilgilendirildi
                            </span>
                          ) : (
                            <span style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                              <AlertCircle size={14} /> Onay Bekliyor
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                            <button
                              onClick={() => setDetailAnalysis(item)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: "#f0f9ff",
                                color: "#0284c7",
                                border: "1px solid #bae6fd",
                                padding: "0.5rem 0.85rem",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer"
                              }}
                            >
                              <Activity size={14} /> SHAP Detayı
                            </button>

                            <button
                              disabled={isApproved}
                              onClick={() => handleOpenApproveModal(item)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: isApproved ? "#f1f5f9" : "#0284c7",
                                color: isApproved ? "#94a3b8" : "#ffffff",
                                border: isApproved ? "1px solid #cbd5e1" : "none",
                                padding: "0.5rem 0.85rem",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: isApproved ? "not-allowed" : "pointer",
                                opacity: isApproved ? 0.8 : 1
                              }}
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle2 size={14} /> Bilgilendirildi ✓
                                </>
                              ) : (
                                <>
                                  <Send size={14} /> Hastayı Bilgilendir
                                </>
                              )}
                            </button>

                            <button
                              disabled={item.hasAppointment}
                              onClick={() => handleOpenAppointmentModal(item)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: item.hasAppointment ? "#f1f5f9" : "#0284c7",
                                color: item.hasAppointment ? "#94a3b8" : "#ffffff",
                                border: item.hasAppointment ? "1px solid #cbd5e1" : "none",
                                padding: "0.5rem 0.85rem",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: item.hasAppointment ? "not-allowed" : "pointer",
                                opacity: item.hasAppointment ? 0.8 : 1
                              }}
                            >
                              {item.hasAppointment ? (
                                <>
                                  <CheckCircle2 size={14} /> Randevu Verildi ✓
                                </>
                              ) : (
                                <>
                                  <Calendar size={14} /> Randevu Ver
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SHAP & Technical Detail Modal */}
      {detailAnalysis && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "750px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={22} color="#0284c7" />
                <h3 style={{ fontSize: "1.25rem", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                  Teknik AI Risk & SHAP Detayları
                </h3>
              </div>
              <button onClick={() => setDetailAnalysis(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={22} />
              </button>
            </div>

            {/* Patient Metadata */}
            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div><strong>Hasta:</strong> {detailAnalysis.patientId?.name}</div>
              <div><strong>T.C.:</strong> {detailAnalysis.patientId?.tcNo}</div>
              <div><strong>Yaş / Cinsiyet:</strong> {detailAnalysis.patientId?.age} Yaş ({detailAnalysis.patientId?.gender === 1 ? "Erkek" : "Kadın"})</div>
              <div><strong>Sigara Anamnezi:</strong> {detailAnalysis.patientId?.smoking === 1 ? "Aktif/Eski İçici" : "İçmiyor"}</div>
              <div><strong>Ailede Kalp/Felç:</strong> {detailAnalysis.patientId?.family_history_cvd === 1 ? "Var" : "Yok"}</div>
              <div><strong>Ailede Diyabet:</strong> {detailAnalysis.patientId?.family_history_diabetes === 1 ? "Var" : "Yok"}</div>
            </div>

            {/* Target Risk Scores */}
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>Model Tahmin Olasılıkları</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#991b1b" }}>DİYABET</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>%{((detailAnalysis.predictions?.diabetes?.probability || 0) * 100).toFixed(1)}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Model: {detailAnalysis.predictions?.diabetes?.model_version}</div>
              </div>

              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#991b1b" }}>KARDİYOVASTÜLER (CVD)</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>%{((detailAnalysis.predictions?.cardiovascular?.probability || 0) * 100).toFixed(1)}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Model: {detailAnalysis.predictions?.cardiovascular?.model_version}</div>
              </div>

              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#991b1b" }}>BÖBREK HASTALIĞI</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>%{((detailAnalysis.predictions?.kidney?.probability || 0) * 100).toFixed(1)}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Model: {detailAnalysis.predictions?.kidney?.model_version}</div>
              </div>
            </div>

            {/* SHAP Factors */}
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>SHAP Risk Faktör Katkıları</h4>
            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
              {Object.entries(detailAnalysis.shapExplanations || {}).map(([targetKey, factors]) => (
                <div key={targetKey} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0284c7", textTransform: "uppercase" }}>{targetKey} Risk Faktörleri</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" }}>
                    {(factors || []).map((f, i) => (
                      <span key={i} style={{ background: f.shap_impact > 0 ? "#fee2e2" : "#dcfce7", color: f.shap_impact > 0 ? "#991b1b" : "#166534", padding: "0.3rem 0.65rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600 }}>
                        {f.label}: {f.value !== null ? f.value : "-"} (Etki: {f.shap_impact > 0 ? "+" : ""}{f.shap_impact?.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button onClick={() => setDetailAnalysis(null)} style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Assignment Modal */}
      {selectedAnalysis && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "1.25rem", color: "#0f172a", marginBottom: "0.5rem", fontWeight: 700 }}>
              Hastaya Randevu Tanımla
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Hasta: <strong>{selectedAnalysis.patientId?.name}</strong>
            </p>

            {modalError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={18} /> {modalSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.35rem" }}>
                  Randevu Tarihi (Haftaiçi)
                </label>
                <input
                  type="date"
                  required
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.35rem" }}>
                  Randevu Saati (Mesai Saatleri 09:00 - 17:00)
                </label>
                <select
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                >
                  <option value="09:00">09:00</option>
                  <option value="09:30">09:30</option>
                  <option value="10:00">10:00</option>
                  <option value="10:30">10:30</option>
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="15:00">15:00</option>
                  <option value="15:30">15:30</option>
                  <option value="16:00">16:00</option>
                  <option value="16:30">16:30</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setSelectedAnalysis(null)} style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
                  İptal
                </button>
                <button type="submit" style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "none", background: "#0284c7", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}>
                  Randevuyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Approve / Edit Patient Notification Modal */}
      {approveAnalysisItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                  Hastayı Bilgilendir & Raporu Onayla
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0" }}>
                  Hasta: <strong>{approveAnalysisItem.patientId?.name}</strong> (T.C.: {approveAnalysisItem.patientId?.tcNo || "-"})
                </p>
              </div>
              <button onClick={() => setApproveAnalysisItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={22} />
              </button>
            </div>

            {approveMsg && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={18} /> {approveMsg}
              </div>
            )}

            <form onSubmit={handleApproveSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                  Hastaya Gönderilecek Düzenlenebilir Sağlık Notu ve Tavsiyeler
                </label>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 0.5rem 0" }}>
                  Yapay Zeka tarafından hastanın anlayacağı dilde oluşturulmuş özet ve tavsiyeleri doğrudan aşağıdaki kutudan düzenleyebilirsiniz:
                </p>
                <textarea
                  rows="10"
                  required
                  value={singleNoteText}
                  onChange={(e) => setSingleNoteText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                    background: "#f8fafc"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setApproveAnalysisItem(null)} style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
                  İptal
                </button>
                <button type="submit" disabled={approveLoading} style={{ padding: "0.65rem 1.5rem", borderRadius: "8px", border: "none", background: "#0284c7", color: "#ffffff", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <Send size={16} /> {approveLoading ? "Gönderiliyor..." : "Hastayı Bilgilendir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
