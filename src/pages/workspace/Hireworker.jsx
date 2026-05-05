import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 0.1) return { text: "Very close", color: "text-green-400" };
  if (km < 1) return { text: `${(km * 1000).toFixed(0)}m away`, color: "text-green-400" };
  if (km < 5) return { text: `${km.toFixed(1)} km away`, color: "text-yellow-400" };
  if (km < 20) return { text: `${km.toFixed(1)} km away`, color: "text-orange-400" };
  return { text: `${km.toFixed(0)} km away`, color: "text-red-400" };
}

export default function HireWorker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast, ToastUI } = useToast();

  const categoryParam = searchParams.get("category");
  const typeFilter = searchParams.get("type");

  const [worker, setWorker] = useState(null);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [clientLocation, setClientLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState("");
  const [workerLocation, setWorkerLocation] = useState("");
  const [error, setError] = useState(null);

  // Get client location first — used for distance sorting
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setClientLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        // Permission denied or unavailable — still show workers, just unsorted
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  // Fetch workers after location attempt completes
  useEffect(() => {
    if (locationLoading) return; // wait for GPS attempt
    fetchWorkers();
  }, [id, categoryParam, typeFilter, locationLoading]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (id) {
        // Single worker mode
        const { data: liveData } = await supabase
          .from("live_workers")
          .select("worker_id, service, lat, lng, profiles(full_name, avatar_url, country)")
          .eq("worker_id", id)
          .maybeSingle();

        if (liveData) {
          const { data: workerData } = await supabase
            .from("workers")
            .select("category, location")
            .eq("id", id)
            .maybeSingle();

          let distanceKm = null;
          if (clientLocation && liveData.lat && liveData.lng) {
            distanceKm = haversine(clientLocation.lat, clientLocation.lng, liveData.lat, liveData.lng);
          }

          setWorker({
            id: liveData.worker_id,
            category: workerData?.category || liveData.service || "General Worker",
            location: workerData?.location || null,
            lat: liveData.lat,
            lng: liveData.lng,
            distanceKm,
            profiles: liveData.profiles,
          });
        } else {
          const { data: workerData } = await supabase
            .from("workers")
            .select("id, category, location, profiles(full_name, avatar_url, country)")
            .eq("id", id)
            .maybeSingle();

          if (workerData) setWorker(workerData);
          else setError("Worker not found or not currently live");
        }
      } else {
        // Browse mode
        const { data: liveData, error: liveError } = await supabase
          .from("live_workers")
          .select("id, service, worker_id, lat, lng, last_seen, profiles(full_name, avatar_url, country)")
          .limit(100);

        if (liveError) throw liveError;

        const workerIds = (liveData || []).map(w => w.worker_id);

        let categoryMap = {};
        let locationMap = {};
        if (workerIds.length > 0) {
          const { data: workersData } = await supabase
            .from("workers")
            .select("id, category, location")
            .in("id", workerIds);
          (workersData || []).forEach(w => {
            categoryMap[w.id] = w.category;
            locationMap[w.id] = w.location;
          });
        }

        let merged = (liveData || []).map(w => {
          // Calculate distance if client location is available
          let distanceKm = null;
          if (clientLocation && w.lat && w.lng) {
            distanceKm = haversine(clientLocation.lat, clientLocation.lng, w.lat, w.lng);
          }

          return {
            ...w,
            workerCategory: categoryMap[w.worker_id] || null,
            workerLocation: locationMap[w.worker_id] || w.profiles?.country || null,
            isGeneral: !categoryMap[w.worker_id],
            distanceKm,
          };
        });

        // Filter
        if (typeFilter === "general") {
          merged = merged.filter(w => w.isGeneral);
        } else if (categoryParam) {
          merged = merged.filter(w =>
            w.workerCategory?.toLowerCase() === categoryParam.toLowerCase()
          );
        }

        // Sort: if we have client location → sort by distance
        // If no client location → sort by most recently active
        if (clientLocation) {
          merged.sort((a, b) => {
            // Workers with no GPS go to the bottom
            if (a.distanceKm === null && b.distanceKm === null) return 0;
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
          });
        } else {
          // Sort by last_seen (most recent first)
          merged.sort((a, b) => {
            if (!a.last_seen) return 1;
            if (!b.last_seen) return -1;
            return new Date(b.last_seen) - new Date(a.last_seen);
          });
        }

        setLiveWorkers(merged);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async () => {
    if (!job.trim() || !workerLocation.trim()) {
      showToast("Please fill in both job description and location", "warning");
      return;
    }
    if (!user) { navigate("/login"); return; }
    if (!worker?.id) { showToast("Worker not found", "error"); return; }

    try {
      setSubmitting(true);
      const { error: insertError } = await supabase
        .from("hire_requests")
        .insert({
          client_id: user.id,
          worker_id: worker.id,
          job_description: job.trim(),
          location: workerLocation.trim(),
          status: "pending",
        });

      if (insertError) throw insertError;
      showToast("Request sent successfully!");
      setTimeout(() => navigate("/workspace"), 1000);
    } catch (err) {
      showToast("Failed to send request: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || locationLoading) return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white gap-3">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">
        {locationLoading ? "Getting your location..." : "Loading workers..."}
      </p>
    </div>
  );

  // BROWSE MODE
  if (!id) {
    const isGeneral = typeFilter === "general";
    const pageTitle = isGeneral ? "General Workers" : categoryParam || "Live Workers";

    return (
      <div className="min-h-screen bg-[#0B0F19] text-white p-4 pb-24">
        <ToastUI />

        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-xl">←</button>
          <div>
            <h1 className="text-xl font-bold">{pageTitle}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-green-400">{liveWorkers.length} live now</p>
              {clientLocation ? (
                <span className="text-xs text-blue-400">· Sorted by distance</span>
              ) : (
                <span className="text-xs text-gray-500">· Enable location to sort by distance</span>
              )}
            </div>
          </div>
        </div>

        {liveWorkers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">😔</p>
            <p>No workers available right now</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {liveWorkers.map((w, idx) => {
              const dist = w.distanceKm !== null ? formatDistance(w.distanceKm) : null;
              const isNearest = idx === 0 && w.distanceKm !== null && clientLocation;

              return (
                <div
                  key={w.id}
                  className={`bg-[#1a1a1a] p-4 rounded-2xl hover:bg-[#242424] transition-all active:scale-95 relative ${
                    isNearest ? "ring-1 ring-green-500/40" : ""
                  }`}
                >
                  {/* Nearest badge */}
                  {isNearest && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      Nearest
                    </div>
                  )}

                  {/* Avatar + info — click goes to profile */}
                  <div
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => navigate(`/seller-profile/${w.worker_id}`)}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-green-600 flex items-center justify-center text-xl font-bold mb-2 border-2 border-green-500/40">
                      {w.profiles?.avatar_url ? (
                        <img src={w.profiles.avatar_url} alt={w.profiles?.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{w.profiles?.full_name?.[0] || "W"}</span>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm truncate text-center w-full">
                      {w.profiles?.full_name || "Worker"}
                    </h3>

                    <p className="text-xs text-gray-400 mt-0.5 truncate text-center w-full">
                      {w.workerCategory || w.service || "General Worker"}
                    </p>

                    {/* Distance badge */}
                    {dist ? (
                      <p className={`text-xs mt-1 font-medium ${dist.color}`}>
                        📍 {dist.text}
                      </p>
                    ) : w.workerLocation ? (
                      <p className="text-xs text-gray-500 mt-1">📍 {w.workerLocation}</p>
                    ) : null}

                    <p className="text-green-400 text-xs mt-1">🟢 Live Now</p>
                  </div>

                  {/* Book/Hire button */}
                  <button
                    onClick={() => navigate(`/hire-worker/${w.worker_id}`)}
                    className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
                      isGeneral ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isGeneral ? "Hire" : "Book"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ERROR STATE
  if (error || !worker) return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400">{error || "Worker not found"}</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-green-400 underline">Go Back</button>
      </div>
    </div>
  );

  // SINGLE WORKER HIRE
  const isGeneralWorker = !worker.category || worker.category === "General Worker";
  const workerDist = worker.distanceKm !== null ? formatDistance(worker.distanceKm) : null;

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 text-white pb-24">
      <ToastUI />
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4 text-sm">← Back</button>
      <h1 className="text-2xl font-bold mb-6">{isGeneralWorker ? "Hire Worker" : "Book Worker"}</h1>

      <div className="bg-[#101623] p-6 rounded-2xl space-y-6">

        {/* Worker info */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => navigate(`/seller-profile/${worker.id}`)}
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-green-600 flex items-center justify-center text-4xl font-bold border-2 border-green-500/30 flex-shrink-0">
            {worker.profiles?.avatar_url ? (
              <img src={worker.profiles.avatar_url} alt={worker.profiles?.full_name} className="w-full h-full object-cover" />
            ) : (
              <span>{worker.profiles?.full_name?.[0] || "W"}</span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-xl">{worker.profiles?.full_name || "Worker"}</h2>
            <p className="text-gray-400 text-sm">{worker.category || "General Worker"}</p>
            {(worker.location || worker.profiles?.country) && (
              <p className="text-gray-500 text-xs mt-0.5">📍 {worker.location || worker.profiles?.country}</p>
            )}
            {workerDist && (
              <p className={`text-xs mt-0.5 font-medium ${workerDist.color}`}>
                📍 {workerDist.text}
              </p>
            )}
            <p className="text-green-400 text-sm mt-1">🟢 Available Now</p>
            <p className="text-xs text-blue-400 mt-0.5">View Profile →</p>
          </div>
        </div>

        {/* Job description */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">What do you need done?</label>
          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Describe the job in detail..."
            className="w-full p-4 bg-[#141B2D] rounded-2xl border border-gray-700 focus:border-green-500 outline-none min-h-[120px] text-white text-sm"
          />
        </div>

        {/* Client location */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">Your Location</label>
          <input
            value={workerLocation}
            onChange={(e) => setWorkerLocation(e.target.value)}
            placeholder="e.g. Ikeja, Lagos"
            className="w-full p-4 bg-[#141B2D] rounded-2xl border border-gray-700 focus:border-green-500 outline-none text-white text-sm"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleHire}
          disabled={submitting}
          className={`w-full disabled:bg-gray-600 p-4 rounded-2xl font-semibold text-lg transition active:scale-[0.97] ${
            isGeneralWorker ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </span>
          ) : isGeneralWorker ? "Send Hire Request" : "Send Booking Request"}
        </button>
      </div>
    </div>
  );
}