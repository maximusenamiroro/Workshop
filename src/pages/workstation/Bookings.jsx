import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function Bookings() {
  const [groupedBookings, setGroupedBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in as a worker");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")
        .select("*")
        .eq("worker_id", user.id)
        .eq("status", "pending")                    // Only pending bookings
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      // Group by category
      const grouped = {};
      (data || []).forEach((booking) => {
        const category = booking.category || "For Hire";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(booking);
      });

      setGroupedBookings(grouped);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Accept Booking
  const acceptBooking = async (booking) => {
    try {
      const { error } = await supabase
        .from("hire_requests")
        .update({ 
          status: "accepted",
          updated_at: new Date().toISOString()
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Optionally move to tracking table or update tracking status
      alert("Booking Accepted!");
      loadBookings();                    // Refresh the list
    } catch (err) {
      console.error(err);
      alert("Failed to accept booking");
    }
  };

  // Decline Booking
  const declineBooking = async (booking) => {
    try {
      const { error } = await supabase
        .from("hire_requests")
        .update({ 
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", booking.id);

      if (error) throw error;

      alert("Booking Declined");
      loadBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to decline booking");
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
      <h2>Client Bookings</h2>
      <p style={subtitle}>
        Organized by category
      </p>

      {Object.keys(groupedBookings).length === 0 && (
        <p>No bookings yet</p>
      )}

      {Object.keys(groupedBookings).map((category) => (
        <div key={category}>
          <h3 style={categoryTitle}>{category}</h3>

          {groupedBookings[category].map((booking) => (
            <div key={booking.id} style={card}>
              <h4>{booking.title || booking.job_description}</h4>
              <p>{booking.description || booking.job_description}</p>
              <p>₦{booking.price}</p>
              <p style={location}>📍 {booking.location}</p>
              <p style={status}>Status: Pending</p>

              <div style={actions}>
                <button
                  style={acceptBtn}
                  onClick={() => acceptBooking(booking)}
                >
                  Accept
                </button>
                <button
                  style={declineBtn}
                  onClick={() => declineBooking(booking)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Your existing styles
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

const categoryTitle = {
  marginTop: 20,
  fontSize: 18,
  fontWeight: "bold",
  color: "#22c55e"
};

const card = {
  background: "#1e293b",
  padding: 15,
  borderRadius: 15,
  marginTop: 10
};

const location = { color: "#94a3b8" };
const status = { color: "#facc15", marginTop: 5 };
const actions = { display: "flex", gap: 10, marginTop: 10 };

const acceptBtn = {
  flex: 1,
  padding: 10,
  background: "green",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
};

const declineBtn = {
  flex: 1,
  padding: 10,
  background: "#334155",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
};

export default Bookings;