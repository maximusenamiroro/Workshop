const BOOKINGS_KEY = "workspaceBookings";

// get all bookings
export const getBookings = () => {
  return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
};

// save booking
export const saveBooking = (booking) => {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
};

// update booking status
export const updateBookingStatus = (id, status) => {
  const bookings = getBookings();

  const updated = bookings.map((b) =>
    b.id === id ? { ...b, status } : b
  );

  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
};

// get bookings by user
export const getUserBookings = (userId) => {
  const bookings = getBookings();
  return bookings.filter((b) => b.clientId === userId);
};
