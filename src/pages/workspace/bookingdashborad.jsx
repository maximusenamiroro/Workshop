import React, { useEffect, useState } from "react";
import BookingCard from "../../components/BookingCard";
import { supabase } from "../../lib/supabaseClient";   // ← Make sure path is correct

const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("workspaceUser"));

      if (!user?.id) {
        setError("Please log in to view your bookings");
        setBookings([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")                 // ← Table name for bookings/hire requests
        .select(`
          *,
          workers (
            name,
            role,
            image
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-black min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">
        Your Bookings
      </h1>

      {error && (
        <p className="text-red-400 mb-4">{error}</p>
      )}

      {bookings.length === 0 ? (
        <p className="text-gray-400">No bookings yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingDashboard;