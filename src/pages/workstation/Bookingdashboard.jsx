import React, { useEffect, useState } from "react";
import WorkerBookingCard from "../../components/WorkerBookingCard";
import { supabase } from "../../lib/supabaseClient";

const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current logged-in worker
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view bookings");
        setBookings([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("hire_requests")
        .select(`
          *,
          clients (
            full_name
          )
        `)
        .eq("worker_id", user.id)                    // Only show jobs for this worker
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching worker bookings:", err);
      setError("Failed to load booking requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  if (loading) {
    return (
      <div className="bg-black min-h-screen p-6 flex items-center justify-center">
        <p className="text-gray-400">Loading booking requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen p-6">
      <h1 className="text-2xl text-white font-bold mb-6">
        Booking Requests
      </h1>

      {error && (
        <p className="text-red-400 mb-4">{error}</p>
      )}

      {bookings.length === 0 ? (
        <p className="text-gray-400">No booking requests yet</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <WorkerBookingCard
              key={booking.id}
              booking={booking}
              refresh={loadBookings}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingDashboard;