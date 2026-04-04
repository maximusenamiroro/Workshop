import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (error) throw error;
      setRole(data?.role || null);
    } catch (err) {
      console.error("Failed to load profile:", err.message);
      setRole(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err.message);
    } finally {
      setUser(null);
      setRole(null);
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
      {!loading && children}
    </AuthContext.Provider>
  );
};