import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import {
  FaBell,
  FaSearch,
  FaClipboardList,
  FaTimes,
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

const formatCountdown = (ms) => {
  if (ms <= 0) return "Expired";
  const hrs = Math.floor(ms / 1000 / 60 / 60);
  const mins = Math.floor((ms / 1000 / 60) % 60);
  const secs = Math.floor((ms / 1000) % 60);
  return `${hrs}h ${mins}m ${secs}s`;
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

  const [categorizedWorkers, setCategorizedWorkers] = useState([]);
  const [generalWorkers, setGeneralWorkers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [storyIndex, setStoryIndex] = useState(null);

  const [search, setSearch] = useState("");

  // clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // realtime + init
  useEffect(() => {
    if (!user) return;
    fetchAll();

    const ordersChannel = supabase
      .channel(`orders_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        fetchOrders
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel(`bookings_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hire_requests",
          filter: `client_id=eq.${user.id}`,
        },
        fetchBookings
      )
      .subscribe();

    const liveChannel = supabase
      .channel("live_workers_global")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_workers",
        },
        fetchLiveWorkers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(liveChannel);
    };
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([
      fetchOrders(),
      fetchBookings(),
      fetchLiveWorkers(),
    ]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, product_name, status, created_at, product_image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(
      (data || []).map((o) => ({
        ...o,
        expiresAt: new Date(
          new Date(o.created_at).getTime() + 24 * 60 * 60 * 1000
        ),
      }))
    );
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("hire_requests")
      .select("id, status, created_at, job_description, location")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setBookings(data || []);
  };

  const fetchLiveWorkers = async () => {
    const { data } = await supabase
      .from("live_workers")
      .select(
        `
        id,
        service,
        worker_id,
        workers(category),
        profiles(full_name)
      `
      )
      .limit(50);

    const all = data || [];

    setCategorizedWorkers(all.filter((w) => w.workers?.category));
    setGeneralWorkers(all.filter((w) => !w.workers?.category));
  };

  // ================= SEARCH FILTER =================
  const filteredWorkers = useMemo(() => {
    return {
      categorized: categorizedWorkers.filter((w) =>
        (w.profiles?.full_name + w.workers?.category)
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
      general: generalWorkers.filter((w) =>
        (w.profiles?.full_name + (w.service || ""))
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    };
  }, [search, categorizedWorkers, generalWorkers]);

  const formattedOrders = useMemo(() => {
    return orders.map((o) => {
      const remaining = o.expiresAt - now;
      return {
        ...o,
        color:
          ORDER_STATUS_COLOR[o.status?.toLowerCase()] ||
          "text-gray-400",
        countdown: remaining > 0 ? remaining : 0,
        progress:
          remaining > 0
            ? (remaining / (24 * 60 * 60 * 1000)) * 100
            : 0,
      };
    });
  }, [orders, now]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (
        storyIndex !== null &&
        storyIndex < formattedOrders.length - 1
      ) {
        setStoryIndex(storyIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (storyIndex !== null && storyIndex > 0) {
        setStoryIndex(storyIndex - 1);
      }
    },
    trackMouse: true,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <FaClipboardList
          className="cursor-pointer"
          onClick={() => navigate("/productorder")}
        />

        <h1 className="text-xl font-semibold">Workspace</h1>

        <FaBell />
      </div>

      {/* SEARCH */}
      <div className="flex items-center bg-white/5 p-2 rounded mb-4">
        <FaSearch className="mr-2 text-white/50" />
        <input
          className="bg-transparent w-full outline-none"
          placeholder="Search workers, bookings..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ORDERS */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Product Orders</h2>

        {formattedOrders.length === 0 ? (
          <p className="text-sm text-gray-400">No orders yet</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto">
            {formattedOrders.map((order, idx) => (
              <div
                key={order.id}
                onClick={() => setStoryIndex(idx)}
                className="min-w-[80px] text-center cursor-pointer"
              >
                <CircularProgress progress={order.progress} />
                <p className="text-xs mt-1 truncate">
                  {order.product_name}
                </p>
                <p className={`text-xs ${order.color}`}>
                  {order.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOOKINGS */}
      <div className="bg-white/5 p-4 rounded-xl mb-6">
        <h2 className="font-semibold mb-2">My Bookings</h2>

        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400">
            No bookings yet
          </p>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="flex justify-between py-2 border-b border-white/10"
            >
              <div>
                <p className="text-sm">
                  {b.job_description}
                </p>
                <p className="text-xs text-gray-400">
                  {b.location}
                </p>
              </div>

              <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                {b.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* WORKERS */}
      <div className="bg-white/5 p-4 rounded-xl mb-4">
        <h2 className="font-semibold mb-2">
          Specialized Workers
        </h2>

        {filteredWorkers.categorized.map((w) => (
          <div
            key={w.id}
            className="flex justify-between py-2"
          >
            <div>
              <p>{w.profiles?.full_name}</p>
              <p className="text-xs text-green-400">
                {w.workers?.category}
              </p>
            </div>

            <button
              onClick={() =>
                navigate(`/hire-worker/${w.worker_id}`)
              }
              className="text-xs bg-green-600 px-3 py-1 rounded"
            >
              Hire
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white/5 p-4 rounded-xl">
        <h2 className="font-semibold mb-2">
          General Workers
        </h2>

        {filteredWorkers.general.map((w) => (
          <div
            key={w.id}
            className="flex justify-between py-2"
          >
            <div>
              <p>{w.profiles?.full_name}</p>
              <p className="text-xs text-yellow-400">
                {w.service}
              </p>
            </div>

            <button
              onClick={() =>
                navigate(`/hire-worker/${w.worker_id}`)
              }
              className="text-xs bg-green-600 px-3 py-1 rounded"
            >
              Hire
            </button>
          </div>
        ))}
      </div>

      {/* STORY MODAL */}
      {storyIndex !== null &&
        formattedOrders[storyIndex] && (
          <div
            {...handlers}
            className="fixed inset-0 bg-black z-50 p-4"
          >
            <div className="flex justify-between mb-3">
              <FaTimes
                className="cursor-pointer"
                onClick={() => setStoryIndex(null)}
              />
              <span>
                {formattedOrders[storyIndex]?.product_name}
              </span>
            </div>

            <div>
              <p>
                Status:{" "}
                {formattedOrders[storyIndex]?.status}
              </p>
              <p>
                Countdown:{" "}
                {formatCountdown(
                  formattedOrders[storyIndex]?.countdown
                )}
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
