import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import {
  FaBell,
  FaSearch,
  FaClipboardList,
  FaTimes,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ORDER_STATUS_COLOR = {
  delivered: "text-green-400",
  arriving: "text-yellow-400",
  "on the way": "text-blue-400",
  shipping: "text-gray-400",
};

const BOOKING_STATUS_COLOR = {
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

const formatCountdown = (ms) => {
  if (ms <= 0) return "Expired";
  const hrs = Math.floor(ms / 1000 / 60 / 60);
  const mins = Math.floor((ms / 1000 / 60) % 60);
  const secs = Math.floor((ms / 1000) % 60);
  return `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs
    .toString()
    .padStart(2, "0")}s`;
};

const CircularProgress = ({ progress }) => {
  const stroke = 4;
  const radius = 28;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#ffffff20"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#22c55e"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{
          strokeDashoffset,
          transition: "stroke-dashoffset 0.5s linear",
        }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hireItems, setHireItems] = useState([]);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [storyIndex, setStoryIndex] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      await Promise.all([
        fetchOrders(),
        fetchLiveWorkers(),
      ]);
      setLoading(false);
    };
    fetchData();

    // ========== Real-time subscriptions ==========
    const ordersSubscription = supabase
      .from("orders")
      .on("INSERT", (payload) => {
        const newOrder = {
          ...payload.new,
          expiresAt: new Date(
            new Date(payload.new.created_at).getTime() + 24 * 60 * 60 * 1000
          ),
        };
        if (newOrder.category) {
          setBookings((prev) => [newOrder, ...prev]);
        } else {
          setHireItems((prev) => [newOrder, ...prev]);
        }
        setOrders((prev) => [newOrder, ...prev]);
      })
      .subscribe();

    const liveWorkerSubscription = supabase
      .from("live_workers")
      .on("INSERT", (payload) => {
        setLiveWorkers((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(ordersSubscription);
      supabase.removeSubscription(liveWorkerSubscription);
    };
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, product_name, category, status, created_at, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Orders error:", error.message);

    const categorized = (data || []).map((o) => ({
      ...o,
      expiresAt: new Date(new Date(o.created_at).getTime() + 24 * 60 * 60 * 1000),
    }));

    setBookings(categorized.filter((o) => o.category));
    setHireItems(categorized.filter((o) => !o.category));
    setOrders(categorized);
  };

  const fetchLiveWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("live_workers")
        .select("id, service, worker_id, profiles(full_name)")
        .limit(50);

      if (error) throw error;
      setLiveWorkers(data || []);
    } catch (err) {
      console.error("Live workers error:", err.message);
    }
  };

  const formattedOrders = useMemo(
    () =>
      orders.map((o) => {
        const remaining = o.expiresAt - now;
        return {
          ...o,
          color: ORDER_STATUS_COLOR[o.status?.toLowerCase()] || "text-gray-400",
          countdown: remaining > 0 ? remaining : 0,
          progress:
            remaining > 0 ? (remaining / (24 * 60 * 60 * 1000)) * 100 : 0,
        };
      }),
    [orders, now]
  );

  const workersForCurrentStory =
    storyIndex !== null
      ? liveWorkers.filter(
          (w) =>
            w.service === formattedOrders[storyIndex]?.category ||
            (!formattedOrders[storyIndex]?.category && w.service)
        )
      : [];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (storyIndex < formattedOrders.length - 1) setStoryIndex(storyIndex + 1);
    },
    onSwipedRight: () => {
      if (storyIndex > 0) setStoryIndex(storyIndex - 1);
    },
    trackMouse: true,
  });

  const getBookingColor = (status) => {
    return BOOKING_STATUS_COLOR[status] || BOOKING_STATUS_COLOR.pending;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <FaClipboardList
          className="text-white/70 cursor-pointer"
          size={22}
          onClick={() => navigate("/productorder")}
        />
        <h1 className="text-xl font-semibold">Workspace</h1>
        <div className="flex gap-4 items-center">
          <FaSearch
            className="text-white/70 cursor-pointer"
            onClick={() => navigate("/shop")}
          />
          <FaBell className="text-white/70" />
        </div>
      </div>

      {/* ================= BOOKINGS ================= */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold mb-2">Bookings</h3>
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No bookings yet.</p>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="flex justify-between items-center py-2 border-b border-white/10"
            >
              <div>
                <p className="text-sm font-medium">{b.product_name}</p>
                <p className="text-xs text-gray-500">
                  📍 {b.category || "No category"} • {formatDate(b.created_at)}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getBookingColor(b.status)}`}>
                {b.status || "pending"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ================= HIRE ================= */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold mb-2">Hire Workers</h3>
        {hireItems.length === 0 ? (
          <p className="text-gray-500 text-sm">No workers to hire currently.</p>
        ) : (
          hireItems.map((h) => (
            <div
              key={h.id}
              className="flex justify-between items-center py-2 border-b border-white/10"
            >
              <div>
                <p className="text-sm font-medium">{h.product_name}</p>
                <p className="text-xs text-gray-500">⚠️ No category specified</p>
              </div>
              <button
                onClick={() => navigate(`/hire-worker/${h.user_id}`)}
                className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition"
              >
                Hire
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
