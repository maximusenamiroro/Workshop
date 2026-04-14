import { useState, useEffect, useMemo } from "react";
import { FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CATEGORY_EMOJI = {
  "Fashion": "👗",
  "Shoes": "👟",
  "Watches": "⌚",
  "Electronics": "📱",
  "Home Appliances": "🏠",
  "Food & Drinks": "🍔",
  "Beauty": "💄",
  "Tools": "🛠️",
  "Furniture": "🛋️",
  "Sports": "⚽",
  "Books": "📚",
  "Toys": "🧸",
  "Health": "💊",
  "Others": "📦",
  "Cleaning": "🧹",
  "Driving": "🚗",
  "Plumbing": "🔧",
  "Electrical": "⚡",
  "Carpentry": "🪚",
  "Security": "🔒",
  "Delivery": "📦",
  "Tailoring": "🧵",
  "Painting": "🎨",
  "Welding": "🔥",
};

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [workerCategories, setWorkerCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchAll();

    const bookingsChannel = supabase
      .channel(`bookings_${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "hire_requests",
        filter: `client_id=eq.${user.id}`,
      }, fetchBookings)
      .subscribe();

    const liveChannel = supabase
      .channel("live_workers_global")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "live_workers",
      }, fetchWorkerCategories)
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(liveChannel);
    };
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([
      fetchBookings(),
      fetchProductCategories(),
      fetchWorkerCategories(),
    ]);
    setLoading(false);
  };

  // Fetch only categories that have products
  const fetchProductCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("category");

      if (error) throw error;

      // Get unique categories that have products
      const unique = [...new Set((data || []).map(p => p.category).filter(Boolean))];
      setProductCategories(unique);
    } catch (err) {
      console.error("fetchProductCategories failed:", err.message);
    }
  };

  // Fetch only categories with live workers
  const fetchWorkerCategories = async () => {
    try {
      // Get all live worker IDs
      const { data: liveData, error } = await supabase
        .from("live_workers")
        .select("worker_id");

      if (error) throw error;
      if (!liveData || liveData.length === 0) {
        setWorkerCategories([]);
        return;
      }

      const workerIds = liveData.map(w => w.worker_id);

      // Get their categories from workers table
      const { data: workersData } = await supabase
        .from("workers")
        .select("category")
        .in("id", workerIds);

      const unique = [...new Set(
        (workersData || []).map(w => w.category).filter(Boolean)
      )];

      setWorkerCategories(unique);
    } catch (err) {
      console.error("fetchWorkerCategories failed:", err.message);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from("hire_requests")
        .select("id, status, created_at, job_description, location")
        .eq("client_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("fetchBookings failed:", err.message);
    }
  };

  const getBookingColor = (status) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const filteredWorkerCategories = useMemo(() =>
    workerCategories.filter(c =>
      c.toLowerCase().includes(search.toLowerCase())
    ), [workerCategories, search]);

  const filteredProductCategories = useMemo(() =>
    productCategories.filter(c =>
      c.toLowerCase().includes(search.toLowerCase())
    ), [productCategories, search]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <FaClipboardList
          className="cursor-pointer text-white/70"
          onClick={() => navigate("/productorder")}
        />
        <h1 className="text-xl font-semibold">Workspace</h1>
        <FaBell className="text-white/70" />
      </div>

      {/* SEARCH */}
      <div className="flex items-center bg-white/5 p-2 rounded-xl mb-6">
        <FaSearch className="mr-2 text-white/50" />
        <input
          className="bg-transparent w-full outline-none text-white placeholder-gray-500 text-sm"
          placeholder="Search categories or workers..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* PRODUCT CATEGORIES */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Shop by Category</h2>
          <button
            onClick={() => navigate("/shop")}
            className="text-xs text-green-400"
          >
            See All →
          </button>
        </div>

        {filteredProductCategories.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400 mb-2">No products available yet</p>
            <button
              onClick={() => navigate("/shop")}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Browse Shop
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {filteredProductCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate(`/shop?category=${encodeURIComponent(cat)}`)}
                className="flex flex-col items-center min-w-[80px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-green-500/50 flex items-center justify-center text-3xl hover:border-green-500 transition">
                  {CATEGORY_EMOJI[cat] || "📦"}
                </div>
                <p className="text-xs mt-2 text-center text-gray-300 truncate w-20">{cat}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MY BOOKINGS */}
      <div className="bg-white/5 p-4 rounded-xl mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">My Bookings</h2>
          <button
            onClick={() => navigate("/hire-worker")}
            className="text-xs text-green-400"
          >
            + Hire
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">No bookings yet</p>
            <button
              onClick={() => navigate("/hire-worker")}
              className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-xl text-sm font-semibold transition"
            >
              Hire a Worker
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {bookings.map((b) => (
              <div key={b.id} className="flex justify-between py-2 border-b border-white/10">
                <div>
                  <p className="text-sm">{b.job_description || "Job Request"}</p>
                  <p className="text-xs text-gray-400">📍 {b.location}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full h-fit ${getBookingColor(b.status)}`}>
                  {b.status || "pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SPECIALIZED WORKER CATEGORIES */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Hire by Specialty</h2>
          <button
            onClick={() => navigate("/hire-worker")}
            className="text-xs text-green-400"
          >
            See All →
          </button>
        </div>

        {filteredWorkerCategories.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">No specialized workers live right now</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {filteredWorkerCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate(`/hire-worker?category=${encodeURIComponent(cat)}`)}
                className="flex flex-col items-center min-w-[80px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-yellow-500/50 flex items-center justify-center text-3xl hover:border-yellow-500 transition">
                  {CATEGORY_EMOJI[cat] || "👷"}
                </div>
                <p className="text-xs mt-2 text-center text-gray-300 truncate w-20">{cat}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}