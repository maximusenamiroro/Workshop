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
  const [notifBadge, setNotifBadge] = useState(0);

  const channelsRef = useRef([]);

  useEffect(() => {
    if (!user || !role) return;
    fetchBadges();
    setupRealtimeBadges();
    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [user, role]);

  useEffect(() => {
    if (location.pathname === "/inbox") setMsgBadge(0);
    if (location.pathname === "/notifications") setNotifBadge(0);
    if (
      location.pathname === "/workstation" ||
      location.pathname === "/workspace" ||
      location.pathname === "/Bookings"
    ) setWorkspaceBadge(0);
  }, [location.pathname]);

  const fetchBadges = async () => {
    if (!user) return;
    try {
      const { count: msgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("seen", false);
      setMsgBadge(msgCount || 0);

      const { count: notifCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotifBadge(notifCount || 0);

      if (role === "worker") {
        const { count: bookingCount } = await supabase
          .from("hire_requests")
          .select("id", { count: "exact", head: true })
          .eq("worker_id", user.id)
          .eq("status", "pending");

        const { data: myProducts } = await supabase
          .from("products").select("id").eq("worker_id", user.id);

        let orderCount = 0;
        if (myProducts?.length > 0) {
          const { count } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .in("product_id", myProducts.map(p => p.id))
            .eq("status", "pending");
          orderCount = count || 0;
        }
        setWorkspaceBadge((bookingCount || 0) + orderCount);
      } else {
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

    const msgChannel = supabase
      .channel(`badge_messages_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "messages", filter: `receiver_id=eq.${user.id}`,
      }, () => {
        if (location.pathname !== "/inbox") setMsgBadge(prev => prev + 1);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "messages", filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.seen && !payload.old.seen)
          setMsgBadge(prev => Math.max(0, prev - 1));
      })
      .subscribe();
    channelsRef.current.push(msgChannel);

    const notifChannel = supabase
      .channel(`badge_notif_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "notifications", filter: `user_id=eq.${user.id}`,
      }, () => {
        if (location.pathname !== "/notifications")
          setNotifBadge(prev => prev + 1);
      })
      .subscribe();
    channelsRef.current.push(notifChannel);

    if (role === "worker") {
      const bookingChannel = supabase
        .channel(`badge_bookings_${user.id}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public",
          table: "hire_requests", filter: `worker_id=eq.${user.id}`,
        }, () => {
          if (location.pathname !== "/workstation" && location.pathname !== "/Bookings")
            setWorkspaceBadge(prev => prev + 1);
        })
        .on("postgres_changes", {
          event: "UPDATE", schema: "public",
          table: "hire_requests", filter: `worker_id=eq.${user.id}`,
        }, (payload) => {
          if (payload.old.status === "pending" && payload.new.status !== "pending")
            setWorkspaceBadge(prev => Math.max(0, prev - 1));
        })
        .subscribe();
      channelsRef.current.push(bookingChannel);

      const orderChannel = supabase
        .channel(`badge_orders_${user.id}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "orders",
        }, async (payload) => {
          if (!payload.new.product_id) return;
          const { data } = await supabase
            .from("products").select("id")
            .eq("id", payload.new.product_id)
            .eq("worker_id", user.id).maybeSingle();
          if (data && location.pathname !== "/workstation")
            setWorkspaceBadge(prev => prev + 1);
        })
        .subscribe();
      channelsRef.current.push(orderChannel);
    } else {
      const clientOrderChannel = supabase
        .channel(`badge_client_orders_${user.id}`)
        .on("postgres_changes", {
          event: "UPDATE", schema: "public",
          table: "orders", filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (payload.new.status !== payload.old.status && location.pathname !== "/workspace")
            setWorkspaceBadge(prev => prev + 1);
        })
        .subscribe();
      channelsRef.current.push(clientOrderChannel);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  const isActive = (path) => location.pathname === path;
  const isWorker = role === "worker";
  const workspaceLabel = isWorker ? "Workstation" : "Workspace";
  const workspacePath = isWorker ? "/workstation" : "/workspace";
  const workspaceIcon = isWorker ? <Briefcase size={24} /> : <TbPlanet size={24} />;
  const profilePath = isWorker ? "/seller-profile" : "/buyer-profile";

  // Profile nav item — shows notifications badge on it
  // Tapping profile goes to profile page
  // Long-press / second tap concept: we use a small bell dot on the profile icon
  const profileIsActive = isActive(profilePath) || isActive("/notifications");

  const ProfileNavIcon = () => (
    <div className="relative">
      <User size={22} />
      {/* Notification dot on profile icon */}
      {notifBadge > 0 && (
        <div className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
          <span className="text-white text-[9px] font-bold leading-none">
            {notifBadge > 99 ? "99+" : notifBadge > 9 ? "9+" : notifBadge}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-6 space-y-6">
        <NavItem icon={<Home size={28} />} label="Home" active={isActive("/reels")} onClick={() => navigate("/reels")} />
        <NavItem icon={<MessageCircle size={28} />} label="Inbox" active={isActive("/inbox")} onClick={() => navigate("/inbox")} badge={msgBadge} />
        <NavItem icon={workspaceIcon} label={workspaceLabel} active={isActive(workspacePath)} onClick={() => navigate(workspacePath)} badge={workspaceBadge} />
        {/* Profile with notification badge */}
        <button
          onClick={() => navigate(profilePath)}
          className={`flex flex-col items-center justify-center transition-all ${
            profileIsActive
              ? "bg-white text-black px-4 py-2 rounded-2xl scale-105 shadow-md"
              : "text-gray-400 px-3 py-2 hover:text-white"
          }`}
        >
          <ProfileNavIcon />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden pb-[64px] md:pb-0">
        {children}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-white/10 flex justify-around items-center py-1.5">
        <NavItem icon={<Home size={22} />} label="Home" active={isActive("/reels")} onClick={() => navigate("/reels")} />
        <NavItem icon={<MessageCircle size={22} />} label="Inbox" active={isActive("/inbox")} onClick={() => navigate("/inbox")} badge={msgBadge} />
        <NavItem icon={workspaceIcon} label={workspaceLabel} active={isActive(workspacePath)} onClick={() => navigate(workspacePath)} badge={workspaceBadge} />
        {/* Profile with notification badge — tapping navigates to profile */}
        <button
          onClick={() => navigate(profilePath)}
          className={`flex flex-col items-center justify-center transition-all ${
            profileIsActive
              ? "bg-white text-black px-4 py-2 rounded-2xl scale-105 shadow-md"
              : "text-gray-400 px-3 py-2 hover:text-white"
          }`}
        >
          <ProfileNavIcon />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
}