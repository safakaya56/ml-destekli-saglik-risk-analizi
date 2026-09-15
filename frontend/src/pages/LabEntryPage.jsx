import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TestTube, Play, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

export default function LabEntryPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [labData, setLabData] = useState({
    title: "Full Panel Kan Sayımı & Biyokimya",
    systolic_bp: "",
    diastolic_bp: "",
    glucose: "",
    hba1c: "",
    total_cholesterol: "",
    hdl: "",
    triglycerides: "",
    ldl: "",
    creatinine: "",
    bun: ""
  });

  useEffect(() => {
    const fetchPatientInfo = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5000/api/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        } else {
          setError("Hasta bilgisi alınamadı veya bu hastaya veri girme yetkiniz yok (Takipli hastanız olmalıdır).");
        }
      } catch (err) {
        setError("Sunucu bağlantı hatası.");
      }
    };
    if (patientId) fetchPatientInfo();
  }, [patientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      // 1. Create Lab Test Entry
      const labRes = await fetch(`http://localhost:5000/api/patients/${patientId}/labs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(labData)
      });

      if (!labRes.ok) {
        const errData = await labRes.json();
        throw new Error(errData.message || "Laboratuvar testi kaydedilemedi.");
      }
      const savedLab = await labRes.json();

      // 2. Trigger Clinical AI Analysis directly from Doctor CDSS
      const analysisRes = await fetch("http://localhost:5000/api/analysis/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: patientId,
          labTestId: savedLab._id
        })
      });

      setSuccessMsg("Kan testi kaydedildi ve Klinik AI Risk Analizi başarıyla çalıştırıldı!");
      setTimeout(() => {
        navigate("/doctor");
      }, 1500);
    } catch (err) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "850px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/doctor/tracked")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "none",
          border: "none",
          color: "#0284c7",
          cursor: "pointer",
          marginBottom: "1.25rem",
          fontSize: "0.9rem",
          fontWeight: 600
        }}
      >
        <ArrowLeft size={16} /> Takipli Hastalarıma Dön
      </button>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ background: "#e0f2fe", padding: "0.75rem", borderRadius: "12px", color: "#0284c7" }}>
            <TestTube size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Kan Testi Sonucu Girişi
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0 0" }}>
              {patient ? `Hasta: ${patient.name} (T.C.: ${patient.tcNo || "-"})` : "Takipli hastanız için biyokimya verilerini girin."}
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.85rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500, fontSize: "0.9rem" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "0.85rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500, fontSize: "0.9rem" }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Test Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
              Test Başlığı / Tanımı
            </label>
            <input
              type="text"
              required
              value={labData.title}
              onChange={(e) => setLabData({ ...labData, title: e.target.value })}
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Blood Pressure Group */}
          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0284c7", margin: "0 0 0.85rem 0" }}>Kan Basıncı Değerleri</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>Sistolik Kan Basıncı (mmHg)</label>
                <input
                  type="number"
                  min="70"
                  max="250"
                  step="1"
                  placeholder="70-250"
                  required
                  value={labData.systolic_bp}
                  onChange={(e) => setLabData({ ...labData, systolic_bp: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>Diyastolik Kan Basıncı (mmHg)</label>
                <input
                  type="number"
                  min="40"
                  max="150"
                  step="1"
                  placeholder="40-150"
                  required
                  value={labData.diastolic_bp}
                  onChange={(e) => setLabData({ ...labData, diastolic_bp: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
            </div>
          </div>

          {/* Glycemic Group */}
          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0284c7", margin: "0 0 0.85rem 0" }}>Glisemik Göstergeler</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>Açlık Kan Şekeri (Glucose - mg/dL)</label>
                <input
                  type="number"
                  min="40"
                  max="500"
                  step="1"
                  placeholder="40-500"
                  required
                  value={labData.glucose}
                  onChange={(e) => setLabData({ ...labData, glucose: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>HbA1c (%)</label>
                <input
                  type="number"
                  min="3.0"
                  max="18.0"
                  step="0.1"
                  placeholder="3.0-18.0"
                  required
                  value={labData.hba1c}
                  onChange={(e) => setLabData({ ...labData, hba1c: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
            </div>
          </div>

          {/* Lipid Group */}
          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0284c7", margin: "0 0 0.85rem 0" }}>Lipid Paneli</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>Toplam Kolesterol (mg/dL)</label>
                <input
                  type="number"
                  min="80"
                  max="500"
                  step="1"
                  placeholder="80-500"
                  required
                  value={labData.total_cholesterol}
                  onChange={(e) => setLabData({ ...labData, total_cholesterol: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>HDL Kolesterol (mg/dL)</label>
                <input
                  type="number"
                  min="10"
                  max="150"
                  step="1"
                  placeholder="10-150"
                  required
                  value={labData.hdl}
                  onChange={(e) => setLabData({ ...labData, hdl: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>LDL Kolesterol (mg/dL)</label>
                <input
                  type="number"
                  min="20"
                  max="400"
                  step="1"
                  placeholder="20-400"
                  required
                  value={labData.ldl}
                  onChange={(e) => setLabData({ ...labData, ldl: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>Trigliserid (mg/dL)</label>
                <input
                  type="number"
                  min="30"
                  max="1000"
                  step="1"
                  placeholder="30-1000"
                  required
                  value={labData.triglycerides}
                  onChange={(e) => setLabData({ ...labData, triglycerides: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
            </div>
          </div>

          {/* Renal Group */}
          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0284c7", margin: "0 0 0.85rem 0" }}>Böbrek Fonksiyon Göstergeleri</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>Serum Kreatinin (mg/dL)</label>
                <input
                  type="number"
                  min="0.2"
                  max="15.0"
                  step="0.01"
                  placeholder="0.2-15.0"
                  required
                  value={labData.creatinine}
                  onChange={(e) => setLabData({ ...labData, creatinine: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "0.25rem" }}>BUN (Kan Üre Azotu - mg/dL)</label>
                <input
                  type="number"
                  min="2.0"
                  max="100.0"
                  step="0.1"
                  placeholder="2.0-100.0"
                  required
                  value={labData.bun}
                  onChange={(e) => setLabData({ ...labData, bun: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
              padding: "0.85rem 1.5rem",
              background: loading ? "#94a3b8" : "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            <Play size={18} /> {loading ? "Test Kaydediliyor..." : "Kan Testini Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
