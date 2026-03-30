import React from "react";
import { updateBookingStatus } from "../services/workerBookingService";

const WorkerBookingCard = ({ booking, refresh }) => {

  const handleAccept = () => {
    updateBookingStatus(booking.id, "accepted");
    refresh();
  };

  const handleReject = () => {
    updateBookingStatus(booking.id, "cancelled");
    refresh();
  };

  const handleStart = () => {
    updateBookingStatus(booking.id, "in-progress");
    refresh();
  };

  const handleComplete = () => {
    updateBookingStatus(booking.id, "completed");
    refresh();
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">

      <h2 className="text-white font-semibold">
        {booking.workerName}
      </h2>

      <p className="text-gray-400 text-sm">
        Client: {booking.clientName}
      </p>

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

      <p className="text-gray-400 text-sm mt-2">
        Status: {booking.status}
      </p>

      <div className="flex gap-2 mt-4">

        {booking.status === "pending" && (
          <>
            <button
              onClick={handleAccept}
              className="bg-green-600 px-3 py-1 rounded text-white"
            >
              Accept
            </button>

            <button
              onClick={handleReject}
              className="bg-red-600 px-3 py-1 rounded text-white"
            >
              Reject
            </button>
          </>
        )}

        {booking.status === "accepted" && (
          <button
            onClick={handleStart}
            className="bg-blue-600 px-3 py-1 rounded text-white"
          >
            Start Work
          </button>
        )}

        {booking.status === "in-progress" && (
          <button
            onClick={handleComplete}
            className="bg-purple-600 px-3 py-1 rounded text-white"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkerBookingCard;
