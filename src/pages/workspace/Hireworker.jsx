import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function HireWorker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const categoryParam = searchParams.get("category");
  const typeFilter = searchParams.get("type"); // "general"

  const [worker, setWorker] = useState(null);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState("");
  const [workerLocation, setWorkerLocation] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkers();
  }, [id, categoryParam, typeFilter]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (id) {
        // Single worker mode — get from live_workers
        const { data: liveData } = await supabase
          .from("live_workers")
          .select("worker_id, service, profiles(full_name)")
          .eq("worker_id", id)
          .maybeSingle();

        if (liveData) {
          // Also get their registered category
          const { data: workerData } = await supabase
            .from("workers")
            .select("category")
            .eq("id", id)
            .maybeSingle();

          setWorker({
            id: liveData.worker_id,
            category: workerData?.category || liveData.service || "General Worker",
            profiles: liveData.profiles,
          });
        } else {
          // Try workers table as fallback
          const { data: workerData } = await supabase
            .from("workers")
            .select("id, category, profiles(full_name)")
            .eq("id", id)
            .maybeSingle();

          if (workerData) {
            setWorker(workerData);
          } else {
            setError("Worker not found or not currently live");
          }
        }
      } else {
        // Browse mode
        const { data: liveData, error: liveError } = await supabase
          .from("live_workers")
          .select("id, service, worker_id, profiles(full_name)")
          .limit(80);

        if (liveError) throw liveError;

        const workerIds = (liveData || []).map(w => w.worker_id);

        // Get categories from workers table
        let categoryMap = {};
        if (workerIds.length > 0) {
          const { data: workersData } = await supabase
            .from("workers")
            .select("id, category")
            .in("id", workerIds);

          (workersData || []).forEach(w => {
            categoryMap[w.id] = w.category;
          });
        }

        const merged = (liveData || []).map(w => ({
          ...w,
          workerCategory: categoryMap[w.worker_id] || null,
          isGeneral: !categoryMap[w.worker_id],
        }));

        let filtered = merged;

        if (typeFilter === "general") {
          // Workers with no registered category
          filtered = merged.filter(w => w.isGeneral);
        } else if (categoryParam) {
          // Filter by specific category
          filtered = merged.filter(w =>
            w.workerCategory?.toLowerCase() === categoryParam.toLowerCase()
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
      alert("✅ Request sent successfully!");
      navigate("/workspace");
    } catch (err) {
      console.error(err);
      alert("Failed to send request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ===== BROWSE MODE =====
  if (!id) {
    const isGeneral = typeFilter === "general";
    const pageTitle = isGeneral
      ? "General Workers"
      : categoryParam
        ? `${categoryParam}`
        : "Live Workers";

    return (
      <div className="min-h-screen bg-[#0B0F19] text-white p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            <p className="text-xs text-green-400">{liveWorkers.length} live now</p>
          </div>
        </div>

        {liveWorkers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">😔</p>
            <p>No workers available right now</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {liveWorkers.map((w) => (
              <div
                key={w.id}
                onClick={() => navigate(`/hire-worker/${w.worker_id}`)}
                className="bg-[#1a1a1a] p-5 rounded-2xl cursor-pointer hover:bg-[#242424] transition-all active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-2xl font-bold mb-3">
                  {w.profiles?.full_name?.[0] || "W"}
                </div>
                <h3 className="font-semibold text-sm truncate">
                  {w.profiles?.full_name || "Worker"}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {w.workerCategory || w.service || "General Worker"}
                </p>
                <p className="text-green-400 text-xs mt-2">🟢 Live Now</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/hire-worker/${w.worker_id}`);
                  }}
                  className={`w-full mt-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isGeneral
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isGeneral ? "Hire" : "Book"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error || !worker) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error || "Worker not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-green-400 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ===== SINGLE WORKER HIRING =====
  const isGeneralWorker = !worker.category || worker.category === "General Worker";

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 text-white pb-24">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-white mb-4 text-sm"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {isGeneralWorker ? "Hire Worker" : "Book Worker"}
      </h1>

      <div className="bg-[#101623] p-6 rounded-2xl space-y-6">

        {/* Worker Info */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center text-4xl font-bold">
            {worker.profiles?.full_name?.[0] || "W"}
          </div>
          <div>
            <h2 className="font-bold text-xl">
              {worker.profiles?.full_name || "Worker"}
            </h2>
            <p className="text-gray-400">{worker.category || "General Worker"}</p>
            <p className="text-green-400 text-sm mt-1">🟢 Available Now</p>
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">
            What do you need done?
          </label>
          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Describe the job in detail..."
            className="w-full p-4 bg-[#141B2D] rounded-2xl border border-gray-700 focus:border-green-500 outline-none min-h-[130px] text-white"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">
            Your Location
          </label>
          <input
            value={workerLocation}
            onChange={(e) => setWorkerLocation(e.target.value)}
            placeholder="e.g. Ikeja, Lagos"
            className="w-full p-4 bg-[#141B2D] rounded-2xl border border-gray-700 focus:border-green-500 outline-none text-white"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleHire}
          disabled={submitting}
          className={`w-full disabled:bg-gray-600 p-4 rounded-2xl font-semibold text-lg transition ${
            isGeneralWorker
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {submitting
            ? "Sending..."
            : isGeneralWorker
              ? "Send Hire Request"
              : "Send Booking Request"
          }
        </button>
      </div>
    </div>
  );
}