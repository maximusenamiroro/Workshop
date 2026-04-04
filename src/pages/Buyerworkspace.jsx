import { useState, useEffect } from "react";
import { FaClock, FaMapMarkerAlt, FaBell } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    const unsub = subscribeToOrders();
    return () => unsub?.();
  }, [user]);

  // ================= FETCH ALL =================
  const fetchAll = async () => {
    await Promise.all([fetchOrders(), fetchBookings(), fetchLiveWorkers()]);
    setLoading(false);
  };

  // ================= ORDERS =================
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, created_at, product_name, price")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) console.error("Fetch orders error:", error.message);
    setOrders(data || []);
  };

  // ================= REAL-TIME ORDERS =================
  const subscribeToOrders = () => {
    const channel = supabase
      .channel(`orders_changes_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id
                ? { ...o, status: payload.new.status }
                : o
            )
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // ================= BOOKINGS =================
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("hire_requests")
      .select("id, status, created_at, worker_id")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) console.error("Fetch bookings error:", error.message);
    setBookings(data || []);
  };

  // ================= LIVE WORKERS =================
  const fetchLiveWorkers = async () => {
    const { data, error } = await supabase
      .from("live_workers")
      .select("id, service, worker_id")
      .limit(10);

    if (error) console.error("Fetch live workers error:", error.message);
    setLiveWorkers(data || []);
  };

  // ================= HELPERS =================
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "text-green-400";
      case "arriving": return "text-yellow-400";
      case "on the way": return "text-blue-400";
      case "shipping": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const getBookingColor = (status) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
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
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
        <h1 className="text-xl font-semibold">Workspace</h1>
        <FaBell className="text-gray-400" />
      </div>

      <div className="px-4 md:px-8 py-4 space-y-6">

        {/* ================= PRODUCT ORDERS ================= */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
          <h2 className="mb-4 font-semibold">Product Orders</h2>

          {orders.length === 0 ? (
            <p className="text-gray-500 text-sm">No orders yet.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="min-w-[110px] flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-2 border-green-500">
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-xs mt-2 text-center">
                    {order.product_name || "Product"}
                  </p>
                  <p className={`text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status || "pending"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= BOOKINGS ================= */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
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
                    <p className="text-sm font-medium">Worker Request</p>
                    <p className="text-xs text-gray-500">{formatDate(b.created_at)}</p>
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
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
          <div className="flex gap-2 mb-4 items-center">
            <FaMapMarkerAlt className="text-green-400" />
            <h3 className="font-semibold">Live Workers Near You</h3>
          </div>

          {liveWorkers.length === 0 ? (
            <p className="text-gray-500 text-sm">No workers are live right now.</p>
          ) : (
            <div className="space-y-2">
              {liveWorkers.map((w) => (
                <div
                  key={w.id}
                  className="flex justify-between items-center py-2 border-b border-white/10"
                >
                  <div>
                    <p className="text-sm font-medium">Worker</p>
                    <p className="text-xs text-gray-500">{w.service}</p>
                  </div>
                  <button
                    onClick={() => navigate("/hire-worker")}
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

      </div>
    </div>
  );
}