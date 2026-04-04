import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const BookingDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")
        .select("id, status, created_at, job_description, location, worker_id")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const getStatusColor = (status) => {
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
      <div className="p-6 bg-black min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Your Bookings</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {bookings.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-400 mb-4">No bookings yet</p>
          <button
            onClick={() => navigate("/hire-worker")}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-xl text-white font-semibold"
          >
            Hire a Worker
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-[#101623] p-4 rounded-xl border border-white/10 space-y-2"
            >
              <div className="flex justify-between items-start">
                <p className="font-semibold text-white text-sm">
                  {booking.job_description || "Job Request"}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status || "pending"}
                </span>
              </div>
              <p className="text-xs text-gray-400">📍 {booking.location}</p>
              <p className="text-xs text-gray-500">{formatDate(booking.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingDashboard;