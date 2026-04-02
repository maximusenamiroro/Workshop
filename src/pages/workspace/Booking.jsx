import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";   // ← Adjust path if needed

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bookings from Supabase
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("workspaceUser"));

      if (!user?.id) {
        setError("Please log in to view bookings");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")                    // ← Your bookings table
        .select("*")
        .eq("user_id", user.id)                   // Show only this user's bookings
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setBookings(data || []);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Approve tracking (update status in Supabase)
  const approveTracking = async (booking) => {
    try {
      const { error: updateError } = await supabase
        .from("hire_requests")
        .update({
          tracking_status: "Active",        // Use snake_case for Supabase
          distance: "2.3 km",
          updated_at: new Date().toISOString()
        })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      alert("✅ Tracking Activated");
      loadBookings();                       // Refresh the list
    } catch (err) {
      console.error("Error approving tracking:", err);
      alert("Failed to approve tracking");
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  if (loading) {
    return (
      <div style={container}>
        <p>Loading bookings...</p>
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
      <h2>Bookings</h2>
      <p style={subtitle}>
        Approve worker tracking and monitor jobs
      </p>

      {bookings.length === 0 && (
        <p>No bookings yet</p>
      )}

      {bookings.map((job) => (
        <div key={job.id} style={card}>
          <h3>{job.worker_name || job.title}</h3>
          <p>{job.job_description || job.description}</p>
          <p>₦{job.price}</p>
          <p style={location}>📍 {job.location}</p>
          <p style={status}>Status: {job.status}</p>

          {job.tracking_status && (
            <p style={trackingStatus}>
              Tracking: {job.tracking_status}
            </p>
          )}

          <div style={actions}>
            {job.tracking_status === "Waiting for Client" && (
              <button
                style={approveBtn}
                onClick={() => approveTracking(job)}
              >
                Approve Tracking
              </button>
            )}

            {job.tracking_status === "Active" && (
              <button style={activeBtn}>
                Tracking Active
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Keep your existing styles (you can later move them to Tailwind)
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
const trackingStatus = { color: "#facc15", marginTop: 5 };
const actions = { marginTop: 10 };

const approveBtn = {
  width: "100%",
  padding: 10,
  background: "#22c55e",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
};

const activeBtn = {
  width: "100%",
  padding: 10,
  background: "#334155",
  border: "none",
  borderRadius: 8,
  color: "white"
};

export default Bookings;