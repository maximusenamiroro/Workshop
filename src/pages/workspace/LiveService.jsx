import { useState, useEffect } from "react";
import CategoryGroup from "../components/CategoryGroup";
import SearchBar from "../components/SearchBar";

export default function LiveService() {
  const [search, setSearch] = useState("");
  const [liveWorkers, setLiveWorkers] = useState([]);

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("workspaceLiveWorkers")) || [];

    setLiveWorkers(stored);
  }, []);

  // Search filter
  const filtered = liveWorkers.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())
  );

  // Grouping
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
