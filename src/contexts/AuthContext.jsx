import { createContext, useState } from "react";
import axios from "axios";
import manta from "../services/manta";

const AuthContext = createContext(null);

// Axios Initialization
const api = axios.create({
  baseURL: "https://api.mantahq.com/api/workflow/trevor/bin-around-the-bloc",
});

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem("token"),
  );
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
  });

  // LOGIN
  async function loginUser(email, password) {
    try {
      setLoading(true);

      // Authenticate User
      const res = await api.post("/auth/login", { email, password });

      // Get token
      const token = res?.data?.token;

      // Fetch user
      const { data } = await manta.fetchOneRecord({
        table: "batb-users",
        where: { email: email },
      });

      const currentUser = data?.data;

      // Save to sessionStorage
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("user", JSON.stringify(currentUser));

      // Update state
      setUser(currentUser);

      setIsAuthenticated(true);
    } catch (err) {
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  }

  // SIGNUP / REGISTER
  async function registerUser(userInfo) {
    try {
      setLoading(true);

      // Create account
      const res = await api.post("/auth/signup", userInfo);

      // Get token
      const token = res?.data?.token;

      // Fetch newly created user
      const { data } = await manta.fetchOneRecord({
        table: "batb-users",
        where: {
          email: userInfo.email,
        },
      });

      const currentUser = data?.data;

      // Save to sessionStorage
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userEmail", userInfo?.email);
      sessionStorage.setItem("user", JSON.stringify(currentUser));

      // Update state
      setUser(currentUser);

      setIsAuthenticated(true);
    } catch (err) {
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  }

  // LOGOUT
  async function logoutUser() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  }

  const contextData = {
    loginUser,
    registerUser,
    logoutUser,
    isAuthenticated,
    loading,
    user,
    setUser,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
}

export default AuthContext;
