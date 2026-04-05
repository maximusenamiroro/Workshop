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
  const [initialized, setInitialized] = useState(false);

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
    let mounted = true;

    // Step 1 - handle initial session on page load/refresh
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setLoading(false);
      setInitialized(true);
    });

    // Step 2 - handle auth events after initialization
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Ignore initial events — getSession handles those
        if (event === "INITIAL_SESSION") return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        // Only handle SIGNED_IN after initialization
        // This means a real login happened not a page refresh
        if (event === "SIGNED_IN" && initialized && session?.user) {
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
  }, [initialized]);

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
      {children}
    </AuthContext.Provider>
  );
};