import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import SidebarLayout from "./components/SidebarLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientPanel from "./pages/PatientPanel";
import AllPatientsPage from "./pages/AllPatientsPage";
import TrackedPatientsPage from "./pages/TrackedPatientsPage";
import AllAnalysesPage from "./pages/AllAnalysesPage";
import LabEntryPage from "./pages/LabEntryPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AnalysisHistoryPage from "./pages/AnalysisHistoryPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import AnalysisResultPage from "./pages/AnalysisResultPage";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />

        {/* Doctor Routes */}
        <Route
          path="/doctor"
          element={
            user && user.role === "doctor" ? (
              <SidebarLayout user={user} setUser={setUser}>
                <DoctorDashboard />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/doctor/dashboard" element={<Navigate to="/doctor" replace />} />
        <Route
          path="/doctor/patients"
          element={
            user && user.role === "doctor" ? (
              <SidebarLayout user={user} setUser={setUser}>
                <AllPatientsPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/doctor/tracked"
          element={
            user && user.role === "doctor" ? (
              <SidebarLayout user={user} setUser={setUser}>
                <TrackedPatientsPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/doctor/all-analyses"
          element={
            user && user.role === "doctor" ? (
              <SidebarLayout user={user} setUser={setUser}>
                <AllAnalysesPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/doctor/lab-entry/:patientId"
          element={
            user && user.role === "doctor" ? (
              <SidebarLayout user={user} setUser={setUser}>
                <LabEntryPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Patient Routes */}
        <Route
          path="/patient"
          element={
            user && user.role === "patient" ? (
              <SidebarLayout user={user} setUser={setUser}>
                <PatientPanel user={user} />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient/history"
          element={
            user ? (
              <SidebarLayout user={user} setUser={setUser}>
                <AnalysisHistoryPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient/profile"
          element={
            user ? (
              <SidebarLayout user={user} setUser={setUser}>
                <PatientProfilePage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Shared Authenticated Routes */}
        <Route
          path="/appointments"
          element={
            user ? (
              <SidebarLayout user={user} setUser={setUser}>
                <AppointmentsPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/analysis/result/:id"
          element={
            user ? (
              <SidebarLayout user={user} setUser={setUser}>
                <AnalysisResultPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
