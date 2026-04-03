import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view your bookings");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("orders")                          // Client uses "orders" table
        .select("*")
        .eq("user_id", user.id)
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
      <h2>Product Orders</h2>
      <p style={subtitle}>Your placed orders</p>

      {bookings.length === 0 && (
        <p>No orders yet</p>
      )}

      {bookings.map((order) => (
        <div key={order.id} style={card}>
          <h3>{order.product_name}</h3>
          <p>₦{Number(order.price).toLocaleString()}</p>
          <p>Quantity: {order.quantity}</p>
          <p style={status}>Status: {order.status || "Processing"}</p>
          <p style={time}>
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// Styles
const container = {
  background: "#0f172a",
  minHeight: "100vh",
  color: "white",
  padding: 20,
  paddingBottom: 80
};

const subtitle = { color: "#94a3b8", marginBottom: 20 };
const card = {
  background: "#1e293b",
  padding: 15,
  borderRadius: 15,
  marginTop: 10
};
const status = { color: "#22c55e" };
const time = { color: "#94a3b8", marginTop: 5 };

export default Bookings;