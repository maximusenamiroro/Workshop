import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import "leaflet/dist/leaflet.css";

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
  const [session, setSession] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [otherLocation, setOtherLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingTracking, setStartingTracking] = useState(false);
  const [stoppingTracking, setStoppingTracking] = useState(false);
  // Client-specific: is client sharing their location
  const [clientSharing, setClientSharing] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const geoWatchRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    return () => {
      if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);
    };
  }, []);

  useEffect(() => {
    if (!bookingId || !user) return;
    loadAll();
  }, [bookingId, user]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: bookingData, error: bookingErr } = await supabase
        .from("hire_requests")
        .select("id, worker_id, client_id, job_description, status, location")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingErr) throw bookingErr;
      if (!bookingData) throw new Error("Booking not found");
      if (bookingData.status !== "accepted") throw new Error("Booking must be accepted to track");
      if (bookingData.worker_id !== user.id && bookingData.client_id !== user.id)
        throw new Error("You don't have access to this booking");

      setBooking(bookingData);

      const otherId = isWorker ? bookingData.client_id : bookingData.worker_id;
      const { data: profile } = await supabase
        .from("profiles").select("full_name")
        .eq("id", otherId).maybeSingle();
      setOtherUserName(profile?.full_name || (isWorker ? "Client" : "Worker"));

      const { data: sessionData } = await supabase
        .from("tracking_sessions").select("*")
        .eq("booking_id", bookingId).maybeSingle();

      if (sessionData) {
        setSession(sessionData);
        // Load other person's stored location
        if (isWorker && sessionData.client_lat && sessionData.client_lng) {
          setOtherLocation({ lat: sessionData.client_lat, lng: sessionData.client_lng });
        } else if (!isWorker && sessionData.worker_lat && sessionData.worker_lng) {
          setOtherLocation({ lat: sessionData.worker_lat, lng: sessionData.worker_lng });
        }
        setClientSharing(sessionData.client_location_shared || false);
        setUpdatedAt(sessionData.updated_at);
      }

      setLoading(false);

      // Start GPS immediately if session is active
      if (sessionData?.is_active) {
        startGPS(bookingData, sessionData);
      }
    } catch (err) {
      console.error("loadAll error:", err.message);
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Push my GPS coordinates to the correct column in tracking_sessions ──
  const startGPS = (bookingData, sessionData) => {
    if (!navigator.geolocation) return;
    if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);

    const pushLocation = async (lat, lng) => {
      setMyLocation({ lat, lng });
      const currentSession = sessionRef.current || sessionData;
      if (!currentSession?.id) return;

      // Workers update worker_lat/lng — clients update client_lat/lng
      const fields = isWorker
        ? { worker_lat: lat, worker_lng: lng, updated_at: new Date().toISOString() }
        : { client_lat: lat, client_lng: lng, client_location_shared: true, updated_at: new Date().toISOString() };

      await supabase.from("tracking_sessions")
        .update(fields).eq("id", currentSession.id);
    };

    navigator.geolocation.getCurrentPosition(
      pos => pushLocation(pos.coords.latitude, pos.coords.longitude),
      err => console.warn("GPS error:", err.message),
      { enableHighAccuracy: false, timeout: 10000 }
    );

    geoWatchRef.current = navigator.geolocation.watchPosition(
      pos => pushLocation(pos.coords.latitude, pos.coords.longitude),
      err => console.warn("GPS watch error:", err.message),
      { enableHighAccuracy: false, maximumAge: 5000, timeout: 15000 }
    );
  };

  // ── Real-time session updates ──────────────────────────────
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`tracking_session_${bookingId}`)
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "tracking_sessions",
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        const updated = payload.new;
        if (!updated) return;

        setSession(updated);
        setUpdatedAt(updated.updated_at);
        setClientSharing(updated.client_location_shared || false);

        // Update other person's location from their column
        if (isWorker && updated.client_lat && updated.client_lng) {
          setOtherLocation({ lat: updated.client_lat, lng: updated.client_lng });
        } else if (!isWorker && updated.worker_lat && updated.worker_lng) {
          setOtherLocation({ lat: updated.worker_lat, lng: updated.worker_lng });
        }

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

  // Recalculate distance whenever either location changes
  useEffect(() => {
    if (myLocation && otherLocation) {
      setDistance(haversine(
        myLocation.lat, myLocation.lng,
        otherLocation.lat, otherLocation.lng
      ));
    }
  }, [myLocation, otherLocation]);

  // ── Worker: start the session ──────────────────────────────
  const startTracking = async () => {
    if (!booking) return;
    setStartingTracking(true);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, timeout: 12000,
        })
      );
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
        .select().single();

      if (error) throw error;
      setSession(newSession);
      setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      showToast("🟢 Tracking started! Client can now see your location.");
      startGPS(booking, newSession);
    } catch (err) {
      if (err.code === 1) showToast("Location access denied. Enable GPS.", "error");
      else showToast("Failed to start: " + err.message, "error");
    } finally {
      setStartingTracking(false);
    }
  };

  // ── Worker: stop the session ───────────────────────────────
  const stopTracking = async () => {
    if (!session?.id) return;
    setStoppingTracking(true);
    try {
      await supabase.from("tracking_sessions")
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

  // ── Client: toggle sharing their location ─────────────────
  // Client can share their location even if worker hasn't started yet
  const toggleClientSharing = async () => {
    if (!booking) return;

    if (clientSharing) {
      // Stop sharing
      if (geoWatchRef.current) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      if (session?.id) {
        await supabase.from("tracking_sessions")
          .update({
            client_location_shared: false,
            client_lat: null,
            client_lng: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);
      }
      setClientSharing(false);
      setMyLocation(null);
      showToast("You stopped sharing your location");
      return;
    }

    // Start sharing — need a session to exist first
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, timeout: 12000,
        })
      );

      // If no session exists yet — create one (client can initiate)
      let currentSession = session;
      if (!currentSession) {
        const { data: newSession, error } = await supabase
          .from("tracking_sessions")
          .upsert({
            booking_id: bookingId,
            worker_id: booking.worker_id,
            client_id: booking.client_id,
            client_lat: pos.coords.latitude,
            client_lng: pos.coords.longitude,
            client_location_shared: true,
            is_active: false, // worker hasn't started yet
            updated_at: new Date().toISOString(),
          }, { onConflict: "booking_id" })
          .select().single();

        if (error) throw error;
        currentSession = newSession;
        setSession(newSession);
      } else {
        // Session exists — just update client location
        await supabase.from("tracking_sessions")
          .update({
            client_lat: pos.coords.latitude,
            client_lng: pos.coords.longitude,
            client_location_shared: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSession.id);
      }

      setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setClientSharing(true);
      showToast("📍 Worker can now see your location!");
      startGPS(booking, currentSession);
    } catch (err) {
      if (err.code === 1) showToast("Location access denied. Enable GPS.", "error");
      else showToast("Failed to share location: " + err.message, "error");
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
        <button onClick={() => navigate(-1)}
          className="bg-green-600 px-6 py-3 rounded-xl text-sm font-semibold">
          Go Back
        </button>
      </div>
    </div>
  );

  const isActive = session?.is_active;
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
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
          )}
          {clientSharing && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-400 font-medium">Client Live</span>
            </div>
          )}
        </div>
      </div>

      {/* ── WORKER CONTROLS ── */}
      {isWorker && (
        <div className="px-4 py-3 bg-[#1a1a1a] border-b border-white/10 space-y-3">
          {/* Worker location sharing */}
          {!isActive ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400">
                Start tracking so your client can see your location in real-time
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
                ) : "📍 Start Sharing My Location"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Your location is being shared
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {otherUserName} can see you on the map
                </p>
              </div>
              <button
                onClick={stopTracking}
                disabled={stoppingTracking}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50"
              >
                {stoppingTracking ? "Stopping..." : "Stop"}
              </button>
            </div>
          )}

          {/* Worker sees if client is sharing */}
          {clientSharing && otherLocation && (
            <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl p-2.5">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-xs text-blue-400">
                {otherUserName} is also sharing their location with you
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── CLIENT CONTROLS ── */}
      {!isWorker && (
        <div className="px-4 py-3 bg-[#1a1a1a] border-b border-white/10 space-y-3">
          {/* Worker status */}
          <div className="flex items-center gap-3">
            {!isActive ? (
              <>
                <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base">⏳</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-400">
                    Waiting for worker to start tracking
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {otherUserName} will share their location when they begin
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base">👷</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-400">
                    Worker is sharing their location
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Updated {formatTime(updatedAt)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Client: toggle sharing their own location with worker */}
          <div className={`rounded-xl p-3 border transition-all ${
            clientSharing
              ? "bg-blue-500/5 border-blue-500/20"
              : "bg-white/5 border-white/10"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  {clientSharing && (
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse inline-block" />
                  )}
                  {clientSharing ? "You are sharing your location" : "Share your location"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {clientSharing
                    ? `Worker can see where you are`
                    : "Let the worker know exactly where to come"
                  }
                </p>
              </div>
              <button
                onClick={toggleClientSharing}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 whitespace-nowrap ${
                  clientSharing
                    ? "bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {clientSharing ? "Stop Sharing" : "📍 Share My Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISTANCE BAR */}
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
              <p className="text-xs text-gray-500">
                {myLocation && !otherLocation
                  ? "Waiting for other location..."
                  : "Calculating..."}
              </p>
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
            <div className="text-center px-6">
              <p className="text-4xl mb-3">📡</p>
              {isWorker ? (
                <p className="text-sm">Tap "Start Sharing My Location" to begin</p>
              ) : (
                <div>
                  <p className="text-sm mb-2">No locations shared yet</p>
                  <p className="text-xs text-gray-600">
                    Tap "Share My Location" so the worker knows where to come,
                    or wait for the worker to start tracking first
                  </p>
                </div>
              )}
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

            {/* My marker */}
            {myLocation && (
              <Marker
                position={[myLocation.lat, myLocation.lng]}
                icon={isWorker ? workerIcon : clientIcon}
              >
                <Popup>
                  <div className="font-semibold text-black">
                    {isWorker ? "👷 You (Worker)" : "📍 You (Client)"}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Other person's marker */}
            {otherLocation && (isActive || clientSharing) && (
              <Marker
                position={[otherLocation.lat, otherLocation.lng]}
                icon={isWorker ? clientIcon : workerIcon}
              >
                <Popup>
                  <div className="text-black">
                    <p className="font-semibold">
                      {isWorker ? "👤 " : "👷 "}{otherUserName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Updated {formatTime(updatedAt)}
                    </p>
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
        {otherLocation && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isWorker ? "bg-blue-500" : "bg-green-500"}`} />
            <span className="text-xs text-gray-400">{otherUserName}</span>
          </div>
        )}
        {!otherLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-600">
              {isWorker ? "Client not sharing yet" : "Worker not sharing yet"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}