import { useState, useEffect, useMemo } from "react";
import { FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CATEGORY_EMOJI = {
  "Fashion": "👗", "Shoes": "👟", "Watches": "⌚", "Electronics": "📱",
  "Home Appliances": "🏠", "Food & Drinks": "🍔", "Beauty": "💄",
  "Tools": "🛠️", "Furniture": "🛋️", "Sports": "⚽", "Books": "📚",
  "Toys": "🧸", "Health": "💊", "Others": "📦", "Cleaning": "🧹",
  "Driving": "🚗", "Plumbing": "🔧", "Electrical": "⚡", "Carpentry": "🪚",
  "Security": "🔒", "Delivery": "📦", "Tailoring": "🧵", "Painting": "🎨",
  "Welding": "🔥",
};

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [specializedCategories, setSpecializedCategories] = useState([]);
  const [generalCategories, setGeneralCategories] = useState([]);
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
      }, () => {
        fetchSpecializedCategories();
        fetchGeneralCategories();
      })
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
      fetchSpecializedCategories(),
      fetchGeneralCategories(),
    ]);
    setLoading(false);
  };

  const fetchProductCategories = async () => {
    try {
      const { data, error } = await supabase.from("products").select("category");
      if (error) throw error;
      const unique = [...new Set((data || []).map(p => p.category).filter(Boolean))];
      setProductCategories(unique);
    } catch (err) {
      console.error("fetchProductCategories failed:", err.message);
    }
  };

  const fetchSpecializedCategories = async () => {
    try {
      const { data: liveData } = await supabase.from("live_workers").select("worker_id");
      if (!liveData?.length) return setSpecializedCategories([]);

      const workerIds = liveData.map(w => w.worker_id);
      const { data: workersData } = await supabase
        .from("workers")
        .select("category")
        .in("id", workerIds);

      const unique = [...new Set((workersData || []).map(w => w.category).filter(Boolean))];
      setSpecializedCategories(unique);
    } catch (err) {
      console.error("fetchSpecializedCategories failed:", err.message);
    }
  };

  const fetchGeneralCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("live_workers")
        .select("service")
        .not("service", "is", null);

      if (error) throw error;

      const uniqueServices = [...new Set((data || []).map(item => item.service).filter(Boolean))];
      setGeneralCategories(uniqueServices);
    } catch (err) {
      console.error("fetchGeneralCategories failed:", err.message);
      setGeneralCategories([]);
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("fetchBookings failed:", err.message);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("hire_requests")
        .delete()
        .eq("id", bookingId)
        .eq("client_id", user.id);

      if (error) throw error;

      fetchBookings(); // Refresh list
      alert("Booking deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete booking. Please try again.");
    }
  };

  const getBookingColor = (status) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const filteredProduct = useMemo(() =>
    productCategories.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [productCategories, search]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <FaClipboardList className="cursor-pointer text-white/70" onClick={() => navigate("/productorder")} />
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
          <button onClick={() => navigate("/shop")} className="text-xs text-green-400">See All →</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {filteredProduct.slice(0, 6).map((cat) => (
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
      </div>

      {/* MY BOOKINGS - Only 3 + Delete */}
      <div className="bg-white/5 p-4 rounded-xl mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">My Bookings</h2>
          <button onClick={() => navigate("/hire-worker")} className="text-xs text-green-400">+ Hire</button>
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
          <div className="space-y-3">
            {bookings.slice(0, 3).map((b) => (
              <div key={b.id} className="bg-[#1a1a1a] p-4 rounded-xl flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium">{b.job_description || "Job Request"}</p>
                  <p className="text-xs text-gray-400 mt-1">📍 {b.location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(b.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full ${getBookingColor(b.status)}`}>
                    {b.status || "pending"}
                  </span>
                  <button
                    onClick={() => handleDeleteBooking(b.id)}
                    className="text-red-500 hover:text-red-600 text-xs mt-1 flex items-center gap-1"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}

            {bookings.length > 3 && (
              <button
                onClick={() => navigate("/my-bookings")} 
                className="w-full text-center text-green-400 text-sm py-2 hover:underline"
              >
                View all bookings ({bookings.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* SPECIALIZED WORKERS - Only 4 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Hire by Specialty</h2>
          <button 
            onClick={() => navigate("/browse-categories?type=specialized")}
            className="text-xs text-green-400"
          >
            See All →
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {specializedCategories.slice(0, 4).map((cat) => (
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
      </div>

      {/* GENERAL WORKERS - Only 4 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">General Workers</h2>
          <button 
            onClick={() => navigate("/browse-categories?type=general")}
            className="text-xs text-green-400"
          >
            See All →
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {generalCategories.slice(0, 4).map((service) => (
            <button
              key={service}
              onClick={() => navigate(`/hire-worker?service=${encodeURIComponent(service)}`)}
              className="flex flex-col items-center min-w-[80px] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-blue-500/50 flex items-center justify-center text-3xl hover:border-blue-500 transition">
                👷
              </div>
              <p className="text-xs mt-2 text-center text-gray-300 truncate w-20">{service}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}