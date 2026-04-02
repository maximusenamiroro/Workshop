import { supabase } from "../../lib/supabaseClient";

/**
 * ===============================
 * CREATE TRACKING REQUEST
 * client requests worker tracking
 * ===============================
 */
export const createTrackingRequest = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from("tracking_requests")
      .insert([data])
      .select();

    if (error) throw error;
    return result[0];
  } catch (error) {
    console.error("Create tracking error:", error.message);
    return null;
  }
};

/**
 * ===============================
 * GET TRACKING REQUESTS
 * ===============================
 */
export const getTrackingRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("tracking_requests")
      .select("*")
      .or(`client_id.eq.${userId},worker_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fetch tracking error:", error.message);
    return [];
  }
};

/**
 * ===============================
 * ACCEPT TRACKING (worker accepts)
 * ===============================
 */
export const acceptTracking = async (trackingId) => {
  try {
    const { data, error } = await supabase
      .from("tracking_requests")
      .update({
        status: "accepted",
        accepted_at: new Date()
      })
      .eq("id", trackingId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Accept tracking error:", error.message);
    return null;
  }
};

/**
 * ===============================
 * START TRACKING
 * ===============================
 */
export const startTracking = async (trackingId) => {
  try {
    const { data, error } = await supabase
      .from("tracking_requests")
      .update({
        status: "tracking",
        started_at: new Date()
      })
      .eq("id", trackingId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Start tracking error:", error.message);
    return null;
  }
};

/**
 * ===============================
 * UPDATE WORKER LOCATION
 * ===============================
 */
export const updateWorkerLocation = async (
  trackingId,
  latitude,
  longitude
) => {
  try {
    const { data, error } = await supabase
      .from("tracking_requests")
      .update({
        worker_lat: latitude,
        worker_lng: longitude,
        updated_at: new Date()
      })
      .eq("id", trackingId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Location update error:", error.message);
    return null;
  }
};

/**
 * ===============================
 * END TRACKING
 * ===============================
 */
export const endTracking = async (trackingId) => {
  try {
    const { data, error } = await supabase
      .from("tracking_requests")
      .update({
        status: "completed",
        ended_at: new Date()
      })
      .eq("id", trackingId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("End tracking error:", error.message);
    return null;
  }
};

/**
 * ===============================
 * REALTIME TRACKING SUBSCRIPTION
 * ===============================
 */
export const subscribeToTracking = (trackingId, callback) => {
  return supabase
    .channel("tracking-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tracking_requests",
        filter: `id=eq.${trackingId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
};

/**
 * ===============================
 * REJECT TRACKING
 * ===============================
 */
export const rejectTracking = async (trackingId) => {
  try {
    const { data, error } = await supabase
      .from("tracking_requests")
      .update({
        status: "rejected",
        rejected_at: new Date()
      })
      .eq("id", trackingId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Reject tracking error:", error.message);
    return null;
  }
};