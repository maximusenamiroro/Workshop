import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import { FaBell, FaSearch, FaClipboardList, FaTimes } from "react-icons/fa";
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
        stroke="#007AFF"
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

export default function BuyerWorkspaceBento() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [storyIndex, setStoryIndex] = useState(null);

  // Timer to update countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch orders and live workers
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      await Promise.all([fetchOrders(), fetchLiveWorkers()]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, product_name, status, created_at, product_image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error(error.message);

    setOrders(
      (data || []).map((o) => ({
        ...o,
        expiresAt: new Date(new Date(o.created_at).getTime() + 24 * 60 * 60 * 1000),
      }))
    );
  };

  const fetchLiveWorkers = async () => {
    const { data, error } = await supabase
      .from("live_workers")
      .select("id, service, worker_id, full_name, worker_image_url")
      .limit(50);

    if (error) console.error(error.message);
    setLiveWorkers(data || []);
  };

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
          (w) => w.service === formattedOrders[storyIndex].product_name
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

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <FaClipboardList
          className="text-white/70 cursor-pointer"
          size={22}
          onClick={() => navigate("/orders")}
        />
        <h1 className="text-xl font-semibold">Workspace</h1>
        <div className="flex gap-4 items-center">
          <FaSearch className="text-white/70 cursor-pointer" />
          <FaBell className="text-white/70" />
        </div>
      </div>

      {/* PRODUCT ORDERS */}
      <div className="mb-6">
        <h2 className="mb-3 font-semibold">Product Orders</h2>
        {formattedOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {formattedOrders.map((order, idx) => (
              <div
                key={order.id}
                className="flex flex-col items-center cursor-pointer relative"
                onClick={() => setStoryIndex(idx)}
              >
                <div className="relative w-20 h-20">
                  <CircularProgress progress={order.progress} />
                  <div className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden flex items-center justify-center border-2 border-green-500">
                    {order.product_image_url ? (
                      <img
                        src={order.product_image_url}
                        alt={order.product_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                </div>
                <p className="text-xs mt-2 text-center">{order.product_name}</p>
                <p className={`text-xs font-semibold ${order.color}`}>{order.status || "pending"}</p>
                <p className="text-xs text-gray-400 mt-1">{formatCountdown(order.countdown)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL-PAGE STORY MODAL */}
      {storyIndex !== null && (
        <div {...handlers} className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <FaTimes
              className="text-white cursor-pointer"
              size={22}
              onClick={() => setStoryIndex(null)}
            />
            <h2 className="text-lg font-semibold text-white">{formattedOrders[storyIndex].product_name}</h2>
            <div className="w-6"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {workersForCurrentStory.length === 0 ? (
              <p className="text-gray-400 text-sm">No live workers for this product.</p>
            ) : (
              workersForCurrentStory.map((w) => (
                <div key={w.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                    {w.worker_image_url ? (
                      <img src={w.worker_image_url} alt={w.full_name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white/90 font-medium">{w.full_name || "Worker"}</p>
                    <p className="text-xs text-green-400">{w.service}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
