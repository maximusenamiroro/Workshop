import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom worker marker (green)
const workerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom client marker (blue)
const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to fit map bounds to show both markers
function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);

  return null;
}

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

export default function Tracking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [workerLocation, setWorkerLocation] = useState(null);
  const [clientLocation, setClientLocation] = useState(null);
  const [workerName, setWorkerName] = useState("Worker");
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const geoWatchRef = useRef(null);

  // Get booking details
  useEffect(() => {
    if (!bookingId || !user) return;
    fetchBooking();
  }, [bookingId, user]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("hire_requests")
        .select("id, worker_id, job_description, status, location")
        .eq("id", bookingId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Booking not found");
      if (data.status !== "accepted") throw new Error("Booking is not accepted yet");

      setBooking(data);

      // Get worker name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.worker_id)
        .maybeSingle();

      setWorkerName(profile?.full_name || "Worker");

      // Get initial worker location
      await fetchWorkerLocation(data.worker_id);

      setLoading(false);
    } catch (err) {
      console.error("fetchBooking error:", err.message);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchWorkerLocation = async (workerId) => {
    try {
      const { data, error } = await supabase
        .from("live_workers")
        .select("lat, lng, last_seen")
        .eq("worker_id", workerId)
        .maybeSingle();

      if (error) throw error;

      if (data?.lat && data?.lng) {
        setWorkerLocation({ lat: data.lat, lng: data.lng });
        setLastSeen(data.last_seen);
      }
    } catch (err) {
      console.error("fetchWorkerLocation error:", err.message);
    }
  };

  // Get client GPS location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setClientLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Client GPS error:", err);
        setError("Please allow location access to track the worker");
      },
      { enableHighAccuracy: true }
    );

    // Watch client position
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setClientLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("GPS watch error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (geoWatchRef.current) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
    };
  }, []);

  // Real-time worker location updates
  useEffect(() => {
    if (!booking?.worker_id) return;

    const channel = supabase
      .channel(`tracking_${booking.worker_id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "live_workers",
        filter: `worker_id=eq.${booking.worker_id}`,
      }, (payload) => {
        const { lat, lng, last_seen } = payload.new;
        if (lat && lng) {
          setWorkerLocation({ lat, lng });
          setLastSeen(last_seen);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [booking?.worker_id]);

  // Calculate distance whenever either location changes
  useEffect(() => {
    if (clientLocation && workerLocation) {
      const dist = calculateDistance(
        clientLocation.lat,
        clientLocation.lng,
        workerLocation.lat,
        workerLocation.lng
      );
      setDistance(dist);
    }
  }, [clientLocation, workerLocation]);

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return "Unknown";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 30000) return "Just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const getDistanceLabel = (dist) => {
    if (!dist) return null;
    const d = parseFloat(dist);
    if (d < 0.1) return { label: "Very close!", color: "text-green-400" };
    if (d < 1) return { label: `${(d * 1000).toFixed(0)}m away`, color: "text-green-400" };
    if (d < 5) return { label: `${d} km away`, color: "text-yellow-400" };
    return { label: `${d} km away`, color: "text-red-400" };
  };

  // Loading state
  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center text-white gap-3">
      <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading tracking...</p>
    </div>
  );

  // Error state
  if (error) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white p-4">
      <div className="text-center">
        <p className="text-5xl mb-4">📍</p>
        <p className="text-red-400 mb-2">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-green-600 px-6 py-2 rounded-xl text-sm"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  const mapCenter = workerLocation || clientLocation || { lat: 6.5244, lng: 3.3792 }; // Default Lagos
  const positions = [
    clientLocation && [clientLocation.lat, clientLocation.lng],
    workerLocation && [workerLocation.lat, workerLocation.lng],
  ].filter(Boolean);

  const distanceInfo = getDistanceLabel(distance);

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col">

      {/* HEADER */}
      <div className="p-4 flex items-center gap-3 border-b border-white/10 z-10 bg-[#0f0f0f]">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white text-xl"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Live Tracking</h1>
          <p className="text-xs text-gray-400 truncate">
            {booking?.job_description || "Tracking worker"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="px-4 py-3 bg-[#1a1a1a] flex justify-between items-center border-b border-white/10">
        <div>
          <p className="text-xs text-gray-400">Worker</p>
          <p className="font-semibold text-sm">{workerName}</p>
        </div>

        <div className="text-center">
          {distance ? (
            <>
              <p className={`font-bold text-lg ${distanceInfo?.color}`}>
                {distanceInfo?.label}
              </p>
              <p className="text-xs text-gray-400">from you</p>
            </>
          ) : (
            <p className="text-xs text-gray-400">Calculating distance...</p>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">Last update</p>
          <p className="text-xs text-white">{formatLastSeen(lastSeen)}</p>
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 relative">
        {!workerLocation && !clientLocation ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-3">📡</p>
              <p>Waiting for location data...</p>
              <p className="text-sm mt-2">Make sure location is enabled</p>
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <FitBounds positions={positions} />

            {/* Client Marker */}
            {clientLocation && (
              <Marker
                position={[clientLocation.lat, clientLocation.lng]}
                icon={clientIcon}
              >
                <Popup>
                  <div className="text-black font-semibold">📍 You are here</div>
                </Popup>
              </Marker>
            )}

            {/* Worker Marker */}
            {workerLocation && (
              <Marker
                position={[workerLocation.lat, workerLocation.lng]}
                icon={workerIcon}
              >
                <Popup>
                  <div className="text-black">
                    <p className="font-semibold">👷 {workerName}</p>
                    <p className="text-xs text-gray-600">
                      Updated: {formatLastSeen(lastSeen)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}

        {/* Worker offline warning */}
        {!workerLocation && (
          <div className="absolute bottom-4 left-4 right-4 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 p-3 rounded-xl text-sm text-center z-50">
            ⚠️ Worker location not available — they may not be live yet
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div className="p-4 bg-[#1a1a1a] border-t border-white/10 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-400">Your location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400">{workerName}</span>
        </div>
      </div>
    </div>
  );
}