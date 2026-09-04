import { createContext, useState, useEffect } from "react";
import supabase from "../services/supabase";

const AuthContext = createContext(null);

function generateEstateCode(estateName = "EST") {
  const prefix = estateName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase() || "EST";
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
}

function saveSession(token, email, user) {
  if (token) {
    try {
      localStorage.setItem("token", token);
      sessionStorage.setItem("token", token);
    } catch (e) {
      void e;
    }
  }
  if (email) {
    try {
      localStorage.setItem("userEmail", email);
      sessionStorage.setItem("userEmail", email);
    } catch (e) {
      void e;
    }
  }
  if (user) {
    try {
      const userStr = JSON.stringify(user);
      localStorage.setItem("user", userStr);
      sessionStorage.setItem("user", userStr);
    } catch (e) {
      void e;
    }
  }
}

function clearSession() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("user");
  } catch (e) {
    void e;
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  } catch (e) {
    void e;
    return null;
  }
}

function getStoredUser() {
  try {
    const str = localStorage.getItem("user") || sessionStorage.getItem("user");
    return str ? JSON.parse(str) : null;
  } catch (e) {
    void e;
    return null;
  }
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    async function syncSession(session) {
      if (!session?.user) {
        clearSession();
        setUser(null);
        setIsAuthenticated(false);
        setUserLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, estates(id, name, code, description, location)")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          const enrichedUser = {
            ...profile,
            estate: profile.estates,
          };
          setUser(enrichedUser);
          setIsAuthenticated(true);
          saveSession(session.access_token, profile.email, enrichedUser);
        } else {
          const fallbackUser = {
            id: session.user.id,
            email: session.user.email,
            fullname: session.user.user_metadata?.fullname || session.user.email?.split("@")[0],
            role: session.user.user_metadata?.role || "resident",
            estate_id: session.user.user_metadata?.estate_id || null,
          };
          setUser(fallbackUser);
          setIsAuthenticated(true);
          saveSession(session.access_token, fallbackUser.email, fallbackUser);
        }
      } catch (err) {
        console.warn("Auth profile sync error:", err);
      } finally {
        setUserLoading(false);
      }
    }

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await syncSession(session);
        } else {
          const storedToken = getStoredToken();
          if (!storedToken) {
            clearSession();
            setUser(null);
            setIsAuthenticated(false);
          }
          setUserLoading(false);
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
        setUserLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          clearSession();
          setUser(null);
          setIsAuthenticated(false);
          setUserLoading(false);
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          await syncSession(session);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function loginUser(email, password) {
    try {
      setLoading(true);

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (authError) {
        throw new Error(authError.message);
      }

      const authUser = authData.user;
      const token = authData.session?.access_token;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*, estates(id, name, code, description, location)")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileError) {
        throw new Error("Unable to fetch user profile.");
      }

      let currentUser = profile;
      if (!currentUser) {
        const fallbackData = {
          id: authUser.id,
          fullname: authUser.user_metadata?.fullname || email.split("@")[0],
          email: authUser.email,
          role: "resident",
        };
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert([fallbackData])
          .select()
          .single();
        currentUser = newProfile;
      }

      const enrichedUser = {
        ...currentUser,
        estate: currentUser?.estates,
      };

      saveSession(token, email, enrichedUser);
      setUser(enrichedUser);
      setIsAuthenticated(true);

      return enrichedUser;
    } catch (err) {
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  }

  async function registerUser(userInfo) {
    try {
      setLoading(true);

      const cleanEmail = userInfo.email.trim().toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: userInfo.password,
        options: {
          data: {
            fullname: userInfo.fullname,
            role: "resident",
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const authUser = authData.user;
      const token = authData.session?.access_token || "auth-session-token";

      const profileData = {
        id: authUser.id,
        estate_id: userInfo.estate_id || null,
        role: "resident",
        fullname: userInfo.fullname.trim(),
        email: cleanEmail,
        phone: userInfo.phone ? userInfo.phone.trim() : null,
        street_id: userInfo.street_id || null,
        streetname: userInfo.streetname ? userInfo.streetname.trim() : null,
        property_type_id: userInfo.property_type_id || null,
        property_type_name: userInfo.property_type_name || null,
        housenumber: userInfo.housenumber ? String(userInfo.housenumber).trim() : null,
        apartment: userInfo.apartment ? userInfo.apartment.trim() : null,
        opening_balance: Number(userInfo.opening_balance) || 0,
        status: "Active",
      };

      const { data: createdProfile, error: profileError } = await supabase
        .from("profiles")
        .insert([profileData])
        .select("*, estates(id, name, code, description, location)")
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (userInfo.estate_id && userInfo.property_fee) {
        try {
          const monthName = new Date().toLocaleString("en-US", { month: "long" }).toLowerCase();
          const yearNum = String(new Date().getFullYear());
          const feeAmount = Number(userInfo.property_fee);

          await supabase.from("bills").insert([
            {
              estate_id: userInfo.estate_id,
              resident_id: authUser.id,
              month: monthName,
              year: yearNum,
              amount: feeAmount,
              description: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} Waste Collection`,
              status: "Unpaid",
            },
          ]);
        } catch (billError) {
          console.warn("Could not seed initial bill:", billError);
        }
      }

      const enrichedUser = {
        ...createdProfile,
        estate: createdProfile?.estates,
      };

      saveSession(token, cleanEmail, enrichedUser);
      setUser(enrichedUser);
      setIsAuthenticated(true);

      return enrichedUser;
    } catch (err) {
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  }

  async function registerAdmin(adminInfo) {
    try {
      setLoading(true);

      const cleanEmail = adminInfo.email.trim().toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: adminInfo.password,
        options: {
          data: {
            fullname: adminInfo.fullname,
            role: "admin",
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const authUser = authData.user;
      const token = authData.session?.access_token || "auth-session-token";

      let estateCode = generateEstateCode(adminInfo.estateName);

      const { data: createdEstate, error: estateError } = await supabase
        .from("estates")
        .insert([
          {
            name: adminInfo.estateName.trim(),
            code: estateCode,
            description: adminInfo.description?.trim() || null,
            location: adminInfo.location?.trim() || null,
            contact_email: cleanEmail,
            contact_phone: adminInfo.phone?.trim() || null,
          },
        ])
        .select()
        .single();

      if (estateError) {
        throw new Error(estateError.message);
      }

      try {
        await supabase.from("property_types").insert([
          { estate_id: createdEstate.id, name: "House", fee: 5000 },
          { estate_id: createdEstate.id, name: "Flat", fee: 4000 },
          { estate_id: createdEstate.id, name: "Shop", fee: 3000 },
          { estate_id: createdEstate.id, name: "Duplex", fee: 7000 },
        ]);
      } catch (seedErr) {
        console.warn("Could not seed default property types:", seedErr);
      }

      const profileData = {
        id: authUser.id,
        estate_id: createdEstate.id,
        role: "admin",
        fullname: adminInfo.fullname.trim(),
        email: cleanEmail,
        phone: adminInfo.phone ? adminInfo.phone.trim() : null,
        status: "Active",
      };

      const { data: createdProfile, error: profileError } = await supabase
        .from("profiles")
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      const enrichedUser = {
        ...createdProfile,
        estate: createdEstate,
      };

      saveSession(token, cleanEmail, enrichedUser);
      setUser(enrichedUser);
      setIsAuthenticated(true);

      return enrichedUser;
    } catch (err) {
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signout notice:", err);
    }
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
  }

  const contextData = {
    loginUser,
    registerUser,
    registerAdmin,
    logoutUser,
    isAuthenticated,
    loading,
    userLoading,
    user,
    setUser,
    role: user?.role || "resident",
    estateId: user?.estate_id || null,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
}

export default AuthContext;

