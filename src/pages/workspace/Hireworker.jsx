import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function HireWorker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  // If no id in URL, fetch all live workers to browse
  const [liveWorkers, setLiveWorkers] = useState([]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);

      if (id) {
        // Fetch specific worker
        const { data, error: fetchError } = await supabase
          .from("workers")
          .select("id, category, location, profiles(full_name)")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        setWorker(data);
      } else {
        // Fetch all live workers
        const { data, error: fetchError } = await supabase
          .from("live_workers")
          .select("id, service, worker_id, profiles(full_name)")
          .limit(20);

        if (fetchError) throw fetchError;
        setLiveWorkers(data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async () => {
    if (!job.trim() || !location.trim()) {
      alert("Please fill in both job description and location");
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: insertError } = await supabase
        .from("hire_requests")
        .insert({
          client_id: user.id,
          worker_id: worker?.id || null,
          job_description: job.trim(),
          location: location.trim(),
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
        <p>Loading...</p>
      </div>
    );
  }

  // ===== BROWSE ALL LIVE WORKERS =====
  if (!id) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white p-4">
        <h1 className="text-2xl font-bold mb-6">Live Workers</h1>

        {liveWorkers.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-4xl mb-4">😴</p>
            <p>No workers are live right now.</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveWorkers.map((w) => (
              <div
                key={w.id}
                className="bg-[#101623] p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {w.profiles?.full_name || "Worker"}
                  </p>
                  <p className="text-sm text-gray-400">{w.service}</p>
                  <p className="text-xs text-green-400 mt-1">🟢 Live now</p>
                </div>
                <button
                  onClick={() => navigate(`/hire-worker/${w.worker_id}`)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  Hire
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== HIRE SPECIFIC WORKER =====
  if (error || !worker) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error || "Worker not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-green-400 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 text-white">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-white mb-4 text-sm"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Hire Worker</h1>

      <div className="bg-[#101623] p-6 rounded-xl space-y-6">

        {/* Worker Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-2xl font-bold">
            {worker.profiles?.full_name?.[0] || "W"}
          </div>
          <div>
            <h2 className="font-bold text-lg">
              {worker.profiles?.full_name || "Worker"}
            </h2>
            <p className="text-gray-400">{worker.category}</p>
            <p className="text-green-400 text-sm">🟢 Available</p>
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
            className="w-full p-4 bg-[#141B2D] rounded-xl border border-gray-700 focus:border-green-500 outline-none min-h-[120px] text-white"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">
            Your Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Ikeja, Lagos"
            className="w-full p-4 bg-[#141B2D] rounded-xl border border-gray-700 focus:border-green-500 outline-none text-white"
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