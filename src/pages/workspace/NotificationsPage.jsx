import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const TYPE_CONFIG = {
  like:    { icon: "❤️", color: "text-red-400",    bg: "bg-red-500/10" },
  comment: { icon: "💬", color: "text-blue-400",   bg: "bg-blue-500/10" },
  follow:  { icon: "👤", color: "text-purple-400", bg: "bg-purple-500/10" },
  booking: { icon: "📋", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  order:   { icon: "📦", color: "text-green-400",  bg: "bg-green-500/10" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const channelRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    setupRealtime();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id, type, message, is_read, created_at,
          reel_id, booking_id, order_id,
          from_user:from_user_id ( id, full_name, avatar_url )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("fetchNotifications error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    channelRef.current = supabase
      .channel(`notifications_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        // Fetch the full notification with join
        const { data } = await supabase
          .from("notifications")
          .select(`
            id, type, message, is_read, created_at,
            reel_id, booking_id, order_id,
            from_user:from_user_id ( id, full_name, avatar_url )
          `)
          .eq("id", payload.new.id)
          .maybeSingle();
        if (data) {
          setNotifications(prev => [data, ...prev]);
        }
      })
      .subscribe();
  };

  const markAsRead = async (id) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationTap = (n) => {
    markAsRead(n.id);
    if (n.reel_id) navigate("/reels");
    else if (n.booking_id) navigate("/my-orders");
    else if (n.order_id) navigate("/my-orders");
    else if (n.from_user?.id) navigate(`/seller-profile/${n.from_user.id}`);
  };

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="h-full overflow-y-auto bg-[#0B0F19] text-white pb-24">

      {/* Header */}
      <div className="sticky top-0 bg-[#0B0F19]/95 backdrop-blur border-b border-white/5 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-1">←</button>
            <h1 className="font-bold text-lg">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-green-400 hover:text-green-300 transition"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "All" },
            { id: "like", label: "❤️ Likes" },
            { id: "comment", label: "💬 Comments" },
            { id: "follow", label: "👤 Follows" },
            { id: "booking", label: "📋 Bookings" },
            { id: "order", label: "📦 Orders" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                filter === f.id
                  ? "bg-green-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {f.label}
              {f.id !== "all" && notifications.filter(n => n.type === f.id && !n.is_read).length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] px-1 rounded-full">
                  {notifications.filter(n => n.type === f.id && !n.is_read).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-5xl mb-3">🔔</p>
          <p className="text-sm">No notifications yet</p>
          <p className="text-xs mt-1 text-gray-600">
            {filter !== "all" ? "Try switching to All" : "Activity will appear here"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {filtered.map(n => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.order;
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationTap(n)}
                className={`flex items-start gap-3 px-4 py-4 cursor-pointer transition-all active:scale-[0.98] ${
                  n.is_read ? "hover:bg-white/3" : "bg-green-500/5 hover:bg-green-500/8"
                }`}
              >
                {/* Avatar or icon */}
                <div className="relative flex-shrink-0">
                  {n.from_user?.avatar_url ? (
                    <img
                      src={n.from_user.avatar_url}
                      alt={n.from_user.full_name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-11 h-11 rounded-full ${config.bg} flex items-center justify-center text-lg`}>
                      {n.from_user?.full_name?.[0]?.toUpperCase() || config.icon}
                    </div>
                  )}
                  {/* Type badge */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${config.bg} border-2 border-[#0B0F19]`}>
                    {config.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.is_read ? "text-gray-300" : "text-white font-medium"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {!n.is_read && (
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="text-gray-600 hover:text-red-400 text-xs transition p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}