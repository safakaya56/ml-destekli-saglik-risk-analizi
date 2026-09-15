import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import RiskCard from "../components/RiskCard";
import ShapFactorsList from "../components/ShapFactorsList";
import { Download, Brain, FileText, ArrowLeft, AlertCircle } from "lucide-react";

export default function AnalysisResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const res = await api.get(`/analysis/${id}`);
      setAnalysis(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get(`/analysis/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Health_Risk_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("PDF indirme hatası oluştu.");
    }
  };

  if (loading) {
    return <div style={{ color: "#94a3b8", textAlign: "center", padding: "4rem" }}>Analiz sonuçları yükleniyor...</div>;
  }

  if (!analysis) {
    return <div style={{ color: "#fb7185", textAlign: "center", padding: "4rem" }}>Analiz kaydı bulunamadı.</div>;
  }

  const patient = analysis.patientId || {};
  const lab = analysis.labTestId || {};
  const preds = analysis.predictions || {};
  const shap = analysis.shapExplanations || {};
  const summary = analysis.llmSummary || {};

  return (
    <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem 4rem" }}>
      {/* Navigation & Actions Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "0.9rem" }}
        >
          <ArrowLeft size={16} /> Geri Dön
        </button>

        <button
          onClick={handleDownloadPDF}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#34d399",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <Download size={16} /> Klinik PDF Raporu İndir
        </button>
      </div>

      {/* Patient Overview Header */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", color: "#f8fafc" }}>{patient.name || "Hasta Analizi"}</h2>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.25rem" }}>
              Yaş: {patient.age} | Cinsiyet: {patient.gender === 1 ? "Erkek" : "Kadın"} | BMI: {patient.bmi} kg/m² | T.C.: {patient.tcNo || "N/A"}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#64748b" }}>
            Analiz Tarihi: {new Date(analysis.createdAt).toLocaleString("tr-TR")}
          </div>
        </div>
      </div>

      {/* 3 Disease Risk Cards */}
      <h3 style={{ fontSize: "1.2rem", color: "#f8fafc", marginBottom: "1rem" }}>Yapay Zeka Risk Paneli</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <RiskCard targetKey="diabetes" data={preds.diabetes} />
        <RiskCard targetKey="cardiovascular" data={preds.cardiovascular} />
        <RiskCard targetKey="kidney" data={preds.kidney} />
      </div>

      {/* SHAP Explanations Section */}
      <h3 style={{ fontSize: "1.2rem", color: "#f8fafc", marginBottom: "1rem" }}>Model Açıklanabilirliği (SHAP Faktörleri)</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <h4 style={{ fontSize: "1rem", color: "#06b6d4", marginBottom: "0.75rem" }}>Diyabet Risk Etkenleri</h4>
          <ShapFactorsList factors={shap.diabetes} />
        </div>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <h4 style={{ fontSize: "1rem", color: "#fb7185", marginBottom: "0.75rem" }}>Kardiyovasküler Risk Etkenleri</h4>
          <ShapFactorsList factors={shap.cardiovascular} />
        </div>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <h4 style={{ fontSize: "1rem", color: "#fbbf24", marginBottom: "0.75rem" }}>Böbrek Risk Etkenleri</h4>
          <ShapFactorsList factors={shap.kidney} />
        </div>
      </div>

      {/* Gemini LLM Summary Section */}
      <div className="glass-card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <Brain color="#0284c7" size={26} />
          <h3 style={{ fontSize: "1.25rem", color: "#f8fafc" }}>AI Klinik Karar Destek Özeti</h3>
        </div>

        <p style={{ color: "#e2e8f0", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          {summary.summary}
        </p>

        {summary.findings && summary.findings.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h4 style={{ fontSize: "0.9rem", color: "#38bdf8", marginBottom: "0.5rem" }}>Temel Klinik Bulgular:</h4>
            <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {summary.findings.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        {summary.recommendations && summary.recommendations.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.9rem", color: "#34d399", marginBottom: "0.5rem" }}>Öneriler & Takip:</h4>
            <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {summary.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", padding: "0.75rem 1rem", borderRadius: "8px", color: "#fb7185", fontSize: "0.8rem" }}>
          <AlertCircle size={18} />
          <span>{summary.disclaimer || "Bu sistem kesin tıbbi tanı iddiasında bulunmaz. Karar destek prototipidir."}</span>
        </div>
      </div>
    </div>
  );
}
