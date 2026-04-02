import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      setRole(data?.role || null);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setRole(null);
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          await loadUserProfile(user.id);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
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