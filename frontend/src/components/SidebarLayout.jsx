import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  UserCheck,
  History,
  Calendar,
  User,
  LogOut,
  ChevronRight,
  FileText
} from "lucide-react";

export default function SidebarLayout({ user, setUser, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isDoctor = user?.role === "doctor";

  const doctorNav = [
    { label: "Panel", path: "/doctor", icon: <LayoutDashboard size={18} /> },
    { label: "Hastalar", path: "/doctor/patients", icon: <Users size={18} /> },
    { label: "Takipli Hastalarım", path: "/doctor/tracked", icon: <UserCheck size={18} /> },
    { label: "Tüm Analiz Sonuçları", path: "/doctor/all-analyses", icon: <FileText size={18} /> },
    { label: "Randevular", path: "/appointments", icon: <Calendar size={18} /> }
  ];

  const patientNav = [
    { label: "Panel", path: "/patient", icon: <LayoutDashboard size={18} /> },
    { label: "Geçmiş Analizlerim", path: "/patient/history", icon: <History size={18} /> },
    { label: "Randevular", path: "/appointments", icon: <Calendar size={18} /> },
    { label: "Kişisel Bilgilerim", path: "/patient/profile", icon: <User size={18} /> }
  ];

  const navItems = isDoctor ? doctorNav : patientNav;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Top Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.85rem 2rem",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <Activity color="#0284c7" size={26} />
          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", fontFamily: "Outfit, sans-serif" }}>
            AI-SAĞLIK
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user && (
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#ffffff",
                color: "#0284c7",
                border: "1px solid #0284c7",
                padding: "0.45rem 1rem",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem"
              }}
            >
              <LogOut size={15} /> Çıkış Yap
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area with Left Sidebar */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar */}
        <aside
          style={{
            width: "260px",
            background: "#ffffff",
            borderRight: "1px solid #e2e8f0",
            padding: "1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}
        >
          {/* User Profile Card */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b"
              }}
            >
              <User size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                {user?.name || "Kullanıcı"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {isDoctor ? "Doktor" : "Hasta"}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.9rem",
                    background: active ? "#e0f2fe" : "transparent",
                    color: active ? "#0284c7" : "#475569",
                    borderLeft: active ? "4px solid #0284c7" : "4px solid transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Page View Container */}
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
