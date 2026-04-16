import { useState, useEffect, useMemo } from "react"; 
import { FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

/* ---------------- CATEGORY EMOJI ---------------- */
const CATEGORY_EMOJI = {
  Fashion: "👗",
  Shoes: "👟",
  Watches: "⌚",
  Electronics: "📱",
  "Home Appliances": "🏠",
  "Food & Drinks": "🍔",
  Beauty: "💄",
  Tools: "🛠️",
  Furniture: "🛋️",
  Sports: "⚽",
  Books: "📚",
  Toys: "🧸",
  Health: "💊",
  Others: "📦",
  Cleaning: "🧹",
  Driving: "🚗",
  Plumbing: "🔧",
  Electrical: "⚡",
  Carpentry: "🪚",
  Security: "🔒",
  Delivery: "📦",
  Tailoring: "🧵",
  Painting: "🎨",
  Welding: "🔥",
};

/* ---------------- BUSINESS CATEGORY SYSTEM ---------------- */
const GENERAL_BUSINESS_CATEGORIES = {
  "Handwork & Skilled Workers": "🧰",
  "Food & Restaurant": "🍔",
  "Hotel & Accommodation": "🏨",
  "Transport & Logistics": "🚚",
  "Beauty & Fashion": "💄",
  "Health & Medical": "🏥",
  "Retail & Shops": "🛒",
  "Construction & Real Estate": "🏗️",
  "Media & Event Services": "🎥",
  "Technology & IT": "💻",
  "Home & Personal Services": "🏠",
  "Agriculture & Farming": "🌾",
  "General Business": "🏪",
  "Other Business": "📦",
};

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([fetchBookings(), fetchProductCategories()]);
    setLoading(false);
  };

  const fetchProductCategories = async () => {
    try {
      const { data } = await supabase.from("products").select("business_category");
      const unique = [
        ...new Set((data || []).map((p) => p.business_category).filter(Boolean)),
      ];
      setProductCategories(unique);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data } = await supabase
        .from("hire_requests")
        .select("id, status, created_at, job_description, location")
        .eq("client_id", currentUser.id)
        .order("created_at", { ascending: false });

      setBookings(data || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;

    await supabase.from("hire_requests").delete().eq("id", id);
    fetchBookings();
  };

  const getBookingColor = (status) => {
    if (status === "accepted") return "bg-green-500/20 text-green-400";
    if (status === "rejected") return "bg-red-500/20 text-red-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

  const filteredProduct = useMemo(
    () =>
      productCategories.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      ),
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
          placeholder="Search categories..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ---------------- PRODUCT CATEGORIES ---------------- */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">Shop by Category</h2>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {filteredProduct.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() =>
                navigate(`/shop?category=${encodeURIComponent(cat)}`)
              }
              className="flex flex-col items-center min-w-[80px]"
            >
              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-green-500/50 flex items-center justify-center text-3xl">
                {CATEGORY_EMOJI[cat] || "📦"}
              </div>
              <p className="text-xs mt-2 text-gray-300 truncate w-20">
                {cat}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- GENERAL WORKERS (BUSINESS CATEGORY) ---------------- */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">General Business Categories</h2>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(GENERAL_BUSINESS_CATEGORIES).map(
            ([mainCat, icon]) => (
              <button
                key={mainCat}
                onClick={() =>
                  navigate(
                    `/browse-categories?type=general&main=${encodeURIComponent(
                      mainCat
                    )}`
                  )
                }
                className="bg-white/5 p-3 rounded-xl flex flex-col items-center"
              >
                <div className="text-2xl">{icon}</div>
                <p className="text-xs mt-2 text-center text-gray-300">
                  {mainCat}
                </p>
              </button>
            )
          )}
        </div>
      </div>

      {/* ---------------- BOOKINGS ---------------- */}
      <div className="bg-white/5 p-4 rounded-xl mb-6">
        <h2 className="font-semibold mb-3">My Bookings</h2>

        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400">No bookings yet</p>
        ) : (
          bookings.slice(0, 3).map((b) => (
            <div
              key={b.id}
              className="bg-[#1a1a1a] p-3 rounded-xl mb-2 flex justify-between"
            >
              <div>
                <p className="text-sm">{b.job_description}</p>
                <p className="text-xs text-gray-400">{b.location}</p>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={`text-xs px-2 py-1 rounded ${getBookingColor(
                    b.status
                  )}`}
                >
                  {b.status || "pending"}
                </span>

                <button
                  onClick={() => handleDeleteBooking(b.id)}
                  className="text-red-400 text-xs mt-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
