import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const STATUS_STEPS = ["pending", "shipping", "on the way", "arriving", "delivered"];

const STATUS_CONFIG = {
  pending:    { color: "text-yellow-400", bg: "bg-yellow-500/20", emoji: "⏳" },
  shipping:   { color: "text-blue-400",   bg: "bg-blue-500/20",   emoji: "📦" },
  "on the way": { color: "text-blue-400", bg: "bg-blue-500/20",   emoji: "🚚" },
  arriving:   { color: "text-purple-400", bg: "bg-purple-500/20", emoji: "📍" },
  delivered:  { color: "text-green-400",  bg: "bg-green-500/20",  emoji: "✅" },
};

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const channelsRef = useRef([]);

  const [activeTab, setActiveTab] = useState("products");
  const [productOrders, setProductOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedOrderIds, setUpdatedOrderIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    fetchAll();
    setupRealtime();

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [user]);

  const setupRealtime = () => {
    // Real-time order status updates — ALL .on() before .subscribe()
    const ordersChannel = supabase
      .channel(`myorders_${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new;
        setProductOrders(prev =>
          prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o)
        );
        // Flash highlight on updated order
        setUpdatedOrderIds(prev => new Set([...prev, updated.id]));
        setTimeout(() => {
          setUpdatedOrderIds(prev => {
            const next = new Set(prev);
            next.delete(updated.id);
            return next;
          });
        }, 5000);
      })
      .subscribe(); // ← subscribe LAST

    // Real-time booking status updates
    const bookingsChannel = supabase
      .channel(`mybookings_${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "hire_requests",
        filter: `client_id=eq.${user.id}`,
      }, (payload) => {
        setBookings(prev =>
          prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b)
        );
      })
      .subscribe(); // ← subscribe LAST

    channelsRef.current = [ordersChannel, bookingsChannel];
  };

  const fetchAll = async () => {
    await Promise.all([fetchProductOrders(), fetchBookings()]);
    setLoading(false);
  };

  const fetchProductOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, product_name, product_image_url, price, quantity, total_amount, status, created_at, product_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProductOrders(data || []);
    } catch (err) {
      console.error("Error fetching product orders:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("hire_requests")
        .select("id, status, created_at, job_description, location, worker_id")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0B0F19] text-white pb-24">

      {/* HEADER */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 sticky top-0 bg-[#0B0F19]/95 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-1">←</button>
        <h1 className="text-lg font-bold">My Orders & Bookings</h1>
      </div>

      {/* TABS */}
      <div className="flex bg-white/5 mx-4 mt-4 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
            activeTab === "products" ? "bg-white text-black" : "text-white"
          }`}
        >
          📦 Orders
          {productOrders.filter(o => o.status !== "delivered").length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === "products" ? "bg-black/20 text-black" : "bg-green-500 text-white"
            }`}>
              {productOrders.filter(o => o.status !== "delivered").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
            activeTab === "bookings" ? "bg-white text-black" : "text-white"
          }`}
        >
          📋 Bookings
          {bookings.filter(b => b.status === "pending").length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === "bookings" ? "bg-black/20 text-black" : "bg-yellow-500 text-black"
            }`}>
              {bookings.filter(b => b.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      <div className="px-4 space-y-4">

        {/* PRODUCT ORDERS */}
        {activeTab === "products" && (
          <>
            {productOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-5xl mb-4">📦</p>
                <p>No product orders yet</p>
                <button
                  onClick={() => navigate("/reels")}
                  className="mt-4 bg-green-600 px-6 py-3 rounded-2xl text-white text-sm font-semibold"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              productOrders.map((order) => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const currentStep = STATUS_STEPS.indexOf(order.status);
                const isUpdated = updatedOrderIds.has(order.id);

                return (
                  <div
                    key={order.id}
                    className={`bg-[#101623] rounded-2xl border overflow-hidden transition-all duration-500 ${
                      isUpdated ? "border-green-500/50 shadow-lg shadow-green-500/10" : "border-white/10"
                    }`}
                  >
                    {/* Status updated flash */}
                    {isUpdated && (
                      <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400 font-semibold">Status updated by seller!</span>
                      </div>
                    )}

                    <div className="p-4">
                      {/* Product info */}
                      <div className="flex gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                          {order.product_image_url ? (
                            <img src={order.product_image_url} alt={order.product_name} className="w-full h-full object-cover" />
                          ) : <span className="text-2xl">📦</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{order.product_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.quantity && `Qty: ${order.quantity} • `}
                            {order.total_amount
                              ? `₦${Number(order.total_amount).toLocaleString()}`
                              : order.price
                                ? `₦${Number(order.price).toLocaleString()}`
                                : "Price on request"
                            }
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold self-start ${config.bg} ${config.color}`}>
                          {config.emoji} {order.status || "pending"}
                        </span>
                      </div>

                      {/* Progress tracker */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                              <div key={step} className="flex flex-col items-center flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                  isCompleted
                                    ? "bg-green-500 text-white"
                                    : "bg-zinc-700 text-gray-500"
                                } ${isCurrent ? "ring-2 ring-green-400 ring-offset-1 ring-offset-[#101623]" : ""}`}>
                                  {isCompleted ? (isCurrent ? STATUS_CONFIG[step]?.emoji : "✓") : idx + 1}
                                </div>
                                {idx < STATUS_STEPS.length - 1 && (
                                  <div className="hidden" /> // spacer handled by flex
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* Progress line */}
                        <div className="relative h-1 bg-zinc-700 rounded-full mx-3 -mt-3.5 mb-2">
                          <div
                            className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between px-1">
                          {STATUS_STEPS.map((step) => (
                            <span key={step} className="text-[9px] text-gray-500 capitalize" style={{ width: "20%", textAlign: "center" }}>
                              {step === "on the way" ? "on way" : step}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {order.product_id && (
                          <button
                            onClick={() => navigate(`/product/${order.product_id}`)}
                            className="flex-1 bg-white/10 hover:bg-white/15 py-2 rounded-xl text-xs font-medium transition active:scale-95"
                          >
                            View Product
                          </button>
                        )}
                        {order.status === "delivered" && (
                          <button
                            onClick={() => navigate(`/product/${order.product_id}`)}
                            className="flex-1 bg-green-600/20 text-green-400 py-2 rounded-xl text-xs font-medium transition active:scale-95"
                          >
                            Order Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* BOOKINGS */}
        {activeTab === "bookings" && (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-5xl mb-4">📋</p>
                <p>No bookings yet</p>
                <button
                  onClick={() => navigate("/hire-worker")}
                  className="mt-4 bg-green-600 px-6 py-3 rounded-2xl text-white text-sm font-semibold"
                >
                  Hire a Worker
                </button>
              </div>
            ) : (
              bookings.map((booking) => {
                const statusConfig = {
                  accepted: { color: "text-green-400", bg: "bg-green-500/20", emoji: "✅" },
                  rejected: { color: "text-red-400",   bg: "bg-red-500/20",   emoji: "❌" },
                  pending:  { color: "text-yellow-400", bg: "bg-yellow-500/20", emoji: "⏳" },
                }[booking.status] || { color: "text-yellow-400", bg: "bg-yellow-500/20", emoji: "⏳" };

                return (
                  <div key={booking.id} className="bg-[#101623] p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-semibold text-sm line-clamp-2">
                          {booking.job_description || "Job Request"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">📍 {booking.location}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(booking.created_at)}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.emoji} {booking.status || "pending"}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {booking.status === "accepted" && (
                        <>
                          <button
                            onClick={() => navigate(`/tracking/${booking.id}`)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95"
                          >
                            📍 Track Worker
                          </button>
                          <button
                            onClick={() => navigate(`/inbox?user=${booking.worker_id}`)}
                            className="flex-1 bg-white/10 hover:bg-white/15 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95"
                          >
                            💬 Message
                          </button>
                        </>
                      )}
                      {(!booking.status || booking.status === "pending") && (
                        <button
                          onClick={() => navigate(`/seller-profile/${booking.worker_id}`)}
                          className="flex-1 bg-white/10 hover:bg-white/15 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95"
                        >
                          View Worker →
                        </button>
                      )}
                      {booking.status === "rejected" && (
                        <button
                          onClick={() => navigate("/hire-worker")}
                          className="flex-1 bg-green-600 hover:bg-green-700 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95"
                        >
                          Find Another Worker
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}