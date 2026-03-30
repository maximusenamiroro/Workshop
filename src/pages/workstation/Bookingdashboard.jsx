import { useEffect, useState } from "react";

export default function Bookings() {

  const [bookings, setBookings] = useState([]);

  useEffect(() => {

    const stored =
      JSON.parse(localStorage.getItem("workspaceBookings")) || [];

    setBookings(stored);

  }, []);

  const acceptBooking = (id) => {

    const updated = bookings.map(b =>
      b.id === id
        ? { ...b, status: "Accepted" }
        : b
    );

    setBookings(updated);

    localStorage.setItem(
      "workspaceBookings",
      JSON.stringify(updated)
    );
  };

  return (
    <div className="p-4 bg-[#0B0F19] min-h-screen text-white">

      <h1 className="text-xl font-semibold mb-4">
        Bookings
      </h1>

      {bookings.map(booking => (

        <div
          key={booking.id}
          className="bg-[#121826] p-4 rounded-lg mb-3"
        >

          <h3 className="font-semibold">
            {booking.workerName}
          </h3>

          <p className="text-gray-400">
            {booking.date} | {booking.time}
          </p>

          <p className="text-green-400">
            {booking.status || "Pending"}
          </p>

          <button
            onClick={() => acceptBooking(booking.id)}
            className="bg-green-500 mt-2 px-3 py-1 rounded"
          >
            Accept Booking
          </button>

        </div>

      ))}

    </div>
  );
}
