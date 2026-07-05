import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

const ArchitecturePage = lazy(() => import("@/pages/ArchitecturePage").then((module) => ({ default: module.ArchitecturePage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const DigitalTwinPage = lazy(() => import("@/pages/DigitalTwinPage").then((module) => ({ default: module.DigitalTwinPage })));
const ExplainableAIPage = lazy(() => import("@/pages/ExplainableAIPage").then((module) => ({ default: module.ExplainableAIPage })));
const FleetPage = lazy(() => import("@/pages/FleetPage").then((module) => ({ default: module.FleetPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const MonitoringPage = lazy(() => import("@/pages/MonitoringPage").then((module) => ({ default: module.MonitoringPage })));
const PriorityPage = lazy(() => import("@/pages/PriorityPage").then((module) => ({ default: module.PriorityPage })));
const RecommendationsPage = lazy(() => import("@/pages/RecommendationsPage").then((module) => ({ default: module.RecommendationsPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const SimulatorPage = lazy(() => import("@/pages/SimulatorPage").then((module) => ({ default: module.SimulatorPage })));
const VehicleDetailsPage = lazy(() => import("@/pages/VehicleDetailsPage").then((module) => ({ default: module.VehicleDetailsPage })));

function Protected() {
  const authed = localStorage.getItem("vehisense:auth") === "true";
  return authed ? <AppShell /> : <Navigate to="/login" replace />;
}

function PageFallback() {
  return <div className="min-h-screen bg-background" />;
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Protected />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/fleet/:vehicleId" element={<VehicleDetailsPage />} />
          <Route path="/digital-twin" element={<DigitalTwinPage />} />
          <Route path="/explainable-ai" element={<ExplainableAIPage />} />
          <Route path="/priority" element={<PriorityPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
