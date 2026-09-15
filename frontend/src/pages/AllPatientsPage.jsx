import React, { useState, useEffect } from "react";
import { Search, UserCheck, UserPlus, CheckCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";

export default function AllPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchPatients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Hastalar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleTrackPatient = async (patientId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/patients/${patientId}/track`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Hasta takipli hastalar listene başarıyla eklendi.");
        fetchPatients();
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (err) {
      console.error("Hasta takibe alınırken hata:", err);
    }
  };

  const filtered = patients.filter((p) =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.tcNo || "").includes(searchTerm)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedPatients = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Genel Hasta Havuzu</h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Henüz bir doktora atanmamış hastalar. Takibe aldığınız hasta genel havuzdan çıkarılarak doğrudan sizin <strong>"Takipli Hastalarım"</strong> listenize aktarılır.
          </p>
        </div>
      </div>

      {/* Top Clinical Info Banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1.25rem", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 500 }}>
        <Info size={18} color="#1d4ed8" />
        <span><strong>Bilgilendirme:</strong> Hastayı takipli hastalarınız arasına alırken ilgili birimin onayı dahilinde alınız.</span>
      </div>

      {message && (
        <div style={{ background: "#dcfce7", color: "#15803d", padding: "0.85rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          type="text"
          placeholder="Hasta Adı veya T.C. Kimlik No ile Ara..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "0.75rem 1rem 0.75rem 2.8rem",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "0.95rem",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* Patient Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Hastalar yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", color: "#64748b" }}>
            <UserCheck size={38} color="#0284c7" style={{ marginBottom: "0.75rem" }} />
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Takibe alınacak hasta bulunmamaktadır
            </h4>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>HASTA</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>T.C. KİMLİK NO</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>YAŞ / CİNSİYET</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem" }}>DURUM</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#475569", fontWeight: 600, fontSize: "0.85rem", textAlign: "right" }}>İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
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
                    <td style={{ padding: "1rem 1.25rem" }}>
                      {patient.isTrackedByMe ? (
                        <span style={{ background: "#e0f2fe", color: "#0284c7", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <UserCheck size={14} /> Takipli Hastanız
                        </span>
                      ) : (
                        <span style={{ background: "#f1f5f9", color: "#64748b", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 500 }}>
                          Genel Liste
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      {patient.isTrackedByMe ? (
                        <button
                          disabled
                          style={{
                            background: "#f1f5f9",
                            color: "#94a3b8",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "not-allowed"
                          }}
                        >
                          Takipte
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTrackPatient(patient._id)}
                          style={{
                            background: "#0284c7",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem"
                          }}
                        >
                          <UserPlus size={15} /> Takibe Al
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls (10 items/page) */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.25rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.85rem", color: "#64748b" }}>
                <div>Toplam <strong>{filtered.length}</strong> hastadan <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> arası gösteriliyor</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    <ChevronLeft size={14} /> Önceki
                  </button>
                  <span style={{ fontWeight: 700, color: "#0f172a", padding: "0 0.4rem" }}>
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1, fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    Sonraki <ChevronRight size={14} />
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
