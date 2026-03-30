const TRACKING_KEY = "workspaceTracking";

// get all tracking
export const getAllTracking = () => {
  return JSON.parse(localStorage.getItem(TRACKING_KEY)) || [];
};

// get client tracking
export const getClientTracking = (clientId) => {
  const tracking = getAllTracking();
  return tracking.filter((t) => t.clientId === clientId);
};

// accept tracking
export const acceptTracking = (id) => {
  const tracking = getAllTracking();

  const updated = tracking.map((t) =>
    t.id === id ? { ...t, status: "live", progress: "Tracking started" } : t
  );

  localStorage.setItem(TRACKING_KEY, JSON.stringify(updated));
};

// reject tracking
export const rejectTracking = (id) => {
  const tracking = getAllTracking();

  const updated = tracking.map((t) =>
    t.id === id ? { ...t, status: "rejected" } : t
  );

  localStorage.setItem(TRACKING_KEY, JSON.stringify(updated));
};
