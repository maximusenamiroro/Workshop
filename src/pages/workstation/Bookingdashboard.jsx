import React, { useEffect, useState } from "react";
import WorkerBookingCard from "../../components/WorkerBookingCard";
import { getWorkerBookings } from "../../services/workerBookingService";

const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);

  const loadBookings = () => {
    const worker = JSON.parse(localStorage.getItem("workstationUser"));

    if (worker) {
      const data = getWorkerBookings(worker.id);
      setBookings(data);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="bg-black min-h-screen p-6">

      <h1 className="text-2xl text-white font-bold mb-6">
        Booking Requests
      </h1>

      {bookings.length === 0 ? (
        <p className="text-gray-400">
          No booking requests
        </p>
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
