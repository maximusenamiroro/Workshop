import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaSearch, FaArrowLeft, FaUsers } from "react-icons/fa";

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
  const type = searchParams.get("type");

  const [categories, setCategories] = useState([]); // { name, count }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const title = type === "specialized" ? "Specialized Categories" : "General Services";
  const borderColor = type === "specialized" ? "border-yellow-500" : "border-blue-500";

  useEffect(() => {
    fetchCategoriesWithCount();
  }, [type]);

  // Fetch categories + live worker count
  const fetchCategoriesWithCount = async () => {
    try {
      setLoading(true);

      if (type === "specialized") {
        const { data: liveData } = await supabase
          .from("live_workers")
          .select("worker_id");

        if (liveData?.length) {
          const workerIds = liveData.map(w => w.worker_id);
          const { data: workersData } = await supabase
            .from("workers")
            .select("category")
            .in("id", workerIds);

          // Count workers per category
          const countMap = {};
          (workersData || []).forEach(w => {
            const cat = w.category;
            if (cat) countMap[cat] = (countMap[cat] || 0) + 1;
          });

          const formatted = Object.entries(countMap).map(([name, count]) => ({
            name,
            count,
          }));

          setCategories(formatted);
        }
      } else {
        // General Workers
        const { data } = await supabase
          .from("live_workers")
          .select("service");

        const countMap = {};
        (data || []).forEach(item => {
          const service = item.service;
          if (service) countMap[service] = (countMap[service] || 0) + 1;
        });

        const formatted = Object.entries(countMap).map(([name, count]) => ({
          name,
          count,
        }));

        setCategories(formatted);
      }
    } catch (err) {
      console.error("Error fetching categories:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-3 hover:bg-white/10 rounded-full transition"
          >
            <FaArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-gray-400 text-sm">Choose a category to see live workers</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center">
          <FaSearch className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            placeholder="Search for a service..."
            className="bg-transparent flex-1 outline-none text-lg placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-xl text-gray-400">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(
                type === "specialized"
                  ? `/hire-worker?category=${encodeURIComponent(cat.name)}`
                  : `/hire-worker?service=${encodeURIComponent(cat.name)}`
              )}
              className={`group relative bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-${borderColor}/50 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.03] active:scale-95 overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <div className="text-5xl mb-4 transition group-hover:scale-110">
                  {type === "specialized" ? (CATEGORY_EMOJI[cat.name] || "👷") : "👷"}
                </div>
                <div className="bg-white/10 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <FaUsers size={14} />
                  <span>{cat.count} live</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-left mt-2">{cat.name}</h3>
              <p className="text-gray-400 text-sm mt-1">Tap to see available workers</p>

              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-30 transition pointer-events-none" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}