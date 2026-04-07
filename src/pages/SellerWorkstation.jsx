import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import { FaBell, FaSearch, FaClipboardList, FaTimes, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Status colors for orders
const ORDER_STATUS_COLOR = {
  delivered: "text-green-400",
  arriving: "text-yellow-400",
  "on the way": "text-blue-400",
  shipping: "text-gray-400",
};

// Countdown formatter
const formatCountdown = (ms) => {
  if (ms <= 0) return "Expired";
  const hrs = Math.floor(ms / 1000 / 60 / 60);
  const mins = Math.floor((ms / 1000 / 60) % 60);
  const secs = Math.floor((ms / 1000) % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

// Circular progress component
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
        strokeDasharray={`${circumference} ${circumference}`}
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
  const [liveProducts, setLiveProducts] = useState([]);
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
      await Promise.all([fetchOrders(), fetchBookings(), fetchLiveProducts()]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Fetch orders
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, product_name, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Orders error:", error.message);
    setOrders((data || []).map(o => ({
      ...o,
      expiresAt: new Date(new Date(o.created_at).getTime() + 24 * 60 * 60 * 1000),
    })));
  };

  // Fetch bookings
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

  // Fetch live products/workers
  const fetchLiveProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("live_workers")
        .select(`
          id,
          service,
          worker_id,
          profiles(full_name),
          products(title, category)
        `)
        .limit(50);

      if (error) throw error;
      setLiveProducts(data || []);
    } catch (err) {
      console.error("Live products error:", err.message);
      const { data: fallback } = await supabase
        .from("live_workers")
        .select("id, service, worker_id")
        .limit(50);
      setLiveProducts(fallback || []);
    }
  };

  // Format orders for countdown and progress
  const formattedOrders = useMemo(() => orders.map(o => {
    const remaining = o.expiresAt - now;
    return {
      ...o,
      color: ORDER_STATUS_COLOR[o.status?.toLowerCase()] || "text-gray-400",
      countdown: remaining > 0 ? remaining : 0,
      progress: remaining > 0 ? (remaining / (24*60*60*1000)) * 100 : 0,
      type: "order"
    };
  }), [orders, now]);

  // ====== GROUP LIVE PRODUCTS ======
  const bookingProducts = liveProducts.filter(p => p.products?.category).map(p => ({...p, type: "booking"}));
  const hireProducts = liveProducts.filter(p => !p.products?.category).map(p => ({...p, type: "hire"}));

  // ====== MERGE ORDERS + LIVE ======
  const liveStories = [...formattedOrders, ...bookingProducts, ...hireProducts];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (storyIndex < liveStories.length - 1) setStoryIndex(storyIndex + 1);
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

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
        <h2 className="font-semibold mb-3">Product Orders</h2>
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
          </div>
        )}
      </div>

      {/* ================= STORY MODAL (Orders + Live Products) ================= */}
      {storyIndex !== null && (
        <div {...handlers} className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <FaTimes
              className="text-white cursor-pointer"
              size={22}
              onClick={() => setStoryIndex(null)}
            />
            <h2 className="text-lg font-semibold text-white">
              {liveStories[storyIndex]?.type === "order"
                ? liveStories[storyIndex]?.product_name
                : liveStories[storyIndex]?.products?.title || liveStories[storyIndex]?.service || "Live"}
            </h2>
            <div className="w-6" />
          </div>

          {/* Story progress bars */}
          <div className="flex gap-1 px-4">
            {liveStories.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full ${idx === storyIndex ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 mt-4">
            {liveStories[storyIndex]?.type === "order" ? (
              <div className="bg-white/5 rounded-2xl p-4 mb-4">
                <p className={`text-lg font-bold ${liveStories[storyIndex].color}`}>
                  {liveStories[storyIndex].status || "pending"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Expires in: {formatCountdown(liveStories[storyIndex].countdown)}
                </p>
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-4 mb-4">
                <p className="text-white/90 text-sm font-medium">
                  {liveStories[storyIndex]?.products?.category || liveStories[storyIndex]?.service || "Uncategorized"}
                </p>
                <p className="text-xs text-green-400 mt-1">🟢 Live now</p>
                <button
                  onClick={() => {
                    setStoryIndex(null);
                    navigate(`/hire-worker/${liveStories[storyIndex]?.worker_id}`);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-xl text-sm font-semibold transition mt-3"
                >
                  Hire
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
