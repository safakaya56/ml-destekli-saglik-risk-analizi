import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Activity,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  X
} from "lucide-react";

export default function AllAnalysesPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [detailAnalysis, setDetailAnalysis] = useState(null); // SHAP modal
  const [selectedAppointment, setSelectedAppointment] = useState(null); // Appointment modal
  // Approval Form State
  const [approveAnalysisItem, setApproveAnalysisItem] = useState(null);
  const [singleNoteText, setSingleNoteText] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveMsg, setApproveMsg] = useState("");

  // Appointment Form State
  const [appointmentForm, setAppointmentForm] = useState({ date: "", time: "10:00" });
  const [appError, setAppError] = useState("");
  const [appSuccess, setAppSuccess] = useState("");

  useEffect(() => {
    fetchAllAnalyses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const fetchAllAnalyses = async () => {
    try {
      const res = await api.get("/analysis/all-doctor");
      setAnalyses(res.data || []);
    } catch (err) {
      console.error("Analiz sonuçları yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open Approval & Edit Modal
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

      setApproveMsg("Değerlendirme raporu başarıyla onaylandı ve hastaya iletildi!");
      setTimeout(() => {
        setApproveAnalysisItem(null);
        fetchAllAnalyses();
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || "Onaylama işlemi başarısız.");
    } finally {
      setApproveLoading(false);
    }
  };

  // Appointment Actions
  const handleOpenAppointmentModal = (analysis) => {
    setSelectedAppointment(analysis);
    setAppError("");
    setAppSuccess("");

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
    setAppError("");
    setAppSuccess("");

    if (!selectedAppointment) return;

    const preds = selectedAppointment.predictions || {};
    const riskTypes = [];
    if (preds.diabetes?.risk_label === "Yüksek Risk") riskTypes.push("Diyabet");
    if (preds.kidney?.risk_label === "Yüksek Risk") riskTypes.push("Böbrek");
    if (preds.cardiovascular?.risk_label === "Yüksek Risk") riskTypes.push("Kalp");

    try {
      await api.post("/appointments", {
        patientId: selectedAppointment.patientId._id,
        analysisId: selectedAppointment._id,
        date: appointmentForm.date,
        time: appointmentForm.time,
        riskTypes
      });

      setAppSuccess("Randevu başarıyla oluşturuldu ve hastaya iletildi!");
      setTimeout(() => {
        setSelectedAppointment(null);
        fetchAllAnalyses();
      }, 1200);
    } catch (err) {
      setAppError(err.response?.data?.message || "Randevu verilemedi.");
    }
  };

  const filteredAnalyses = analyses.filter((item) => {
    const patient = item.patientId || {};
    const matchesSearch =
      (patient.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.tcNo || "").includes(searchTerm);

    if (!matchesSearch) return false;

    if (startDate) {
      const itemDate = new Date(item.createdAt);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (itemDate < start) return false;
    }

    if (endDate) {
      const itemDate = new Date(item.createdAt);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (itemDate > end) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage) || 1;
  const currentAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Tüm Klinik Analiz & Risk Sonuçları
          </h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Takipli hastalarınız için hesaplanan tüm yapay zeka risk analizleri, SHAP detayları ve hasta bilgilendirmeleri.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar with Date Range */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 2, minWidth: "260px", position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Hasta Adı veya T.C. Kimlik No ile Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.8rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.9rem",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "#ffffff", border: "1px solid #cbd5e1", padding: "0.4rem 0.75rem", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Tarih Aralığı:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "0.35rem 0.5rem",
              fontSize: "0.85rem",
              outline: "none",
              color: "#334155"
            }}
          />
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "0.35rem 0.5rem",
              fontSize: "0.85rem",
              outline: "none",
              color: "#334155"
            }}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                padding: "0 0.25rem"
              }}
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Analiz sonuçları yükleniyor...</div>
        ) : filteredAnalyses.length === 0 ? (
          <div style={{ padding: "3.5rem", textAlign: "center", color: "#64748b" }}>
            Filtrelere uygun analiz kaydı bulunamadı.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>HASTA</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>T.C. KİMLİK NO</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>TEST TARİHİ</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>TESPİT EDİLEN RİSKLER</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>BİLGİLENDİRME DURUMU</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem", textAlign: "right" }}>İŞLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {currentAnalyses.map((item) => {
                const patient = item.patientId || {};
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

                return (
                  <tr key={item._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#0f172a" }}>
                      {patient.name || "Hasta"}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#475569" }}>
                      {patient.tcNo || "Girilmedi"}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#475569", fontSize: "0.85rem" }}>
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {riskBadges.map((b, idx) => (
                          <span
                            key={idx}
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
                    <td style={{ padding: "1rem 1.25rem" }}>
                      {item.isApprovedByDoctor ? (
                        <span style={{ background: "#dcfce7", color: "#166534", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <CheckCircle2 size={14} /> Hastaya Gönderildi
                        </span>
                      ) : (
                        <span style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <AlertCircle size={14} /> Onay Bekliyor
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                        <button
                          onClick={() => setDetailAnalysis(item)}
                          style={{
                            background: "#f0f9ff",
                            color: "#0284c7",
                            border: "1px solid #bae6fd",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <Activity size={14} /> SHAP
                        </button>

                        <button
                          disabled={item.isApprovedByDoctor}
                          onClick={() => handleOpenApproveModal(item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: item.isApprovedByDoctor ? "#f1f5f9" : "#0284c7",
                            color: item.isApprovedByDoctor ? "#94a3b8" : "#ffffff",
                            border: item.isApprovedByDoctor ? "1px solid #cbd5e1" : "none",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: item.isApprovedByDoctor ? "not-allowed" : "pointer",
                            opacity: item.isApprovedByDoctor ? 0.8 : 1
                          }}
                        >
                          {item.isApprovedByDoctor ? (
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
                            padding: "0.45rem 0.75rem",
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
                              <Calendar size={14} /> Randevu
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
        )}

        {/* Pagination Controls */}
        {filteredAnalyses.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Toplam {filteredAnalyses.length} kayıttan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAnalyses.length)} arası gösteriliyor
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: currentPage === 1 ? "#f1f5f9" : "#ffffff",
                  color: currentPage === 1 ? "#94a3b8" : "#334155",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer"
                }}
              >
                Önceki
              </button>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", padding: "0 0.4rem" }}>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: currentPage >= totalPages ? "#f1f5f9" : "#ffffff",
                  color: currentPage >= totalPages ? "#94a3b8" : "#334155",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer"
                }}
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* SHAP Detail Modal */}
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

            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div><strong>Hasta:</strong> {detailAnalysis.patientId?.name}</div>
              <div><strong>T.C.:</strong> {detailAnalysis.patientId?.tcNo || "Girilmedi"}</div>
              <div><strong>Yaş / Cinsiyet:</strong> {detailAnalysis.patientId?.age} Yaş ({detailAnalysis.patientId?.gender === 1 ? "Erkek" : "Kadın"})</div>
              <div><strong>Sigara Anamnezi:</strong> {detailAnalysis.patientId?.smoking === 1 ? "Aktif/Eski İçici" : "İçmiyor"}</div>
            </div>

            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>Model Tahmin Olasılıkları</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#991b1b" }}>DİYABET</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>%{((detailAnalysis.predictions?.diabetes?.probability || 0) * 100).toFixed(1)}</div>
              </div>

              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#991b1b" }}>KARDİYOVASTÜLER (CVD)</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>%{((detailAnalysis.predictions?.cardiovascular?.probability || 0) * 100).toFixed(1)}</div>
              </div>

              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#991b1b" }}>BÖBREK HASTALIĞI</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>%{((detailAnalysis.predictions?.kidney?.probability || 0) * 100).toFixed(1)}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setDetailAnalysis(null)} style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {selectedAppointment && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "1.25rem", color: "#0f172a", marginBottom: "0.5rem", fontWeight: 700 }}>
              Hastaya Randevu Tanımla
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Hasta: <strong>{selectedAppointment.patientId?.name}</strong>
            </p>

            {appError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {appError}
              </div>
            )}

            {appSuccess && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={18} /> {appSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.35rem" }}>Randevu Tarihi</label>
                <input type="date" required value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.35rem" }}>Randevu Saati</label>
                <select value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setSelectedAppointment(null)} style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
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
    </div>
  );
}
