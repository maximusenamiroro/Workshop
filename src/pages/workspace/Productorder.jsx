import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products"); // "products" or "bookings"
  const [productOrders, setProductOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Product Orders
  const fetchProductOrders = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("orders")
        .select("id, product_name, price, quantity, total_amount, status, created_at, product_image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setProductOrders(data || []);
    } catch (err) {
      console.error("Error fetching product orders:", err);
    }
  };

  // Fetch Bookings / Hire Requests
  const fetchBookings = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("hire_requests")
        .select("id, status, created_at, job_description, location, worker_id")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchProductOrders(), fetchBookings()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  const getProductStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/20 text-green-400";
      case "Processing": return "bg-yellow-500/20 text-yellow-400";
      case "Shipped": return "bg-blue-500/20 text-blue-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getBookingStatusColor = (status) => {
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
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">My Orders & Bookings</h1>
      </div>

      {/* TABS */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
            activeTab === "products" ? "bg-white text-black" : "text-white"
          }`}
        >
          Product Orders
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
            activeTab === "bookings" ? "bg-white text-black" : "text-white"
          }`}
        >
          Worker Bookings
        </button>
      </div>

      {/* PRODUCT ORDERS TAB */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {productOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>No product orders yet</p>
              <button
                onClick={() => navigate("/shop")}
                className="mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl"
              >
                Browse Shop
              </button>
            </div>
          ) : (
            productOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#101623] p-5 rounded-2xl border border-white/10"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">{order.product_name}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Qty: {order.quantity} • ₦{Number(order.total_amount || order.price * order.quantity || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getProductStatusColor(order.status)}`}>
                    {order.status || "Pending"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {formatDate(order.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* BOOKINGS / HIRE REQUESTS TAB */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>No bookings yet</p>
              <button
                onClick={() => navigate("/hire-worker")}
                className="mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl"
              >
                Hire a Worker
              </button>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#101623] p-5 rounded-2xl border border-white/10 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold flex-1">
                    {booking.job_description || "Job Request"}
                  </p>
                  <span className={`px-3 py-1 text-xs rounded-full ${getBookingStatusColor(booking.status)}`}>
                    {booking.status || "pending"}
                  </span>
                </div>

                <p className="text-sm text-gray-400">📍 {booking.location}</p>
                <p className="text-xs text-gray-500">{formatDate(booking.created_at)}</p>

                <div className="flex gap-3 pt-2">
                  {booking.status === "accepted" && (
                    <button
                      onClick={() => navigate(`/tracking/${booking.id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-sm font-semibold"
                    >
                      📍 Track Worker
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/hire-worker/${booking.worker_id}`)}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-semibold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}