import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { Calendar as CalendarIcon, Clock, Plus, AlertCircle, CheckCircle } from "lucide-react";

export default function AppointmentsPage() {
  const [searchParams] = useSearchParams();
  const preselectPatientId = searchParams.get("patientId");

  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [trackedPatients, setTrackedPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(!!preselectPatientId);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectPatientId || "");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const [note, setNote] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch appointments via central API service
      const appRes = await api.get("/appointments");
      setAppointments(appRes.data || []);

      // 2. If user is doctor, fetch tracked patients for dropdown
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (savedUser.role === "doctor") {
        const patRes = await api.get("/patients/tracked");
        setTrackedPatients(patRes.data || []);
      }
    } catch (err) {
      console.error("Veriler çekilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedPatientId) {
      setFormError("Lütfen bir hasta seçiniz.");
      return;
    }
    if (!appointmentDate || !appointmentTime) {
      setFormError("Lütfen tarih ve saat giriniz.");
      return;
    }

    try {
      const res = await api.post("/appointments", {
        patientId: selectedPatientId,
        date: appointmentDate,
        time: appointmentTime,
        note
      });

      setFormSuccess("Randevu başarıyla oluşturuldu.");
      fetchData();
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
        setNote("");
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || "Randevu oluşturulamadı.");
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Durum güncellenirken hata:", err);
    }
  };

  const isDoctor = user?.role === "doctor";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Randevular</h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            {isDoctor
              ? "Takipli hastalarınız için verdiğiniz randevuları buradan yönetebilirsiniz."
              : "Yaklaşan ve geçmiş doktor randevularınız."}
          </p>
        </div>
        {isDoctor && (
          <button
            onClick={() => {
              setFormError("");
              setFormSuccess("");
              setShowModal(true);
            }}
            style={{
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              padding: "0.6rem 1.25rem",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Plus size={18} /> Yeni Randevu Ver
          </button>
        )}
      </div>

      {/* Appointment Creation Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem 0" }}>
              Yeni Randevu Oluştur
            </h2>

            {formError && (
              <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {formSuccess && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CheckCircle size={16} /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                  Takipli Hasta
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                >
                  <option value="">Hasta Seçiniz...</option>
                  {trackedPatients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (TC: {p.tcNo || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                  Randevu Tarihi (Sadece Hafta İçi)
                </label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                  Randevu Saati (Mesai Saatleri: 09:00 - 17:00)
                </label>
                <input
                  type="time"
                  required
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                  Not / Açıklama (İsteğe Bağlı)
                </label>
                <textarea
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Randevu nedeni veya klinik not..."
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none", background: "#0284c7", color: "#ffffff", fontWeight: 600, cursor: "pointer" }}
                >
                  Randevuyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Randevular yükleniyor...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <CalendarIcon size={36} color="#cbd5e1" style={{ marginBottom: "0.5rem" }} />
            <div>Kayıtlı randevu bulunamadı.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>
                  {isDoctor ? "HASTA" : "DOKTOR"}
                </th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>TARİH & SAAT</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>NOT</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>DURUM</th>
                <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem", textAlign: "right" }}>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => {
                const patientName = app.patientId?.name || app.patientName || "Hasta";
                const doctorName = app.doctorId?.name || app.doctorName || "Doktor";

                return (
                  <tr key={app._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#0f172a" }}>
                      {isDoctor ? patientName : `Dr. ${doctorName}`}
                    </td>
                  <td style={{ padding: "1rem 1.25rem", color: "#475569" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, color: "#0f172a" }}>
                      <CalendarIcon size={15} color="#0284c7" />
                      {new Date(app.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
                      <Clock size={13} /> {app.time}
                    </div>
                  </td>
                  <td style={{ padding: "1rem 1.25rem", color: "#64748b", fontSize: "0.85rem" }}>
                    {app.note || "-"}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    {app.status === "scheduled" && (
                      <span style={{ background: "#e0f2fe", color: "#0284c7", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                        Planlandı
                      </span>
                    )}
                    {app.status === "completed" && (
                      <span style={{ background: "#dcfce7", color: "#15803d", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                        Tamamlandı
                      </span>
                    )}
                    {app.status === "cancelled" && (
                      <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                        İptal Edildi
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                    {app.status === "scheduled" && (
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                        {isDoctor && (
                          <button
                            onClick={() => handleUpdateStatus(app._id, "completed")}
                            title="Tamamlandı İşaretle"
                            style={{ background: "#dcfce7", color: "#15803d", border: "none", padding: "0.4rem 0.65rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                          >
                            Tamamla
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(app._id, "cancelled")}
                          title="Randevuyu İptal Et"
                          style={{ background: "#fee2e2", color: "#b91c1c", border: "none", padding: "0.4rem 0.65rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          İptal Et
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
