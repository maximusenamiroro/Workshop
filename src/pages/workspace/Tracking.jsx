import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const Tracking = () => {
  const { user } = useAuth();
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hire_requests")
        .select("id, job_description, location, status, created_at")
        .eq("client_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTracking(data || []);
    } catch (error) {
      console.error("Error fetching tracking:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadTracking();

    const channel = supabase
      .channel(`tracking_${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "hire_requests",
        filter: `client_id=eq.${user.id}`,
      }, () => loadTracking())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

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
      <p className="text-slate-400 mb-6">Monitor your active job requests</p>

      {tracking.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-4xl mb-4">📍</p>
          <p className="text-slate-400">No active jobs being tracked</p>
        </div>
      ) : (
        tracking.map((job) => (
          <div key={job.id} className="bg-[#1e293b] p-5 rounded-2xl mb-4">
            <h3 className="text-lg font-semibold mb-1">
              {job.job_description || "Job Request"}
            </h3>
            <p className="text-slate-300 text-sm mb-3">📍 {job.location}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                job.status === "accepted"
                  ? "bg-green-500/20 text-green-400"
                  : job.status === "in_progress"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {job.status}
              </span>
              {job.status === "in_progress" && (
                <span className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full">
                  ● Live Tracking
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Tracking;