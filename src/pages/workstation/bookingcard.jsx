import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const WorkerBookingCard = ({ booking, refresh }) => {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("hire_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Refresh the parent dashboard
      if (refresh) refresh();
    } catch (err) {
      console.error("Error updating booking status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => updateStatus("accepted");
  const handleReject = () => updateStatus("cancelled");
  const handleStart = () => updateStatus("in-progress");
  const handleComplete = () => updateStatus("completed");

  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">

      <h3 className="text-white font-semibold text-lg mb-1">
        {booking.job_description || "Job Request"}
      </h3>

      <div className="space-y-1 text-sm text-gray-400 mb-5">
        <p>Client: {booking.clients?.full_name || booking.client_name || "Unknown Client"}</p>
        <p>Location: {booking.location || "N/A"}</p>
        <p>Price: ₦{Number(booking.price || 0).toLocaleString()}</p>
      </div>

      <div className="mb-4">
        <span
          className={`inline-block px-4 py-1.5 text-xs font-medium rounded-full capitalize
            ${booking.status === "pending" ? "bg-yellow-500 text-black" :
              booking.status === "accepted" ? "bg-blue-500" :
              booking.status === "in-progress" ? "bg-green-500" :
              booking.status === "completed" ? "bg-purple-500" : "bg-red-500"}`}
        >
          {booking.status || "Unknown"}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {booking.status === "pending" && (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 py-3 rounded-xl text-white font-medium transition"
            >
              {loading ? "Processing..." : "Accept Job"}
            </button>

            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 py-3 rounded-xl text-white font-medium transition"
            >
              {loading ? "Processing..." : "Decline"}
            </button>
          </>
        )}

        {booking.status === "accepted" && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 py-3 rounded-xl text-white font-medium transition"
          >
            {loading ? "Processing..." : "Start Work"}
          </button>
        )}

        {booking.status === "in-progress" && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 py-3 rounded-xl text-white font-medium transition"
          >
            {loading ? "Processing..." : "Mark as Completed"}
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkerBookingCard;