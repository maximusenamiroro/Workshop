import React from "react";

const BookingCard = ({ booking }) => {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      
      <h3 className="text-white font-semibold">
        {booking.workerName}
      </h3>

      <p className="text-gray-400 text-sm">
        Service: {booking.service}
      </p>

      <p className="text-gray-400 text-sm">
        Date: {booking.date}
      </p>

      <p className="text-gray-400 text-sm">
        Time: {booking.time}
      </p>

      <p className="text-gray-400 text-sm">
        Price: ₦{booking.price}
      </p>

      <div className="mt-3">
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            booking.status === "pending"
              ? "bg-yellow-500"
              : booking.status === "accepted"
              ? "bg-blue-500"
              : booking.status === "in-progress"
              ? "bg-green-500"
              : booking.status === "completed"
              ? "bg-purple-500"
              : "bg-red-500"
          }`}
        >
          {booking.status}
        </span>
      </div>
    </div>
  );
};

export default BookingCard;
