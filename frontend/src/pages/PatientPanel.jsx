import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Calendar,
  AlertCircle,
  Download,
  FileText,
  Info
} from "lucide-react";

export default function PatientPanel({ user }) {
  const navigate = useNavigate();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [approvedReports, setApprovedReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch Patient Profile
      const profileRes = await api.get("/patients/me/profile");
      setMyProfile(profileRes.data);

      // 2. Fetch Upcoming Appointment
      const appRes = await api.get("/appointments/patient");
      if (appRes.data && appRes.data.length > 0) {
        setUpcomingAppointment(appRes.data[0]);
      }

      // 3. Fetch Doctor-Approved Health Reports
      const reportsRes = await api.get("/analysis/my-approved");
      setApprovedReports(reportsRes.data || []);
    } catch (err) {
      console.error("Veriler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (reportId) => {
    try {
      const res = await api.get(`/analysis/${reportId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Doktor_Onayli_Saglik_Raporu_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("PDF indirme hatası oluştu.");
    }
  };

  const isProfileComplete = myProfile && myProfile.age > 0 && myProfile.height > 0 && myProfile.weight > 0 && myProfile.tcNo;

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
      {/* 1. Upcoming Appointments Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)",
          borderRadius: "16px",
          padding: "1.75rem 2rem",
          color: "#ffffff",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.3)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 600 }}>
          <Calendar size={18} /> Yaklaşan Doktor Randevularınız
        </div>

        {upcomingAppointment ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                minWidth: "260px"
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{upcomingAppointment.doctorId?.name || "Dr. Ali Kara"}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "0.25rem" }}>
                📅 {upcomingAppointment.date} &nbsp; 🕒 {upcomingAppointment.time}
              </div>
            </div>

            <Link
              to="/appointments"
              style={{ color: "#ffffff", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", opacity: 0.9 }}
            >
              TÜMÜNÜ GÖR →
            </Link>
          </div>
        ) : (
          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Planlanmış aktif doktor randevunuz bulunmamaktadır.</div>
        )}
      </div>

      {/* Incomplete Profile Alert Banner (Sleek 1-Liner) */}
      {!isProfileComplete && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={18} />
            <span><strong>Profiliniz Eksik:</strong> Doktorunuzun tahlillerinizi değerlendirebilmesi için yaş, boy, kilo ve anamnez bilgilerinizi tamamlamanız gerekmektedir.</span>
          </div>
          <Link to="/patient/profile" style={{ background: "#0284c7", color: "#ffffff", padding: "0.4rem 0.85rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>
            Şimdi Doldur →
          </Link>
        </div>
      )}

      {/* 3. Doktor Onaylı Sağlık Raporları Container */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "2rem",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "#dcfce7", color: "#166534", padding: "0.6rem", borderRadius: "10px" }}>
            <FileText size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Doktor Onaylı Sağlık ve Değerlendirme Raporlarım
            </h2>
          </div>
        </div>

        {(() => {
          const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
          const activeReports = approvedReports.filter((report) => {
            const date = new Date(report.createdAt).getTime();
            return Date.now() - date <= THREE_DAYS_MS;
          });

          if (activeReports.length === 0) {
            return (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <Info size={36} color="#0284c7" style={{ marginBottom: "0.75rem" }} />
                <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.35rem 0" }}>
                  Son 3 Güne Ait Aktif Bir Değerlendirme Raporunuz Bulunmamaktadır
                </h4>
                <p style={{ fontSize: "0.85rem", color: "#64748b", maxWidth: "540px", margin: "0 auto 1.25rem auto", lineHeight: 1.5 }}>
                  Doktorunuz laboratuvar sonuçlarınızı onayladığında raporunuz 3 gün boyunca bu panelde görüntülenecektir. Geçmiş tahlil ve değerlendirme raporlarınıza aşağıdaki butonla ulaşabilirsiniz.
                </p>
                <Link
                  to="/patient/history"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "#0284c7",
                    color: "#ffffff",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textDecoration: "none"
                  }}
                >
                  <FileText size={16} /> Geçmiş Analizlerime Git →
                </Link>
              </div>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {activeReports.map((report) => {
                const summary = report.llmSummary || {};
                const lab = report.labTestId || {};

                return (
                  <div
                    key={report._id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "1.75rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", paddingBottom: "0.85rem", borderBottom: "1px solid #f1f5f9" }}>
                      <div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                          {lab.title || "Full Panel Kan Sayımı & Biyokimya"}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
                          📅 Test Tarihi: {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadPDF(report._id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          padding: "0.55rem 1.15rem",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer"
                        }}
                      >
                        <Download size={16} /> PDF Raporu İndir
                      </button>
                    </div>

                    {/* Single Unified Content Container Box */}
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem" }}>
                      <div style={{ color: "#0284c7", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                        Klinik Genel Sağlık Durumunuz
                      </div>
                      <p style={{ fontSize: "0.88rem", color: "#334155", lineHeight: 1.6, margin: "0 0 1rem 0", fontWeight: 500 }}>
                        {summary.summary}
                      </p>

                      {/* Doctor Special Notes */}
                      {report.doctorNotes && (
                        <div style={{ marginBottom: "1rem" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e40af", marginBottom: "0.25rem" }}>
                            Hekiminizden Ek Poliklinik Notu:
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#1e3a8a", lineHeight: 1.5 }}>
                            "{report.doctorNotes}"
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {summary.recommendations && summary.recommendations.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", margin: "0 0 0.4rem 0" }}>
                            ÖNEMLİ SAĞLIK & YAŞAM TARZI TAVSİYELERİ
                          </h4>
                          <ul style={{ paddingLeft: "1.25rem", color: "#334155", fontSize: "0.85rem", lineHeight: 1.65, margin: 0 }}>
                            {summary.recommendations.map((rec, i) => (
                              <li key={i} style={{ marginBottom: "0.35rem" }}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div style={{ textAlign: "center", marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                <Link to="/patient/history" style={{ color: "#0284c7", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}>
                  Tüm Geçmiş Analiz ve Raporlarınızı Görüntüleyin (Arşiv) →
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
