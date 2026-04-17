import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function HireWorker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const categoryParam = searchParams.get("category");   // Can be single or comma-separated
  const serviceFilter = searchParams.get("service");
  const typeFilter = searchParams.get("type");

  const [worker, setWorker] = useState(null);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState("");
  const [workerLocation, setWorkerLocation] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkers();
  }, [id, categoryParam, serviceFilter]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (id) {
        // ================= SINGLE WORKER HIRING =================
        const { data: liveData } = await supabase
          .from("live_workers")
          .select("worker_id, service, profiles(full_name)")
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
      } else {
        // ================= BROWSE / CATEGORY MODE =================
        const { data: liveData, error: liveError } = await supabase
          .from("live_workers")
          .select("id, service, worker_id, profiles(full_name)")
          .limit(100);

        if (liveError) throw liveError;

        const workerIds = (liveData || []).map(w => w.worker_id);

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
          workerCategory: categoryMap[w.worker_id] || w.service || "General",
        }));

        let filtered = merged;

        // Handle multiple categories (comma-separated)
        if (categoryParam) {
          const categoriesArray = categoryParam.split(",").map(c => c.trim().toLowerCase());
          filtered = merged.filter(w => {
            const workerCat = (w.workerCategory || w.service || "").toLowerCase();
            return categoriesArray.includes(workerCat);
          });
        } 
        else if (serviceFilter) {
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
      console.error(err);
      alert("Failed to send hire request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ================= BROWSE WORKERS LIST MODE =================
  if (!id) {
    const pageTitle = categoryParam 
      ? "Available Workers" 
      : serviceFilter 
        ? `${serviceFilter} Workers` 
        : "Live Workers";

    return (
      <div className="min-h-screen bg-[#0B0F19] text-white p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-xl">
            ←
          </button>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>

        {liveWorkers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">😔</p>
            <p>No workers available right now in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {liveWorkers.map((w) => (
              <div
                key={w.id}
                onClick={() => navigate(`/hire-worker/${w.worker_id}`)}
                className="bg-[#1a1a1a] p-5 rounded-2xl cursor-pointer hover:bg-[#242424] transition-all active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-3xl mb-4">
                  {w.profiles?.full_name?.[0] || "👷"}
                </div>
                <h3 className="font-semibold">{w.profiles?.full_name}</h3>
                <p className="text-sm text-gray-400">{w.service || w.workerCategory}</p>
                <p className="text-green-400 text-xs mt-3">🟢 Live Now</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ================= SINGLE WORKER HIRING FORM =================
  if (error || !worker) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error || "Worker not found"}</p>
          <button onClick={() => navigate(-1)} className="mt-6 text-green-400 underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 text-white pb-24">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4">
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Book Worker</h1>

      <div className="bg-[#101623] p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center text-4xl font-bold">
            {worker.profiles?.full_name?.[0] || "W"}
          </div>
          <div>
            <h2 className="font-bold text-xl">{worker.profiles?.full_name}</h2>
            <p className="text-gray-400">{worker.category || "General Worker"}</p>
            <p className="text-green-400 text-sm mt-1">🟢 Available Now</p>
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">What do you need done?</label>
          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Describe the job in detail..."
            className="w-full p-4 bg-[#141B2D] rounded-2xl border border-gray-700 focus:border-green-500 outline-none min-h-[130px]"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">Your Location</label>
          <input
            value={workerLocation}
            onChange={(e) => setWorkerLocation(e.target.value)}
            placeholder="e.g. Ikeja, Lagos"
            className="w-full p-4 bg-[#141B2D] rounded-2xl border border-gray-700 focus:border-green-500 outline-none"
          />
        </div>

        <button
          onClick={handleHire}
          disabled={submitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-4 rounded-2xl font-semibold text-lg transition mt-4"
        >
          {submitting ? "Sending Request..." : "Send Hire Request"}
        </button>
      </div>
    </div>
  );
}