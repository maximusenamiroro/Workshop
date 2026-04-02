// src/services/workerBookingService.js

import { supabase } from "../supabaseClient";

/**
 * Get all bookings for a specific worker
 */
export const getWorkerBookings = async (workerId) => {
  try {
    const { data, error } = await supabase
      .from("hire_requests")
      .select(`
        *,
        clients (
          full_name
        )
      `)
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching worker bookings:", err);
    throw err;
  }
};

/**
 * Update booking status (Accept, Reject, Start, Complete, etc.)
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
 * Optional: Get a single booking by ID
 */
export const getBookingById = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching booking:", err);
    throw err;
  }
};