import React, { useEffect, useState } from "react";
import TrackingRequestCard from "../../components/TrackingRequestCard";
import { supabase } from "../../lib/supabaseClient";   // ← Make sure this path is correct

const TrackingDashboard = () => {
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("workspaceUser"));

      if (!user?.id) {
        setError("User not found. Please log in again.");
        return;
      }

      // Fetch data from Supabase
      const { data, error: supabaseError } = await supabase
        .from("tracking_requests")           // ← Change table name if different
        .select("*")
        .eq("user_id", user.id)              // Assuming your column is user_id
        .order("created_at", { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setTracking(data || []);
    } catch (err) {
      console.error("Error fetching tracking requests:", err);
      setError("Failed to load tracking requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracking();
  }, []);

  if (loading) {
    return (
      <div className="bg-black min-h-screen p-6 flex items-center justify-center">
        <p className="text-gray-400">Loading tracking requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen p-6">
      <h1 className="text-2xl text-white font-bold mb-6">
        Tracking Requests
      </h1>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {tracking.length === 0 ? (
        <p className="text-gray-400">No tracking requests found</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {tracking.map((t) => (
            <TrackingRequestCard
              key={t.id}
              tracking={t}
              refresh={loadTracking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackingDashboard;