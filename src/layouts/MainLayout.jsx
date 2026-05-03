import React, { useState, useEffect, useRef } from "react";
import { Home, User, MessageCircle, Briefcase } from "lucide-react";
import { TbPlanet } from "react-icons/tb";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

function NavItem({ icon, label, active, onClick, badge = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all ${
        active
          ? "bg-white text-black px-4 py-2 rounded-2xl scale-105 shadow-md"
          : "text-gray-400 px-3 py-2 hover:text-white"
      }`}
    >
      {/* Icon with badge */}
      <div className="relative">
        {icon}
        {badge > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
            <span className="text-white text-[9px] font-bold leading-none">
              {badge > 99 ? "99+" : badge > 9 ? "9+" : badge}
            </span>
          </div>
        )}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();

  const [msgBadge, setMsgBadge] = useState(0);
  const [workspaceBadge, setWorkspaceBadge] = useState(0);

  const channelsRef = useRef([]);

  // ── Fetch initial badge counts ──────────────────────────────
  useEffect(() => {
    if (!user || !role) return;
    fetchBadges();
    setupRealtimeBadges();

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [user, role]);

  // ── Clear badges when user visits relevant page ─────────────
  useEffect(() => {
    if (location.pathname === "/inbox") {
      setMsgBadge(0);
    }
    if (
      location.pathname === "/workstation" ||
      location.pathname === "/workspace" ||
      location.pathname === "/Bookings"
    ) {
      setWorkspaceBadge(0);
    }
  }, [location.pathname]);

  const fetchBadges = async () => {
    if (!user) return;

    try {
      // ── Unread messages badge (all users) ──
      const { count: msgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("seen", false);

      setMsgBadge(msgCount || 0);

      if (role === "worker") {
        // ── Worker: pending hire requests + pending orders ──
        const { count: bookingCount } = await supabase
          .from("hire_requests")
          .select("id", { count: "exact", head: true })
          .eq("worker_id", user.id)
          .eq("status", "pending");

        // Get worker's product IDs
        const { data: myProducts } = await supabase
          .from("products")
          .select("id")
          .eq("worker_id", user.id);

        let orderCount = 0;
        if (myProducts && myProducts.length > 0) {
          const ids = myProducts.map(p => p.id);
          const { count } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .in("product_id", ids)
            .eq("status", "pending");
          orderCount = count || 0;
        }

        setWorkspaceBadge((bookingCount || 0) + orderCount);

      } else {
        // ── Client: their orders that were updated (not pending) ──
        const { count: updatedOrders } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "pending");

        setWorkspaceBadge(updatedOrders || 0);
      }
    } catch (err) {
      console.error("fetchBadges error:", err.message);
    }
  };

  const setupRealtimeBadges = () => {
    if (!user) return;

    // ── 1. Messages badge — new message received ──
    const msgChannel = supabase
      .channel(`badge_messages_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        // Only add badge if not currently on inbox page
        if (location.pathname !== "/inbox") {
          setMsgBadge(prev => prev + 1);
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        // Message marked as seen — reduce badge
        if (payload.new.seen && !payload.old.seen) {
          setMsgBadge(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    channelsRef.current.push(msgChannel);

    if (role === "worker") {
      // ── 2. Worker: new hire request badge ──
      const bookingChannel = supabase
        .channel(`badge_bookings_${user.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "hire_requests",
          filter: `worker_id=eq.${user.id}`,
        }, () => {
          if (location.pathname !== "/workstation" && location.pathname !== "/Bookings") {
            setWorkspaceBadge(prev => prev + 1);
          }
        })
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "hire_requests",
          filter: `worker_id=eq.${user.id}`,
        }, (payload) => {
          // Booking accepted/rejected — clear from pending count
          if (payload.old.status === "pending" && payload.new.status !== "pending") {
            setWorkspaceBadge(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe();

      channelsRef.current.push(bookingChannel);

      // ── 3. Worker: new order badge ──
      // We watch ALL order inserts then check if it's for this worker's product
      const orderChannel = supabase
        .channel(`badge_orders_${user.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "orders",
        }, async (payload) => {
          if (!payload.new.product_id) return;
          // Check if this order is for this worker's product
          const { data } = await supabase
            .from("products")
            .select("id")
            .eq("id", payload.new.product_id)
            .eq("worker_id", user.id)
            .maybeSingle();

          if (data) {
            if (location.pathname !== "/workstation") {
              setWorkspaceBadge(prev => prev + 1);
            }
          }
        })
        .subscribe();

      channelsRef.current.push(orderChannel);

    } else {
      // ── 4. Client: order status updated badge ──
      const clientOrderChannel = supabase
        .channel(`badge_client_orders_${user.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          // Status changed — notify client
          if (payload.new.status !== payload.old.status) {
            if (location.pathname !== "/workspace" && location.pathname !== "/buyer-profile") {
              setWorkspaceBadge(prev => prev + 1);
            }
          }
        })
        .subscribe();

      channelsRef.current.push(clientOrderChannel);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isActive = (path) => location.pathname === path;
  const isWorker = role === "worker";
  const workspaceLabel = isWorker ? "Workstation" : "Workspace";
  const workspacePath = isWorker ? "/workstation" : "/workspace";
  const workspaceIcon = isWorker ? <Briefcase size={24} /> : <TbPlanet size={24} />;
  const profilePath = isWorker ? "/seller-profile" : "/buyer-profile";

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-6 space-y-6">
        <NavItem
          icon={<Home size={28} />}
          label="Home"
          active={isActive("/reels")}
          onClick={() => navigate("/reels")}
        />
        <NavItem
          icon={<MessageCircle size={28} />}
          label="Inbox"
          active={isActive("/inbox")}
          onClick={() => navigate("/inbox")}
          badge={msgBadge}
        />
        <NavItem
          icon={workspaceIcon}
          label={workspaceLabel}
          active={isActive(workspacePath)}
          onClick={() => navigate(workspacePath)}
          badge={workspaceBadge}
        />
        <NavItem
          icon={<User size={28} />}
          label="Profile"
          active={isActive(profilePath)}
          onClick={() => navigate(profilePath)}
        />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-hidden pb-[60px] md:pb-0">
        {children}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-white/10 flex justify-around items-center py-1.5">
        <NavItem
          icon={<Home size={24} />}
          label="Home"
          active={isActive("/reels")}
          onClick={() => navigate("/reels")}
        />
        <NavItem
          icon={<MessageCircle size={24} />}
          label="Inbox"
          active={isActive("/inbox")}
          onClick={() => navigate("/inbox")}
          badge={msgBadge}
        />
        <NavItem
          icon={workspaceIcon}
          label={workspaceLabel}
          active={isActive(workspacePath)}
          onClick={() => navigate(workspacePath)}
          badge={workspaceBadge}
        />
        <NavItem
          icon={<User size={24} />}
          label="Profile"
          active={isActive(profilePath)}
          onClick={() => navigate(profilePath)}
        />
      </div>
    </div>
  );
}