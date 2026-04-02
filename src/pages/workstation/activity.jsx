import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";   // ← Adjust path if needed
import BottomNav from "../components/BottomNav";

function Activity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view activity");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")
        .select(`
          *,
          workers (
            name,
            role
          )
        `)
        .eq("worker_id", user.id)           // Show only jobs assigned to this worker
        .eq("status", "Completed")          // Only completed jobs
        .order("completed_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setActivity(data || []);
    } catch (err) {
      console.error("Error loading activity:", err);
      setError("Failed to load activity history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  if (loading) {
    return (
      <div style={container}>
        <p>Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={container}>
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={container}>
      <h2>Activity</h2>
      <p style={subtitle}>
        Completed jobs and history
      </p>

      {activity.length === 0 && (
        <p>No completed jobs yet</p>
      )}

      {activity.map((job) => (
        <div key={job.id} style={card}>
          <h3>{job.worker_name || job.title}</h3>
          <p>{job.job_description || job.description}</p>
          <p>₦{job.price}</p>
          <p style={location}>📍 {job.location}</p>
          <p style={status}>Status: Completed</p>

          {job.distance && (
            <p style={distance}>
              Distance: {job.distance}
            </p>
          )}

          {job.completed_at && (
            <p style={time}>
              Completed: {new Date(job.completed_at).toLocaleString()}
            </p>
          )}
        </div>
      ))}

      <BottomNav />
    </div>
  );
}

// Keep your existing styles for now
const container = {
  background: "#0f172a",
  minHeight: "100vh",
  color: "white",
  padding: 20,
  paddingBottom: 80
};

const subtitle = {
  color: "#94a3b8",
  marginBottom: 20
};

const card = {
  background: "#1e293b",
  padding: 15,
  borderRadius: 15,
  marginTop: 10
};

const location = { color: "#94a3b8" };
const status = { color: "#22c55e" };
const distance = { color: "#facc15" };
const time = { color: "#94a3b8", marginTop: 5 };

export default Activity;