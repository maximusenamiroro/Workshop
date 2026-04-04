import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LiveService() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("live_workers")
        .select("id, service, worker_id, profiles(full_name)")
        .order("updated_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setLiveWorkers(data || []);
    } catch (err) {
      console.error("Error fetching live workers:", err);
      setError("Failed to load live services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWorkers();

    // Real-time updates
    const channel = supabase
      .channel("live_workers_changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "live_workers",
      }, () => fetchLiveWorkers())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const filtered = liveWorkers.filter((w) =>
    w.service?.toLowerCase().includes(search.toLowerCase()) ||
    w.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-[#0B0F19] min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading live services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0B0F19] min-h-screen flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] min-h-screen p-4 text-white">
      <h1 className="text-xl font-semibold mb-4">Live Services</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by service or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 mb-6 bg-white/10 rounded-xl text-white placeholder-gray-500 outline-none"
      />

      {filtered.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-4xl mb-4">😴</p>
          <p className="text-gray-400">No workers are live right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{w.profiles?.full_name || "Worker"}</p>
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