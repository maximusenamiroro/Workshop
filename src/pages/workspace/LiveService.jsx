import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import CategoryGroup from "../../components/CategoryGroup";
import SearchBar from "../../components/SearchBar";

export default function LiveService() {
  const [search, setSearch] = useState("");
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("workers")                    // ← Change if your table name is different
        .select("*")
        .order("created_at", { ascending: false });

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
  }, []);

  // Search filter
  const filtered = liveWorkers.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase()) ||
    item.location?.toLowerCase().includes(search.toLowerCase())
  );

  // Grouping logic
  const bookWorkers = filtered.filter(
    (w) => w.type === "worker" && w.handSkill && w.live
  );

  const hireWorkers = filtered.filter(
    (w) => w.type === "worker" && !w.handSkill && w.live
  );

  const productSellers = filtered.filter(
    (w) => w.type === "product" && w.live
  );

  const nearbyWorkers = filtered.filter((w) => !w.live);

  if (loading) {
    return (
      <div className="bg-[#0B0F19] min-h-screen p-4 flex items-center justify-center">
        <p className="text-gray-400">Loading live services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0B0F19] min-h-screen p-4 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] min-h-screen p-4">
      {/* Title */}
      <h1 className="text-white text-xl font-semibold mb-4">
        Live Services
      </h1>

      {/* Search */}
      <SearchBar search={search} setSearch={setSearch} />

      {/* Book Workers */}
      <CategoryGroup
        title="Book Workers"
        workers={bookWorkers}
        liveOnly={true}
      />

      {/* Hire Workers */}
      <CategoryGroup
        title="Hire Workers"
        workers={hireWorkers}
        liveOnly={true}
      />

      {/* Order Products */}
      <CategoryGroup
        title="Order Products"
        workers={productSellers}
        liveOnly={true}
      />

      {/* Nearby Workers */}
      <CategoryGroup
        title="Nearby Workers"
        workers={nearbyWorkers}
        liveOnly={false}
      />
    </div>
  );
}