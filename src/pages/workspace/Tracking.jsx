import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";   // ← Adjust path if needed

const Tracking = () => {
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tracking data from Supabase
  const loadTracking = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("tracking")                    // ← Change if your table name is different
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTracking(data || []);
    } catch (error) {
      console.error("Error fetching tracking:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription (much better than setInterval)
  useEffect(() => {
    loadTracking();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("tracking_changes")
      .on(
        "postgres_changes",
        {
          event: "*",                     // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "tracking",              // ← Your table name
        },
        (payload) => {
          console.log("Change received!", payload);
          loadTracking();                 // Refresh data when anything changes
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0f172a] min-h-screen text-white flex items-center justify-center">
        <p>Loading tracking data...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen text-white p-5 pb-20">
      <h2 className="text-2xl font-bold mb-2">Tracking</h2>
      <p className="text-slate-400 mb-6">
        Monitor worker distance and job progress
      </p>

      {tracking.length === 0 ? (
        <p className="text-slate-400 text-center py-10">No active tracking</p>
      ) : (
        tracking.map((job) => (
          <div
            key={job.id}
            className="bg-[#1e293b] p-5 rounded-2xl mb-4"
          >
            <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
            <p className="text-slate-300 text-sm mb-3">{job.description}</p>

            <div className="space-y-2 text-sm">
              <p>₦{job.price?.toLocaleString()}</p>
              <p>📍 {job.location}</p>
              <p className="text-green-400">
                Status: {job.trackingStatus || "Unknown"}
              </p>

              {job.distance && (
                <p className="text-yellow-400 font-bold">
                  Distance Covered: {job.distance}
                </p>
              )}
            </div>

            {job.trackingStatus === "Active" && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium">
                ● Live Kilometer Tracking
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Tracking;