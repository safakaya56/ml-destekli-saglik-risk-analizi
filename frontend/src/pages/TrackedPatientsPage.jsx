import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, PlusCircle, UserX, AlertCircle } from "lucide-react";

export default function TrackedPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchTrackedPatients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/patients/tracked", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Takipli hastalar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackedPatients();
  }, []);

  const handleUntrack = async (patientId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/patients/${patientId}/untrack`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Hasta takipli listenizden çıkarıldı.");
        fetchTrackedPatients();
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (err) {
      console.error("Takip çıkarılırken hata:", err);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(patients.length / itemsPerPage) || 1;
  const currentPatients = patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Takipli Hastalarım</h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Sadece takibinize aldığınız hastalara kan testi girişi yapabilirsiniz.
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.85rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
          <AlertCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Patient Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Hastalar yükleniyor...</div>
        ) : patients.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <UserCheck size={36} color="#cbd5e1" style={{ marginBottom: "0.5rem" }} />
            <div>Henüz takibe aldığınız bir hasta bulunmamaktadır.</div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.3rem" }}>"Hastalar" sekmesinden hasta takibe alabilirsiniz.</div>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>HASTA</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>T.C. KİMLİK NO</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>YAŞ / CİNSİYET</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>SON KAN TESTİ</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem", textAlign: "right" }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((patient) => (
                  <tr key={patient._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#0f172a" }}>
                      {patient.name}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#475569" }}>
                      {patient.tcNo || "Girilmedi"}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#475569" }}>
                      {patient.age ? `${patient.age} Yaş` : "-"} / {patient.gender || "-"}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#475569", fontSize: "0.85rem" }}>
                      {patient.latestLabDate ? new Date(patient.latestLabDate).toLocaleDateString("tr-TR") : "Henüz Test Yok"}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => navigate(`/doctor/lab-entry/${patient._id}`)}
                        style={{
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          padding: "0.5rem 0.85rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem"
                        }}
                      >
                        <PlusCircle size={15} /> Kan Testi Ekle
                      </button>
                      <button
                        onClick={() => handleUntrack(patient._id)}
                        style={{
                          background: "#fef2f2",
                          color: "#ef4444",
                          border: "1px solid #fca5a5",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem"
                        }}
                      >
                        <UserX size={15} /> Takibi Bırak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {patients.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Toplam {patients.length} kayıttan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, patients.length)} arası gösteriliyor
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
          </>
        )}
      </div>
    </div>
  );
}
