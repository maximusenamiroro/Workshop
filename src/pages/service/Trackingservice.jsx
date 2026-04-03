// src/services/trackingService.js

import { supabase } from "../../lib/supabaseClient";

/**
 * Get all tracking records for the current logged-in worker
 */
export const getWorkerTracking = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("worker_id", user.id)
      .in("status", ["accepted", "in-progress"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching worker tracking:", err);
    throw err;
  }
};

/**
 * Create a new tracking request (Worker starts tracking)
 */
export const createTrackingRequest = async (hireRequestId) => {
  try {
    const { error } = await supabase
      .from("hire_requests")
      .update({
        tracking_status: "Waiting for Client",
        distance: "0 km",
        updated_at: new Date().toISOString(),
      })
      .eq("id", hireRequestId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error creating tracking request:", err);
    throw err;
  }
};

/**
 * Update tracking status
 */
export const updateTrackingStatus = async (hireRequestId, newStatus) => {
  try {
    const { error } = await supabase
      .from("hire_requests")
      .update({
        tracking_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hireRequestId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating tracking status:", err);
    throw err;
  }
};

/**
 * Update tracking progress / distance
 */
export const updateTrackingProgress = async (hireRequestId, distance) => {
  try {
    const { error } = await supabase
      .from("hire_requests")
      .update({
        distance: distance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hireRequestId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating tracking progress:", err);
    throw err;
  }
};

/**
 * Complete a tracking job
 */
export const completeTrackingJob = async (hireRequestId) => {
  try {
    const { error } = await supabase
      .from("hire_requests")
      .update({
        status: "completed",
        tracking_status: "Completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", hireRequestId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error completing tracking job:", err);
    throw err;
  }
};

/**
 * Accept Tracking Request (used by TrackingRequestCard)
 */
export const acceptTracking = async (hireRequestId) => {
  return updateTrackingStatus(hireRequestId, "Active");
};

/**
 * Reject Tracking Request (used by TrackingRequestCard)
 */
export const rejectTracking = async (hireRequestId) => {
  return updateTrackingStatus(hireRequestId, "cancelled");
};