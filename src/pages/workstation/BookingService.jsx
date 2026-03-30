const BOOKINGS_KEY = "workspaceBookings";

export const getAllBookings = () => {
  return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
};

export const getWorkerBookings = (workerId) => {
  const bookings = getAllBookings();
  return bookings.filter((b) => b.workerId === workerId);
};

export const updateBookingStatus = (id, status) => {
  const bookings = getAllBookings();

  const updated = bookings.map((b) =>
    b.id === id ? { ...b, status } : b
  );

  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
};
