import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import BottomNav from "../components/BottomNav";

function Tracking() {
  const [trackingJobs, setTrackingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view tracking");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")
        .select("*")
        .eq("worker_id", user.id)
        .in("status", ["accepted", "in-progress"])
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setTrackingJobs(data || []);
    } catch (err) {
      console.error("Error loading tracking:", err);
      setError("Failed to load tracking jobs");
    } finally {
      setLoading(false);
    }
  };

  // Worker starts tracking (sets status to "Waiting for Client")
  const startTracking = async (job) => {
    try {
      const { error } = await supabase
        .from("hire_requests")
        .update({
          tracking_status: "Waiting for Client",
          distance: "0 km",
          updated_at: new Date().toISOString()
        })
        .eq("id", job.id);

      if (error) throw error;

      alert("Tracking started! Waiting for client approval.");
      loadTracking();
    } catch (err) {
      console.error(err);
      alert("Failed to start tracking");
    }
  };

  // Complete the job
  const completeJob = async (job) => {
    try {
      const { error } = await supabase
        .from("hire_requests")
        .update({
          status: "completed",
          tracking_status: "Completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", job.id);

      if (error) throw error;

      alert("Job completed successfully!");
      loadTracking();
    } catch (err) {
      console.error(err);
      alert("Failed to complete job");
    }
  };

  useEffect(() => {
    loadTracking();
  }, []);

  if (loading) {
    return (
      <div style={container}>
        <p>Loading tracking jobs...</p>
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
      <h2>Tracking</h2>
      <p style={subtitle}>
        Manage scheduled jobs and tracking
      </p>

      {trackingJobs.length === 0 && (
        <p>No scheduled jobs for tracking</p>
      )}

      {trackingJobs.map((job) => (
        <div key={job.id} style={card}>
          <h3>{job.title || job.job_description}</h3>
          <p>{job.description || job.job_description}</p>
          <p>₦{job.price}</p>
          <p style={location}>📍 {job.location}</p>
          <p style={status}>
            Status: {job.tracking_status || job.status || "Unknown"}
          </p>

          {job.distance && (
            <p style={distance}>
              Distance: {job.distance}
            </p>
          )}

          <div style={actions}>
            {job.tracking_status === "Not Started" && (
              <button
                style={startBtn}
                onClick={() => startTracking(job)}
              >
                Start Tracking
              </button>
            )}

            {job.tracking_status === "Waiting for Client" && (
              <button style={waitingBtn}>
                Waiting for Client Approval
              </button>
            )}

            {job.tracking_status === "Active" && (
              <button
                style={completeBtn}
                onClick={() => completeJob(job)}
              >
                Complete Job
              </button>
            )}
          </div>
        </div>
      ))}

      <BottomNav />
    </div>
  );
}

// Keep your existing styles
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
const status = { color: "#22c55e", marginTop: 5 };
const distance = { color: "#facc15" };
const actions = { marginTop: 10 };

const startBtn = {
  width: "100%",
  padding: 10,
  background: "green",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
};

const waitingBtn = {
  width: "100%",
  padding: 10,
  background: "#334155",
  border: "none",
  borderRadius: 8,
  color: "white"
};

const completeBtn = {
  width: "100%",
  padding: 10,
  background: "#22c55e",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
};

export default Tracking;