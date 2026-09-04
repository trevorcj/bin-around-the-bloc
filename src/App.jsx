import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import useAuth from "./hooks/useAuth.js";

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

function App() {
  const { isAuthenticated, user, userLoading } = useAuth();

  if (userLoading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Toaster />

      <ReactQueryDevtools initialIsOpen={false} />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/" element={<Layout user={user} />}>
            <Route index element={<Dashboard user={user} />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/history" element={<History />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/receipts/:id" element={<Receipts />} />
            <Route path="/support" element={<Support />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
