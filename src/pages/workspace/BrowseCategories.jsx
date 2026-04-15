import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaSearch } from "react-icons/fa";

const CATEGORY_EMOJI = {
  "Fashion": "👗", "Shoes": "👟", "Watches": "⌚", "Electronics": "📱",
  "Home Appliances": "🏠", "Food & Drinks": "🍔", "Beauty": "💄",
  "Tools": "🛠️", "Furniture": "🛋️", "Sports": "⚽", "Books": "📚",
  "Toys": "🧸", "Health": "💊", "Others": "📦", "Cleaning": "🧹",
  "Driving": "🚗", "Plumbing": "🔧", "Electrical": "⚡", "Carpentry": "🪚",
  "Security": "🔒", "Delivery": "📦", "Tailoring": "🧵", "Painting": "🎨",
  "Welding": "🔥",
};

export default function BrowseCategories() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type"); // "specialized" or "general"

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const title = type === "specialized" 
    ? "Specialized Workers" 
    : "General Workers";

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      if (type === "specialized") {
        // Fetch Specialized Categories
        const { data: liveData } = await supabase
          .from("live_workers")
          .select("worker_id");

        if (liveData?.length) {
          const workerIds = liveData.map(w => w.worker_id);
          const { data: workersData } = await supabase
            .from("workers")
            .select("category")
            .in("id", workerIds);

          const unique = [...new Set((workersData || []).map(w => w.category).filter(Boolean))];
          setCategories(unique);
        }
      } else {
        // Fetch General Workers Services
        const { data, error } = await supabase
          .from("live_workers")
          .select("service")
          .not("service", "is", null);

        if (error) throw error;

        const uniqueServices = [...new Set((data || []).map(item => item.service).filter(Boolean))];
        setCategories(uniqueServices);
      }
    } catch (err) {
      console.error("Error fetching categories:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white text-xl"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white/5 p-3 rounded-xl mb-8">
        <FaSearch className="mr-3 text-white/50" />
        <input
          type="text"
          placeholder="Search categories..."
          className="bg-transparent w-full outline-none text-white placeholder-gray-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">😔</p>
              <p>No categories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {filteredCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(
                    type === "specialized"
                      ? `/hire-worker?category=${encodeURIComponent(cat)}`
                      : `/hire-worker?service=${encodeURIComponent(cat)}`
                  )}
                  className="group flex flex-col items-center text-center transition-all hover:scale-105"
                >
                  <div className="w-28 h-28 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-6xl group-hover:border-green-500 transition">
                    {type === "specialized" ? (CATEGORY_EMOJI[cat] || "👷") : "👷"}
                  </div>
                  <p className="mt-4 font-medium text-lg">{cat}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}