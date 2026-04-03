// src/services/workerBookingService.js

import { supabase } from "../supabaseClient";

/**
 * Get all bookings for the current logged-in worker
 */
export const getWorkerBookings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("hire_requests")
      .select(`
        *,
        clients (
          full_name
        )
      `)
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching worker bookings:", err);
    throw err;
  }
};

/**
 * Update booking status (Accept, Reject, Start, Complete, Cancel, etc.)
 */
export const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    const { error } = await supabase
      .from("hire_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) throw error;

    return true;
  } catch (err) {
    console.error("Error updating booking status:", err);
    throw err;
  }
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from("hire_requests")
      .select(`
        *,
        clients (
          full_name
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching booking by ID:", err);
    throw err;
  }
};