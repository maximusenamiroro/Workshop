import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import "leaflet/dist/leaflet.css";

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const workerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);
  return null;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

function distanceLabel(dist) {
  if (!dist) return null;
  const d = parseFloat(dist);
  if (d < 0.1) return { text: "Very close!", color: "text-green-400" };
  if (d < 1) return { text: `${(d * 1000).toFixed(0)}m away`, color: "text-green-400" };
  if (d < 5) return { text: `${d} km away`, color: "text-yellow-400" };
  return { text: `${d} km away`, color: "text-red-400" };
}

export default function Tracking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { showToast, ToastUI } = useToast();

  const isWorker = role === "worker";

  const [booking, setBooking] = useState(null);
  const [otherUserName, setOtherUserName] = useState("");
  const [session, setSession] = useState(null); // tracking_sessions row
  const [myLocation, setMyLocation] = useState(null);
  const [otherLocation, setOtherLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingTracking, setStartingTracking] = useState(false);
  const [stoppingTracking, setStoppingTracking] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const geoWatchRef = useRef(null);
  const sessionRef = useRef(null);

  // Keep session ref in sync
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);
    };
  }, []);

  // Load booking + session on mount
  useEffect(() => {
    if (!bookingId || !user) return;
    loadAll();
  }, [bookingId, user]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Load booking
      const { data: bookingData, error: bookingErr } = await supabase
        .from("hire_requests")
        .select("id, worker_id, client_id, job_description, status, location")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingErr) throw bookingErr;
      if (!bookingData) throw new Error("Booking not found");
      if (bookingData.status !== "accepted") throw new Error("Booking must be accepted to track");

      // Verify this user belongs to this booking
      if (bookingData.worker_id !== user.id && bookingData.client_id !== user.id) {
        throw new Error("You don't have access to this booking");
      }

      setBooking(bookingData);

      // 2. Load other user's name
      const otherId = isWorker ? bookingData.client_id : bookingData.worker_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", otherId)
        .maybeSingle();
      setOtherUserName(profile?.full_name || (isWorker ? "Client" : "Worker"));

      // 3. Load existing tracking session
      const { data: sessionData } = await supabase
        .from("tracking_sessions")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (sessionData) {
        setSession(sessionData);
        // Set other person's location from session
        if (isWorker && sessionData.client_lat && sessionData.client_lng) {
          setOtherLocation({ lat: sessionData.client_lat, lng: sessionData.client_lng });
        } else if (!isWorker && sessionData.worker_lat && sessionData.worker_lng) {
          setOtherLocation({ lat: sessionData.worker_lat, lng: sessionData.worker_lng });
        }
        setUpdatedAt(sessionData.updated_at);
      }

      setLoading(false);

      // 4. Start watching GPS only if session is active
      if (sessionData?.is_active) {
        startGPS(bookingData, sessionData);
      }

    } catch (err) {
      console.error("loadAll error:", err.message);
      setError(err.message);
      setLoading(false);
    }
  };

  // GPS — watch my location and push to tracking_sessions
  const startGPS = (bookingData, sessionData) => {
    if (!navigator.geolocation) return;
    if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);

    const updateMyLocation = async (lat, lng) => {
      setMyLocation({ lat, lng });

      const currentSession = sessionRef.current || sessionData;
      if (!currentSession?.id) return;

      const updateField = isWorker
        ? { worker_lat: lat, worker_lng: lng, updated_at: new Date().toISOString() }
        : { client_lat: lat, client_lng: lng, updated_at: new Date().toISOString() };

      await supabase
        .from("tracking_sessions")
        .update(updateField)
        .eq("id", currentSession.id);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => updateMyLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: false, timeout: 10000 }
    );

    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => updateMyLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("GPS watch error:", err.message),
      { enableHighAccuracy: false, maximumAge: 5000, timeout: 15000 }
    );
  };

  // Real-time session updates
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`tracking_session_${bookingId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tracking_sessions",
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        const updated = payload.new;
        if (!updated) return;

        setSession(updated);
        setUpdatedAt(updated.updated_at);

        // Update other person's location
        if (isWorker && updated.client_lat && updated.client_lng) {
          setOtherLocation({ lat: updated.client_lat, lng: updated.client_lng });
        } else if (!isWorker && updated.worker_lat && updated.worker_lng) {
          setOtherLocation({ lat: updated.worker_lat, lng: updated.worker_lng });
        }

        // Session stopped
        if (!updated.is_active) {
          if (geoWatchRef.current) {
            navigator.geolocation.clearWatch(geoWatchRef.current);
            geoWatchRef.current = null;
          }
          showToast("Tracking session ended", "warning");
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [bookingId, isWorker]);

  // Calculate distance when either location changes
  useEffect(() => {
    if (myLocation && otherLocation) {
      setDistance(haversine(myLocation.lat, myLocation.lng, otherLocation.lat, otherLocation.lng));
    }
  }, [myLocation, otherLocation]);

  // Worker: start tracking session
  const startTracking = async () => {
    if (!booking) return;
    setStartingTracking(true);
    try {
      // Get initial GPS
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, timeout: 12000,
        });
      });

      const { data: newSession, error } = await supabase
        .from("tracking_sessions")
        .upsert({
          booking_id: bookingId,
          worker_id: booking.worker_id,
          client_id: booking.client_id,
          worker_lat: pos.coords.latitude,
          worker_lng: pos.coords.longitude,
          is_active: true,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "booking_id" })
        .select()
        .single();

      if (error) throw error;

      setSession(newSession);
      setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      showToast("🟢 Tracking started — client can now see you!");
      startGPS(booking, newSession);
    } catch (err) {
      if (err.code === 1) {
        showToast("Location access denied. Enable GPS to start tracking.", "error");
      } else {
        showToast("Failed to start tracking: " + err.message, "error");
      }
    } finally {
      setStartingTracking(false);
    }
  };

  // Worker: stop tracking session
  const stopTracking = async () => {
    if (!session?.id) return;
    setStoppingTracking(true);
    try {
      await supabase
        .from("tracking_sessions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", session.id);

      if (geoWatchRef.current) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      setSession(prev => ({ ...prev, is_active: false }));
      showToast("Tracking stopped");
    } catch (err) {
      showToast("Failed to stop tracking", "error");
    } finally {
      setStoppingTracking(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 30000) return "Just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center text-white gap-3">
      <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading tracking...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white p-4">
      <div className="text-center">
        <p className="text-5xl mb-4">📍</p>
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="bg-green-600 px-6 py-3 rounded-xl text-sm font-semibold">
          Go Back
        </button>
      </div>
    </div>
  );

  const isActive = session?.is_active;
  const hasSession = !!session;
  const distInfo = distanceLabel(distance);
  const mapCenter = myLocation || otherLocation || { lat: 6.5244, lng: 3.3792 };
  const positions = [
    myLocation && [myLocation.lat, myLocation.lng],
    otherLocation && [otherLocation.lat, otherLocation.lng],
  ].filter(Boolean);

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col">
      <ToastUI />

      {/* HEADER */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-[#0f0f0f] z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-xl p-1">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base">Live Tracking</h1>
          <p className="text-xs text-gray-400 truncate">{booking?.job_description || "Job tracking"}</p>
        </div>
        {isActive && (
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        )}
      </div>

      {/* WORKER CONTROLS */}
      {isWorker && (
        <div className="px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
          {!hasSession || !isActive ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400">
                {!hasSession
                  ? "Start tracking so your client can see your location in real-time"
                  : "Tracking is paused. Restart to share your location again."
                }
              </p>
              <button
                onClick={startTracking}
                disabled={startingTracking}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 py-3 rounded-xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-2"
              >
                {startingTracking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Getting location...
                  </>
                ) : (
                  "📍 Start Tracking"
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Your location is being shared
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Client: {otherUserName}</p>
              </div>
              <button
                onClick={stopTracking}
                disabled={stoppingTracking}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50"
              >
                {stoppingTracking ? "Stopping..." : "Stop Tracking"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CLIENT VIEW — waiting for worker or tracking active */}
      {!isWorker && (
        <div className="px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
          {!hasSession || !isActive ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-base">⏳</span>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-400">Waiting for worker to start tracking</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {otherUserName} will share their location when they start
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-base">👷</span>
              </div>
              <div>
                <p className="text-sm font-medium text-green-400">Worker is sharing location</p>
                <p className="text-xs text-gray-500 mt-0.5">Updated {formatTime(updatedAt)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DISTANCE + NAMES BAR */}
      {(myLocation || otherLocation) && (
        <div className="px-4 py-2.5 bg-[#111] border-b border-white/10 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-gray-500">{isWorker ? "Client" : "Worker"}</p>
            <p className="text-sm font-semibold">{otherUserName}</p>
          </div>
          <div className="text-center">
            {distInfo ? (
              <>
                <p className={`font-bold text-base ${distInfo.color}`}>{distInfo.text}</p>
                <p className="text-[10px] text-gray-500">from you</p>
              </>
            ) : (
              <p className="text-xs text-gray-500">Calculating...</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Updated</p>
            <p className="text-xs text-white">{formatTime(updatedAt)}</p>
          </div>
        </div>
      )}

      {/* MAP */}
      <div className="flex-1 relative">
        {!myLocation && !otherLocation ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-3">📡</p>
              <p className="text-sm">
                {isWorker
                  ? "Tap Start Tracking to begin sharing your location"
                  : "Waiting for worker to start tracking..."
                }
              </p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <FitBounds positions={positions} />

            {myLocation && (
              <Marker position={[myLocation.lat, myLocation.lng]} icon={isWorker ? workerIcon : clientIcon}>
                <Popup>
                  <div className="font-semibold text-black">
                    {isWorker ? "👷 You (Worker)" : "📍 You (Client)"}
                  </div>
                </Popup>
              </Marker>
            )}

            {otherLocation && isActive && (
              <Marker position={[otherLocation.lat, otherLocation.lng]} icon={isWorker ? clientIcon : workerIcon}>
                <Popup>
                  <div className="text-black">
                    <p className="font-semibold">{isWorker ? "👤 " : "👷 "}{otherUserName}</p>
                    <p className="text-xs text-gray-500">Updated {formatTime(updatedAt)}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>

      {/* LEGEND */}
      <div className="px-4 py-3 bg-[#1a1a1a] border-t border-white/10 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isWorker ? "bg-green-500" : "bg-blue-500"}`} />
          <span className="text-xs text-gray-400">You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isWorker ? "bg-blue-500" : "bg-green-500"}`} />
          <span className="text-xs text-gray-400">{otherUserName}</span>
        </div>
      </div>
    </div>
  );
}