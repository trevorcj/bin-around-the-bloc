import { Toaster } from "react-hot-toast";
import { Route, Routes, Navigate, useParams } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import useAuth from "./hooks/useAuth.js";

import Home from "./pages/Home.jsx";
import Layout from "./ui/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";
import Receipts from "./pages/Receipts.jsx";
import Support from "./pages/Support.jsx";
import Payment from "./pages/Payment.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import AdminSignup from "./pages/admin/AdminSignup.jsx";
import AdminLayout from "./ui/admin/AdminLayout.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminResidents from "./pages/admin/AdminResidents.jsx";
import AdminPayments from "./pages/admin/AdminPayments.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

function ReceiptParamRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/receipts/${id}`} replace />;
}

function App() {
  const { isAuthenticated, user, userLoading } = useAuth();

  if (userLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-accent/20 border-t-brand-primary" />
          <p className="text-sm font-medium text-brand-accent/60">Loading Bin Around The Bloc'...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />

      <ReactQueryDevtools initialIsOpen={false} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/signup" element={<AdminSignup />} />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} allowedRole="resident" />}>
          <Route path="/app" element={<Layout user={user} />}>
            <Route index element={<Dashboard user={user} />} />
            <Route path="payment" element={<Payment />} />
            <Route path="history" element={<History />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="receipts/:id" element={<Receipts />} />
            <Route path="support" element={<Support />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/payment" element={<Navigate to="/app/payment" replace />} />
        <Route path="/history" element={<Navigate to="/app/history" replace />} />
        <Route path="/receipts" element={<Navigate to="/app/receipts" replace />} />
        <Route path="/receipts/:id" element={<ReceiptParamRedirect />} />
        <Route path="/support" element={<Navigate to="/app/support" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} allowedRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="residents" element={<AdminResidents />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
