import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Activity, Lock, Mail, User } from "lucide-react";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("doctor");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    tcNo: ""
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("rememberedUser");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) setFormData((prev) => ({ ...prev, email: parsed.email, password: parsed.password || "" }));
        if (parsed.role) setRole(parsed.role);
      } catch (e) {
        localStorage.removeItem("rememberedUser");
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister ? { ...formData, role } : { email: formData.email, password: formData.password, role };
      
      const res = await api.post(endpoint, payload);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (rememberMe && !isRegister) {
        localStorage.setItem("rememberedUser", JSON.stringify({ email: formData.email, password: formData.password, role }));
      } else if (!rememberMe) {
        localStorage.removeItem("rememberedUser");
      }

      setUser(user);

      if (user.role === "doctor") {
        navigate("/doctor");
      } else if (isRegister) {
        navigate("/patient/profile?new=true");
      } else {
        navigate("/patient");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Giriş işlemi başarısız.");
    }
  };

  return (
    <div style={{ maxWidth: "440px", margin: "3rem auto", padding: "0 1rem" }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "2.5rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
            <Activity size={26} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.35rem" }}>
            {isRegister ? "Hesap Oluştur" : "Sisteme Giriş Yap"}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
            AI-Sağlık Platformuna Doktor veya Hasta olarak erişin.
          </p>
        </div>

        {/* Role Switcher */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <button
            type="button"
            onClick={() => setRole("doctor")}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "9px",
              border: "none",
              background: role === "doctor" ? "#0284c7" : "transparent",
              color: role === "doctor" ? "#ffffff" : "#64748b",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Doktor Girişi
          </button>
          <button
            type="button"
            onClick={() => setRole("patient")}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "9px",
              border: "none",
              background: role === "patient" ? "#0284c7" : "transparent",
              color: role === "patient" ? "#ffffff" : "#64748b",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Hasta Girişi
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.85rem 1rem", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "1.25rem", textAlign: "left", fontWeight: 600, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {isRegister && (
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Ad Soyad</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ahmet Yılmaz"
                style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>E-posta Adresi</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@hastane.com"
              style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>Şifre</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {!isRegister && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginTop: "-0.2rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#0284c7", cursor: "pointer" }}
                />
                <span style={{ fontWeight: 500, color: "#334155" }}>Beni Hatırla</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            style={{
              marginTop: "0.5rem",
              padding: "0.85rem",
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
            }}
          >
            {isRegister ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
          >
            {isRegister ? "Zaten hesabınız var mı? Giriş Yapın" : "Hesabınız yok mu? Kayıt Olun"}
          </button>
        </div>
      </div>
    </div>
  );
}
