import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";   // ← Adjust the path to your supabaseClient file
function Activity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("workspaceUser"));

      if (!user?.id) {
        setError("Please log in to view your activity");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")                    // ← Table where your jobs are stored
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "Completed")                // Only completed jobs
        .order("completed_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setActivity(data || []);
    } catch (err) {
      console.error("Error loading activity:", err);
      setError("Failed to load activity history. Please try again.");
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
        Completed services and job history
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
          <p style={status}>Completed</p>

          {job.distance && (
            <p style={distance}>
              Distance Covered: {job.distance}
            </p>
          )}

          {job.completed_at && (
            <p style={time}>
              {new Date(job.completed_at).toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Your existing styles (you can later convert to Tailwind)
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
const distance = { color: "#facc15", marginTop: 5 };
const time = { color: "#94a3b8", marginTop: 5 };

export default Activity;