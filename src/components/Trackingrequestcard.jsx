import React, { useState } from "react";
import { updateTrackingStatus } from "../pages/service/trackingService";   // Make sure this path is correct

const TrackingRequestCard = ({ tracking, refresh }) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await updateTrackingStatus(tracking.id, "Active");
      if (refresh) refresh();
    } catch (err) {
      alert("Failed to accept tracking");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await updateTrackingStatus(tracking.id, "cancelled");
      if (refresh) refresh();
    } catch (err) {
      alert("Failed to reject tracking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">

      <h3 className="text-white font-semibold text-lg mb-2">
        {tracking.worker_name || tracking.workerName}
      </h3>

      <div className="text-sm text-gray-400 space-y-1 mb-4">
        <p>Client: {tracking.client_name || tracking.clientName}</p>
        <p>Status: {tracking.status}</p>
        <p>Progress: {tracking.progress || "Not started"}</p>
      </div>

      {tracking.status === "waiting" && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-xl text-white font-medium transition"
          >
            {loading ? "Processing..." : "Accept Tracking"}
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-3 rounded-xl text-white font-medium transition"
          >
            {loading ? "Processing..." : "Reject Tracking"}
          </button>
        </div>
      )}

      {tracking.status === "live" && (
        <div className="mt-4 text-green-400 font-medium">
          ● Tracking Active
        </div>
      )}
    </div>
  );
};

export default TrackingRequestCard;