import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";   // ← Adjust the path to your supabaseClient

const WorkerBookingCard = ({ booking, refresh }) => {
  const [loading, setLoading] = useState(false);

  const updateBookingStatus = async (newStatus) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("hire_requests")                    // ← Your bookings table
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Refresh the parent list after successful update
      if (refresh) refresh();

    } catch (err) {
      console.error("Error updating booking status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => updateBookingStatus("accepted");
  const handleReject = () => updateBookingStatus("cancelled");
  const handleStart = () => updateBookingStatus("in-progress");
  const handleComplete = () => updateBookingStatus("completed");

  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">

      <h2 className="text-white font-semibold">
        {booking.worker_name || booking.workerName}
      </h2>

      <p className="text-gray-400 text-sm">
        Client: {booking.client_name || booking.clientName}
      </p>

      <p className="text-gray-400 text-sm">
        Service: {booking.job_description || booking.service}
      </p>

      <p className="text-gray-400 text-sm">
        Location: {booking.location}
      </p>

      <p className="text-gray-400 text-sm">
        Price: ₦{booking.price?.toLocaleString() || booking.price}
      </p>

      <p className="text-gray-400 text-sm mt-2">
        Status: <span className="capitalize">{booking.status}</span>
      </p>

      <div className="flex gap-2 mt-4 flex-wrap">

        {booking.status === "pending" && (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-5 py-2 rounded text-white font-medium transition"
            >
              {loading ? "Processing..." : "Accept"}
            </button>

            <button
              onClick={handleReject}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 px-5 py-2 rounded text-white font-medium transition"
            >
              {loading ? "Processing..." : "Reject"}
            </button>
          </>
        )}

        {booking.status === "accepted" && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-5 py-2 rounded text-white font-medium transition"
          >
            {loading ? "Processing..." : "Start Work"}
          </button>
        )}

        {booking.status === "in-progress" && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 px-5 py-2 rounded text-white font-medium transition"
          >
            {loading ? "Processing..." : "Mark as Completed"}
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkerBookingCard;