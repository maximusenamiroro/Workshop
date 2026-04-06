import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import { FaBell, FaSearch, FaClipboardList, FaTimes, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ===== Status Colors =====
const ORDER_STATUS_COLOR = {
  delivered: "text-green-400",
  arriving: "text-yellow-400",
  "on the way": "text-blue-400",
  shipping: "text-gray-400",
};

// ===== Countdown Formatter =====
const formatCountdown = (ms) => {
  if (ms <= 0) return "Expired";
  const hrs = Math.floor(ms / 1000 / 60 / 60);
  const mins = Math.floor((ms / 1000 / 60) % 60);
  const secs = Math.floor((ms / 1000) % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

// ===== Circular Progress Component =====
const CircularProgress = ({ progress }) => {
  const stroke = 4;
  const radius = 28;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s linear" }}
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
      await Promise.all([fetchOrders(), fetchBookings(), fetchLiveWorkers()]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // ================= ORDERS =================
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, product_name, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Orders error:", error.message);
    setOrders(
      (data || []).map((o) => ({
        ...o,
        expiresAt: new Date(new Date(o.created_at).getTime() + 24 * 60 * 60 * 1000),
      }))
    );
  };

  // ================= BOOKINGS =================
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("hire_requests")
      .select("id, status, created_at, job_description, location")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) console.error("Bookings error:", error.message);
    setBookings(data || []);
  };

  // ================= LIVE WORKERS =================
  const fetchLiveWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("live_workers")
        .select("id, service, worker_id, profiles(full_name)")
        .limit(50);

      if (error) throw error;
      console.log("Live workers:", data);
      setLiveWorkers(data || []);
    } catch (err) {
      console.error("Live workers error:", err.message);
      // Fallback without join
      const { data: fallback } = await supabase
        .from("live_workers")
        .select("id, service, worker_id")
        .limit(50);
      console.log("Live workers fallback:", fallback);
      setLiveWorkers(fallback || []);
    }
  };

  // ================= FORMATTED ORDERS =================
  const formattedOrders = useMemo(
    () =>
      orders.map((o) => {
        const remaining = o.expiresAt - now;
        return {
          ...o,
          color: ORDER_STATUS_COLOR[o.status?.toLowerCase()] || "text-gray-400",
          countdown: remaining > 0 ? remaining : 0,
          progress: remaining > 0 ? (remaining / (24 * 60 * 60 * 1000)) * 100 : 0,
        };
      }),
    [orders, now]
  );

  const workersForCurrentStory =
    storyIndex !== null
      ? liveWorkers.filter(
          (w) => w.service === formattedOrders[storyIndex]?.product_name
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
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
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

      {/* ================= PRODUCT ORDERS ================= */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Product Orders</h2>
          <button
            onClick={() => navigate("/shop")}
            className="text-xs text-green-400 hover:text-green-300"
          >
            Shop →
          </button>
        </div>

        {formattedOrders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-gray-500 text-sm mb-3">No orders yet.</p>
            <button
              onClick={() => navigate("/shop")}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {formattedOrders.map((order, idx) => (
              <div
                key={order.id}
                className="flex flex-col items-center cursor-pointer min-w-[80px]"
                onClick={() => setStoryIndex(idx)}
              >
                <div className="relative w-16 h-16">
                  <CircularProgress progress={order.progress} />
                  <div className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
                <p className="text-xs mt-2 text-center truncate w-20">{order.product_name}</p>
                <p className={`text-xs font-semibold ${order.color}`}>{order.status || "pending"}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCountdown(order.countdown)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= BOOKINGS ================= */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex gap-2 mb-4 items-center">
          <FaClock className="text-green-400" />
          <h3 className="font-semibold">My Bookings</h3>
        </div>

        {bookings.length === 0 ? (
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">No bookings yet.</p>
            <button
              onClick={() => navigate("/hire-worker")}
              className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-xl text-sm font-semibold transition"
            >
              Hire a Worker
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex justify-between items-center py-2 border-b border-white/10"
              >
                <div>
                  <p className="text-sm font-medium">{b.job_description || "Job Request"}</p>
                  <p className="text-xs text-gray-500">📍 {b.location} • {formatDate(b.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getBookingColor(b.status)}`}>
                  {b.status || "pending"}
                </span>
              </div>
            ))}
            <button
              onClick={() => navigate("/hire-worker")}
              className="w-full mt-2 bg-green-600 hover:bg-green-700 py-2 rounded-xl text-sm font-semibold transition"
            >
              + Hire Another Worker
            </button>
          </div>
        )}
      </div>

      {/* ================= LIVE WORKERS ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex gap-2 mb-4 items-center">
          <FaMapMarkerAlt className="text-green-400" />
          <h3 className="font-semibold">Live Workers Near You</h3>
        </div>

        {liveWorkers.length === 0 ? (
          <p className="text-gray-500 text-sm">No workers are live right now.</p>
        ) : (
          <div className="space-y-2">
            {liveWorkers.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="flex justify-between items-center py-2 border-b border-white/10"
              >
                <div>
                  <p className="text-sm font-medium">
                    {w.profiles?.full_name || "Worker"}
                  </p>
                  <p className="text-xs text-gray-500">{w.service}</p>
                  <p className="text-xs text-green-400">🟢 Live now</p>
                </div>
                <button
                  onClick={() => navigate(`/hire-worker/${w.worker_id}`)}
                  className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition"
                >
                  Hire
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/live-services")}
          className="mt-4 w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm transition"
        >
          View All Live Workers
        </button>
      </div>

      {/* ================= STORY MODAL ================= */}
      {storyIndex !== null && (
        <div {...handlers} className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <FaTimes
              className="text-white cursor-pointer"
              size={22}
              onClick={() => setStoryIndex(null)}
            />
            <h2 className="text-lg font-semibold text-white">
              {formattedOrders[storyIndex]?.product_name}
            </h2>
            <div className="w-6" />
          </div>

          {/* Story progress bars */}
          <div className="flex gap-1 px-4">
            {formattedOrders.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full ${
                  idx === storyIndex ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 mt-4">
            <div className="bg-white/5 rounded-2xl p-4 mb-4">
              <p className={`text-lg font-bold ${formattedOrders[storyIndex]?.color}`}>
                {formattedOrders[storyIndex]?.status || "pending"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Expires in: {formatCountdown(formattedOrders[storyIndex]?.countdown)}
              </p>
            </div>

            <h3 className="font-semibold text-white/70 text-sm">Related Live Workers</h3>

            {workersForCurrentStory.length === 0 ? (
              <p className="text-gray-400 text-sm">No live workers for this product.</p>
            ) : (
              workersForCurrentStory.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-4 bg-white/5 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center font-bold text-lg">
                      {w.profiles?.full_name?.[0] || "W"}
                    </div>
                    <div>
                      <p className="text-white/90 font-medium">
                        {w.profiles?.full_name || "Worker"}
                      </p>
                      <p className="text-xs text-green-400">{w.service}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setStoryIndex(null);
                      navigate(`/hire-worker/${w.worker_id}`);
                    }}
                    className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition"
                  >
                    Hire
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}