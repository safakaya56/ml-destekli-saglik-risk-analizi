import React from "react";
import { Link } from "react-router-dom";
import { HeartPulse, Activity, Brain, FileText, ArrowRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", padding: "3rem 1rem 2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#e0f2fe",
            color: "#0284c7",
            padding: "0.4rem 1.1rem",
            borderRadius: "30px",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "1.5rem"
          }}
        >
          <HeartPulse size={18} /> Klinik Karar Destek & Sağlık Analiz Sistemi
        </div>

        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.25rem", lineHeight: 1.25 }}>
          Yapay Zeka Destekli Sağlık Risk <br />
          <span style={{ color: "#0284c7" }}>Değerlendirme Platformu</span>
        </h1>

        <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: "680px", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
          Laboratuvar test sonuçlarınız ve sağlık göstergeleriniz ışığında Diyabet, Böbrek ve Kalp-Damar hastalık risklerinizi değerlendiren yapay zeka destekli platform.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#0284c7",
              color: "#ffffff",
              padding: "0.85rem 2rem",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)"
            }}
          >
            Sisteme Giriş Yap <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Clean Feature Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "2.5rem" }}>
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ background: "#e0f2fe", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", color: "#0284c7" }}>
            <Activity size={24} />
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>Kronik Hastalık Risk Analizi</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.55 }}>
            Diyabet, Böbrek ve Kalp-Damar sağlığınız için laboratuvar bulgularına dayalı değerlendirme.
          </p>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ background: "#e0f2fe", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", color: "#0284c7" }}>
            <Brain size={24} />
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>Kişiselleştirilmiş Klinik Tavsiye</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.55 }}>
            Yapay zeka tarafından oluşturulan, beslenme ve yaşam tarzı odaklı aksiyon önerileri.
          </p>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ background: "#e0f2fe", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", color: "#0284c7" }}>
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>Doktor Takip & Randevu Entegrasyonu</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.55 }}>
            Doktorunuzun takipli hastası olarak gelişmelerinizi paylaşın ve mesai saatlerinde randevu alın.
          </p>
        </div>
      </div>
    </div>
  );
}
