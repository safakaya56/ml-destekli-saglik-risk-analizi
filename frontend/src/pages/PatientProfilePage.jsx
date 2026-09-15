import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Mail, Calendar, Hash, Ruler, Weight, CheckCircle, AlertCircle, Save } from "lucide-react";

export default function PatientProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name: "",
    tcNo: "",
    age: 0,
    gender: 1,
    height: 0,
    weight: 0,
    smoking: 0,
    family_history_diabetes: 0,
    family_history_cvd: 0
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    let u = null;
    if (savedUser) {
      u = JSON.parse(savedUser);
      setUser(u);
    }
    fetchProfile(u);
  }, []);

  const fetchProfile = async (currentUser) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/patients/me/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const defaultName = data.name || (currentUser ? currentUser.name : "");
        setProfile({
          name: defaultName,
          tcNo: data.tcNo || "",
          age: data.age || 0,
          gender: data.gender !== undefined ? data.gender : 1,
          height: data.height || 0,
          weight: data.weight || 0,
          smoking: data.smoking !== undefined ? data.smoking : 0,
          family_history_diabetes: data.family_history_diabetes !== undefined ? data.family_history_diabetes : 0,
          family_history_cvd: data.family_history_cvd !== undefined ? data.family_history_cvd : 0
        });
      }
    } catch (err) {
      console.error("Profil yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/patients/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const savedData = await res.json();
        const savedUserStr = localStorage.getItem("user");
        if (savedUserStr && savedData.name) {
          const uObj = JSON.parse(savedUserStr);
          uObj.name = savedData.name;
          localStorage.setItem("user", JSON.stringify(uObj));
        }
        setMessage("Kişisel ve anamnez bilgileriniz başarıyla güncellendi.");
        setTimeout(() => setMessage(""), 4000);
      } else {
        setError("Profil güncellenemedi.");
      }
    } catch (err) {
      setError("Sunucu hatası oluştu.");
    }
  };

  const isProfileComplete = profile.age > 0 && profile.height > 0 && profile.weight > 0 && profile.tcNo;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Kişisel & Anamnez Bilgilerim</h1>
        <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
          Doktorunuzun Klinik Karar Destek Sistemi üzerinden risk analizi yapabilmesi için kişisel bilgilerinizi eksiksiz doldurunuz.
        </p>
      </div>

      {message && (
        <div style={{ background: "#dcfce7", color: "#15803d", padding: "0.85rem 1rem", borderRadius: "10px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.85rem 1rem", borderRadius: "10px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {(!isProfileComplete || window.location.search.includes("new=true")) && !loading && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", padding: "1.25rem 1.5rem", borderRadius: "12px", marginBottom: "1.5rem", fontSize: "0.9rem", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <AlertCircle size={24} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ fontSize: "0.95rem", display: "block", marginBottom: "0.25rem", color: "#92400e" }}>
              ZORUNLU BİLGİ GİRİŞİ BİLDİRİMİ
            </strong>
            Doktorunuzun Klinik Karar Destek Sistemi üzerinden kan tahlili verilerinizi ve kronik hastalık risklerinizi doğru analiz edebilmesi için lütfen aşağıda yer alan <strong>T.C. Kimlik No, Yaş, Boy, Kilo, Sigara Kullanımı ve Aile Öyküsü</strong> bilgilerinizi eksiksiz doldurup kaydediniz.
          </div>
        </div>
      )}

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Ad Soyad</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>T.C. Kimlik Numarası</label>
              <input
                type="text"
                required
                value={profile.tcNo}
                onChange={(e) => setProfile({ ...profile, tcNo: e.target.value })}
                placeholder="11111111111"
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Yaş</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={profile.age || ""}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                placeholder="Örn: 45"
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Cinsiyet</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              >
                <option value={1}>Erkek</option>
                <option value={0}>Kadın</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Boy (cm)</label>
              <input
                type="number"
                required
                min="50"
                max="230"
                value={profile.height || ""}
                onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                placeholder="Örn: 175"
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Kilo (kg)</label>
              <input
                type="number"
                required
                min="20"
                max="300"
                value={profile.weight || ""}
                onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                placeholder="Örn: 75"
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Sigara Kullanımı (Anamnez)</label>
              <select
                value={profile.smoking}
                onChange={(e) => setProfile({ ...profile, smoking: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              >
                <option value={0}>Kullanmıyor / Hiç İçmedi</option>
                <option value={1}>Aktif veya Eski Kullanıcı (100+ Sigara)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Ailede Kalp Krizi / Felç Öyküsü</label>
              <select
                value={profile.family_history_cvd}
                onChange={(e) => setProfile({ ...profile, family_history_cvd: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              >
                <option value={0}>Yok (1. Derece Yakınlarda)</option>
                <option value={1}>Var (Anne, Baba veya Kardeşte)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Ailede Diyabet Öyküsü</label>
              <select
                value={profile.family_history_diabetes}
                onChange={(e) => setProfile({ ...profile, family_history_diabetes: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              >
                <option value={0}>Yok (1. Derece Yakınlarda)</option>
                <option value={1}>Var (Anne, Baba veya Kardeşte)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "1rem",
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              padding: "0.75rem 1.75rem",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
            }}
          >
            <Save size={18} /> Bilgilerimi Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}
