import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, LogOut, User as UserIcon } from "lucide-react";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 2rem",
      background: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "#f8fafc" }}>
        <Activity color="#0284c7" size={28} />
        <span style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>
          AI SAĞLIK <span style={{ color: "#0284c7" }}>RİSK ANALİZİ</span>
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.9rem" }}>
              <UserIcon size={18} />
              <span>{user.name} ({user.role === "doctor" ? "Doktor" : "Hasta"})</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(244, 63, 94, 0.15)",
                color: "#fb7185",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem"
              }}
            >
              <LogOut size={16} /> Çıkış Yap
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              background: "#0284c7",
              color: "#ffffff",
              padding: "0.5rem 1.25rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem"
            }}
          >
            Giriş Yap
          </Link>
        )}
      </div>
    </nav>
  );
}
