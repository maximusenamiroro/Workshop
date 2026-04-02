import React from "react";

const BookingCard = ({ booking }) => {
  // Helper to get nice status color
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500 text-black";
      case "accepted":
        return "bg-blue-500";
      case "in-progress":
        return "bg-green-500";
      case "completed":
        return "bg-purple-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition">
      
      <h3 className="text-white font-semibold text-lg mb-1">
        {booking.worker_name || booking.workerName || "Unknown Worker"}
      </h3>

      <p className="text-gray-400 text-sm mb-1">
        Service: {booking.job_description || booking.service || "N/A"}
      </p>

      {booking.location && (
        <p className="text-gray-400 text-sm mb-1">
          📍 {booking.location}
        </p>
      )}

      {booking.date && (
        <p className="text-gray-400 text-sm mb-1">
          Date: {booking.date}
        </p>
      )}

      {booking.time && (
        <p className="text-gray-400 text-sm mb-1">
          Time: {booking.time}
        </p>
      )}

      <p className="text-green-400 text-sm font-medium mt-2">
        Price: ₦{Number(booking.price || 0).toLocaleString()}
      </p>

      <div className="mt-4">
        <span
          className={`inline-block px-4 py-1.5 text-sm font-medium rounded-full capitalize ${getStatusStyle(booking.status)}`}
        >
          {booking.status || "Unknown"}
        </span>
      </div>
    </div>
  );
};

export default BookingCard;