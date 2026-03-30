import React, { useEffect, useState } from "react";
import BookingCard from "../../components/BookingCard";
import { getUserBookings } from "../service/bookingservice";

const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("workspaceUser"));
    if (user) {
      const data = getUserBookings(user.id);
      setBookings(data);
    }
  }, []);

  return (
    <div className="p-6 bg-black min-h-screen">

      <h1 className="text-2xl font-bold text-white mb-6">
        Your Bookings
      </h1>

      {bookings.length === 0 ? (
        <p className="text-gray-400">
          No bookings yet
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingDashboard;
