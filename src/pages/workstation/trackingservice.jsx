const TRACKING_KEY = "workspaceTracking";

// get all tracking
export const getAllTracking = () => {
  return JSON.parse(localStorage.getItem(TRACKING_KEY)) || [];
};

// create tracking request
export const createTrackingRequest = (tracking) => {
  const allTracking = getAllTracking();

  allTracking.push(tracking);

  localStorage.setItem(TRACKING_KEY, JSON.stringify(allTracking));
};

// get worker tracking
export const getWorkerTracking = (workerId) => {
  const tracking = getAllTracking();

  return tracking.filter((t) => t.workerId === workerId);
};

// update tracking status
export const updateTrackingStatus = (id, status) => {
  const tracking = getAllTracking();

  const updated = tracking.map((t) =>
    t.id === id ? { ...t, status } : t
  );

  localStorage.setItem(TRACKING_KEY, JSON.stringify(updated));
};

// update progress
export const updateTrackingProgress = (id, progress) => {
  const tracking = getAllTracking();

  const updated = tracking.map((t) =>
    t.id === id ? { ...t, progress } : t
  );

  localStorage.setItem(TRACKING_KEY, JSON.stringify(updated));
};
