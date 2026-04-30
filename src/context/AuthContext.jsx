import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => {
    // Load cached role instantly — no DB call needed on first render
    return localStorage.getItem("userRole") || null;
  });
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const loadProfile = async (userId) => {
    try {
      // Check cache first
      const cachedRole = localStorage.getItem("userRole");
      if (cachedRole) {
        setRole(cachedRole);
        // Still fetch in background to ensure it's fresh
        supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.role && data.role !== cachedRole) {
              setRole(data.role);
              localStorage.setItem("userRole", data.role);
            }
          });
        return;
      }

      // No cache — fetch from DB
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      const userRole = data?.role || null;
      setRole(userRole);
      if (userRole) localStorage.setItem("userRole", userRole);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Failed to load profile:", err.message);
      }
      setRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        // No session — clear cache
        localStorage.removeItem("userRole");
        setRole(null);
      }
      setLoading(false);
      initializedRef.current = true;
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          localStorage.removeItem("userRole");
          setLoading(false);
          return;
        }

        if (event === "SIGNED_IN" && initializedRef.current && session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err.message);
    } finally {
      setUser(null);
      setRole(null);
      localStorage.removeItem("userRole");
    }
  };

  const value = {
    user,
    role,
    loading,
    logout,
    isClient: role === "client",
    isWorker: role === "worker",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};