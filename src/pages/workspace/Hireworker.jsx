import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function HireWorker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const params = new URLSearchParams(location.search);
  const categoryFilter = params.get("category");
  const serviceFilter = params.get("service");   // ← Added for General Workers

  const [worker, setWorker] = useState(null);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState("");
  const [workerLocation, setWorkerLocation] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkers();
  }, [id, categoryFilter, serviceFilter]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (id) {
        // View specific worker
        const { data: workerData } = await supabase
          .from("workers")
          .select("id, category, location, profiles(full_name)")
          .eq("id", id)
          .maybeSingle();

        if (workerData) {
          setWorker(workerData);
        } else {
          const { data: liveData } = await supabase
            .from("live_workers")
            .select("id, service, worker_id, profiles(full_name)")
            .eq("worker_id", id)
            .maybeSingle();

          if (liveData) {
            setWorker({
              id: liveData.worker_id,
              category: liveData.service,
              profiles: liveData.profiles,
            });
          } else {
            setError("Worker not found");
          }
        }
      } else {
        // Browse mode - filter by category OR service
        const { data: liveData, error: liveError } = await supabase
          .from("live_workers")
          .select("id, service, worker_id, profiles(full_name)")
          .limit(50);

        if (liveError) throw liveError;

        const allLive = liveData || [];
        const liveWorkerIds = allLive.map(w => w.worker_id);

        // Get categories from workers table
        let workerCategoryMap = {};
        if (liveWorkerIds.length > 0) {
          const { data: workersData } = await supabase
            .from("workers")
            .select("id, category")
            .in("id", liveWorkerIds);

          (workersData || []).forEach(w => {
            workerCategoryMap[w.id] = w.category;
          });
        }

        // Merge data
        const merged = allLive.map(w => ({
          ...w,
          workerCategory: workerCategoryMap[w.worker_id] || w.service || "General",
        }));

        // Filter logic
        let filtered = merged;

        if (categoryFilter) {
          filtered = merged.filter(w =>
            w.workerCategory?.toLowerCase() === categoryFilter.toLowerCase()
          );
        } else if (serviceFilter) {
          filtered = merged.filter(w =>
            w.service?.toLowerCase() === serviceFilter.toLowerCase()
          );
        }

        setLiveWorkers(filtered);
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
      alert("Please fill in both job description and location");
      return;
    }
    if (!user) {
      navigate("/login");
      return;
    }
    if (!worker?.id) {
      alert("Worker not found");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

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

      alert("✅ Hire request sent successfully!");
      navigate("/workspace");
    } catch (err) {
      console.error("Hire error:", err);
      setError("Failed to send hire request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Browse Workers Mode
  if (!id) {
    const title = categoryFilter 
      ? `${categoryFilter} Workers` 
      : serviceFilter 
        ? `${serviceFilter} Workers` 
        : "Live Workers";

    return (
      <div className="min-h-screen bg-[#0B0F19] text-white p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        {liveWorkers.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-4xl mb-4">😴</p>
            <p>No {categoryFilter || serviceFilter || ""} workers are live right now.</p>
            <p className="text-sm mt-2">Check back soon!</p>
            <button
              onClick={() => navigate("/hire-worker")}
              className="mt-6 text-green-400 underline text-sm"
            >
              View all live workers
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {liveWorkers.map((w) => (
              <div
                key={w.id}
                className="bg-[#101623] p-4 rounded-xl flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center font-bold text-lg">
                    {w.profiles?.full_name?.[0] || "W"}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {w.profiles?.full_name || "Worker"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {w.service || w.workerCategory}
                    </p>
                    <p className="text-xs text-green-400 mt-1">🟢 Live now</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/hire-worker/${w.worker_id}`)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  Book
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Specific Worker Hiring Page
  if (error || !worker) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error || "Worker not found"}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-green-400 underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 text-white pb-24">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4 text-sm">
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Book Worker</h1>

      <div className="bg-[#101623] p-6 rounded-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-2xl font-bold">
            {worker.profiles?.full_name?.[0] || "W"}
          </div>
          <div>
            <h2 className="font-bold text-lg">
              {worker.profiles?.full_name || "Worker"}
            </h2>
            <p className="text-gray-400">{worker.category || "General Worker"}</p>
            <p className="text-green-400 text-sm">🟢 Available</p>
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">What do you need done?</label>
          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Describe the job in detail..."
            className="w-full p-4 bg-[#141B2D] rounded-xl border border-gray-700 focus:border-green-500 outline-none min-h-[120px]"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">Your Location</label>
          <input
            value={workerLocation}
            onChange={(e) => setWorkerLocation(e.target.value)}
            placeholder="e.g. Ikeja, Lagos"
            className="w-full p-4 bg-[#141B2D] rounded-xl border border-gray-700 focus:border-green-500 outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleHire}
          disabled={submitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-4 rounded-xl font-semibold text-lg transition"
        >
          {submitting ? "Sending Request..." : "Send Hire Request"}
        </button>
      </div>
    </div>
  );
}