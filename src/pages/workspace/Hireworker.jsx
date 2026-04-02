import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function HireWorker() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState(null);

  // Fetch worker details from Supabase
  useEffect(() => {
    const fetchWorker = async () => {
      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from("workers")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Worker not found");

        setWorker(data);
      } catch (err) {
        console.error(err);
        setError("Worker not found or failed to load");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchWorker();
  }, [id]);

  const handleHire = async () => {
    if (!job.trim() || !location.trim()) {
      alert("Please fill in both job description and location");
      return;
    }

    if (!worker) {
      alert("Worker information is missing");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("workspaceUser"));

      if (!user?.id) {
        alert("Please log in to hire a worker");
        navigate("/login");
        return;
      }

      const hireData = {
        user_id: user.id,
        worker_id: worker.id,
        worker_name: worker.name,
        job_description: job.trim(),
        location: location.trim(),
        status: "Pending",
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("hire_requests")        // ← Create this table in Supabase
        .insert([hireData]);

      if (insertError) throw insertError;

      alert("✅ Hire request sent successfully!");
      navigate("/booking");           // or wherever you want to redirect

    } catch (err) {
      console.error("Hire error:", err);
      setError("Failed to send hire request. Please try again.");
      alert("Failed to send hire request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] p-4 text-white flex items-center justify-center">
        <p>Loading worker details...</p>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-[#0B0F19] p-4 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error || "Worker not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-400 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 text-white">
      <h1 className="text-2xl font-bold mb-6">Hire Worker</h1>

      <div className="bg-[#101623] p-6 rounded-xl">

        {/* Worker Info */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src={worker.image || "/default-avatar.png"}
            alt={worker.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="font-bold text-lg">{worker.name}</h2>
            <p className="text-gray-400">{worker.role}</p>
            <p className="text-green-400">🟢 Live</p>
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm block mb-2">
            What do you want this worker to do?
          </label>
          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Describe the job in detail..."
            className="w-full p-4 bg-[#141B2D] rounded-xl border border-gray-700 focus:border-blue-500 outline-none min-h-[120px]"
          />
        </div>

        {/* Location */}
        <div className="mb-8">
          <label className="text-gray-400 text-sm block mb-2">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your location (e.g. Ikeja, Lagos)"
            className="w-full p-4 bg-[#141B2D] rounded-xl border border-gray-700 focus:border-blue-500 outline-none"
          />
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Hire Button */}
        <button
          onClick={handleHire}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed p-4 rounded-xl font-semibold text-lg transition-all"
        >
          {submitting ? "Sending Request..." : "Hire Now"}
        </button>
      </div>
    </div>
  );
}