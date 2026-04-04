import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const TrackingDashboard = () => {
  const { user } = useAuth();
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")
        .select("id, job_description, location, status, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setTracking(data || []);
    } catch (err) {
      console.error("Error fetching tracking requests:", err);
      setError("Failed to load tracking requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadTracking();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "in_progress": return "bg-blue-500/20 text-blue-400";
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
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading tracking requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Tracking Dashboard</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {tracking.length === 0 ? (
        <p className="text-gray-400">No tracking requests found</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {tracking.map((t) => (
            <div
              key={t.id}
              className="bg-[#101623] p-4 rounded-xl border border-white/10 space-y-2"
            >
              <p className="font-semibold text-sm">
                {t.job_description || "Job Request"}
              </p>
              <p className="text-xs text-gray-400">📍 {t.location}</p>
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(t.status)}`}>
                  {t.status || "pending"}
                </span>
                <span className="text-xs text-gray-500">{formatDate(t.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackingDashboard;