import React from "react";
import { acceptTracking, rejectTracking } from "../services/trackingService";

const TrackingRequestCard = ({ tracking, refresh }) => {

  const handleAccept = () => {
    acceptTracking(tracking.id);
    refresh();
  };

  const handleReject = () => {
    rejectTracking(tracking.id);
    refresh();
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">

      <h2 className="text-white font-semibold">
        {tracking.workerName}
      </h2>

      <p className="text-gray-400 text-sm">
        Client: {tracking.clientName}
      </p>

      <p className="text-gray-400 text-sm">
        Status: {tracking.status}
      </p>

      <p className="text-gray-400 text-sm">
        Progress: {tracking.progress}
      </p>

      <p className="text-gray-400 text-sm">
        Started: {tracking.startedAt}
      </p>

      {tracking.status === "waiting" && (
        <div className="flex gap-2 mt-4">

          <button
            onClick={handleAccept}
            className="bg-green-600 px-3 py-1 rounded text-white"
          >
            Accept Tracking
          </button>

          <button
            onClick={handleReject}
            className="bg-red-600 px-3 py-1 rounded text-white"
          >
            Reject Tracking
          </button>

        </div>
      )}

      {tracking.status === "live" && (
        <div className="mt-4 text-green-400">
          Tracking Active
        </div>
      )}

    </div>
  );
};

export default TrackingRequestCard;
