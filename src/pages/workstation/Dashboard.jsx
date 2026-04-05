import { useState, useEffect, useMemo } from "react";
import { FaClock, FaMapMarkerAlt, FaBell, FaBox, FaSearch, FaClipboardList } from "react-icons/fa";
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

const BOOKING_STATUS_COLOR = {
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

// ===== Date Formatting =====
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function WorkstationBento() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // ===== Fetch All Data =====
  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      await Promise.all([fetchProducts(), fetchOrders(), fetchBookings(), fetchLiveWorkers()]);
      setLoading(false);
    };
    fetchAll();

    // Countdown update every second
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [user]);

  // ===== Products (24h expiry) =====
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Fetch products error:", error.message);

    const filtered = (data || []).filter(
      (p) => new Date(p.created_at).getTime() + 24 * 60 * 60 * 1000 > Date.now()
    );
    setProducts(filtered);
  };

  const deleteProduct = async (product) => {
    try {
      await supabase.from("products").delete().eq("id", product.id);
      if (product.file_url) {
        const fileName = product.file_url.split("/").pop();
        await supabase.storage.from("products").remove([fileName]);
      }
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err.message);
    }
  };

  // ===== Orders =====
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) console.error("Fetch orders error:", error.message);
    setOrders(data || []);
  };

  // ===== Bookings =====
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) console.error("Fetch bookings error:", error.message);
    setBookings(data || []);
  };

  // ===== Live Workers =====
  const fetchLiveWorkers = async () => {
    const { data, error } = await supabase
      .from("live_workers")
      .select("*")
      .limit(10);

    if (error) console.error("Fetch live workers error:", error.message);
    setLiveWorkers(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 md:p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Workstation</h1>
        <div className="flex items-center gap-4">
          <FaSearch
            className="text-gray-400 cursor-pointer"
            onClick={() => navigate("/search")}
          />
          <FaBell className="text-gray-400" />
        </div>
      </div>

      {/* ================= PRODUCT TABLE ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h2 className="mb-3 font-semibold">My Products</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {products.length === 0 && (
            <p className="text-gray-500 text-sm">No products yet.</p>
          )}
          {products.map((p) => {
            const expireAt = new Date(p.created_at).getTime() + 24 * 60 * 60 * 1000;
            const remaining = Math.max(0, expireAt - now);
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            return (
              <div key={p.id} className="flex flex-col items-center min-w-[100px] relative">
                <div
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#007AFF] cursor-pointer flex items-center justify-center"
                >
                  {p.file_url?.endsWith(".mp4") ? (
                    <video className="w-full h-full object-cover" src={p.file_url} />
                  ) : (
                    <img className="w-full h-full object-cover" src={p.file_url} alt={p.name} />
                  )}
                </div>
                <p className="text-xs mt-1 text-center">{p.name}</p>
                <p className="text-xs text-[#007AFF] text-center font-mono">
                  {hours}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                </p>
                <button
                  onClick={() => deleteProduct(p)}
                  className="text-red-400 text-xs mt-1"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= ORDERS ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative">
        <h2 className="mb-3 font-semibold flex items-center gap-2">
          Recent Orders
          <FaClipboardList
            className="cursor-pointer text-gray-400 ml-auto"
            onClick={() => navigate("/orders")}
          />
        </h2>
        {orders.length === 0 && <p className="text-gray-500 text-sm">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="flex justify-between py-2 border-b border-white/10 items-center">
            <span>{o.product_name || "Product"}</span>
            <span className={`text-xs font-semibold ${ORDER_STATUS_COLOR[o.status?.toLowerCase()] || "text-gray-400"}`}>
              {o.status || "pending"}
            </span>
          </div>
        ))}
      </div>

      {/* ================= BOOKINGS ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative">
        <div className="flex items-center gap-2 mb-3">
          <FaClock className="text-green-400" />
          <h3 className="font-semibold">Recent Bookings</h3>
          <FaClipboardList
            className="cursor-pointer text-gray-400 ml-auto"
            onClick={() => navigate("/bookings")}
          />
        </div>
        {bookings.length === 0 && <p className="text-gray-500 text-sm">No bookings yet.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="flex justify-between py-2 border-b border-white/10">
            <span>Worker Request</span>
            <span className={`text-xs px-2 py-1 rounded-full ${BOOKING_STATUS_COLOR[b.status] || BOOKING_STATUS_COLOR.pending}`}>
              {b.status || "pending"}
            </span>
          </div>
        ))}
      </div>

      {/* ================= LIVE WORKERS ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FaMapMarkerAlt className="text-green-400" />
          <h3 className="font-semibold">Live Workers Near You</h3>
        </div>
        {liveWorkers.length === 0 && <p className="text-gray-500 text-sm">No workers live now.</p>}
        {liveWorkers.map((w) => (
          <div key={w.id} className="flex justify-between py-2 border-b border-white/10 items-center">
            <span>{w.service || "Worker"}</span>
            <button
              onClick={() => navigate(`/hire-worker/${w.worker_id}`)}
              className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition"
            >
              Hire
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
