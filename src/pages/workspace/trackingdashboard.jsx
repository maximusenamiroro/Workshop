import React, { useEffect, useState } from "react";
import TrackingRequestCard from "../../components/TrackingRequestCard";
import { getClientTracking } from "./wsptracking";

const TrackingDashboard = () => {

  const [tracking, setTracking] = useState([]);

  const loadTracking = () => {

    const user = JSON.parse(localStorage.getItem("workspaceUser"));

    if (user) {
      const data = getClientTracking(user.id);
      setTracking(data);
    }
  };

  useEffect(() => {
    loadTracking();
  }, []);

  return (
    <div className="bg-black min-h-screen p-6">

      <h1 className="text-2xl text-white font-bold mb-6">
        Tracking Requests
      </h1>

      {tracking.length === 0 ? (
        <p className="text-gray-400">
          No tracking requests
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {tracking.map((t) => (
            <TrackingRequestCard
              key={t.id}
              tracking={t}
              refresh={loadTracking}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default TrackingDashboard;
