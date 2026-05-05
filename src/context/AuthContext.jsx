import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || null);
  const [loading, setLoading] = useState(true);

  const initializedRef = useRef(false);
  const inactivityTimerRef = useRef(null);
  const userRef = useRef(null); // track user in ref so timer callback can read it

  // Keep userRef in sync
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Inactivity logout ──────────────────────────────────────
  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const resetInactivityTimer = () => {
    // Only run timer when someone is actually logged in
    if (!userRef.current) return;
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      if (userRef.current) {
        performLogout();
      }
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInactivityTimer();
    };
  }, []); // mount once — resetInactivityTimer reads userRef so no stale closure

  // ── Core logout logic (used by both manual + inactivity) ──
  const performLogout = async () => {
    clearInactivityTimer();
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

  // ── Profile loader ─────────────────────────────────────────
  const loadProfile = async (userId) => {
    try {
      const cachedRole = localStorage.getItem("userRole");
      if (cachedRole) {
        setRole(cachedRole);
        // Refresh in background silently
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

  // ── Auth state listener ────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
        resetInactivityTimer(); // start timer once user is confirmed
      } else {
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
          clearInactivityTimer();
          setLoading(false);
          return;
        }

        if (event === "SIGNED_IN" && initializedRef.current && session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
          resetInactivityTimer(); // start timer on new sign-in
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
          resetInactivityTimer(); // reset timer on token refresh (proves user is active)
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    role,
    loading,
    logout: performLogout, // expose performLogout as logout
    isClient: role === "client",
    isWorker: role === "worker",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};