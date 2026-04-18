import { useState, useEffect, useMemo } from "react";
import { FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MAIN_CATEGORY_ICON = {
  "Handwork & Skilled Workers": "🛠️",
  "Food & Restaurant": "🍔",
  "Hotel & Accommodation": "🏨",
  "Transport & Logistics": "🚗",
  "Beauty & Fashion": "💄",
  "Health & Medical": "💊",
  "Retail & Shops": "🛍️",
  "Construction & Real Estate": "🏗️",
  "Media & Event Services": "🎥",
  "Technology & IT": "💻",
  "Home & Personal Services": "🏠",
  "Agriculture & Farming": "🌾",
  "Wholesale & Trade": "💼",
  "Other Business": "📦",
};

const BUSINESS_CATEGORIES = {
  "Handwork & Skilled Workers": ["Carpenter","Plumber","Electrician","Mechanic","Welder","Tailor","Painter","Bricklayer","Barber","Hair Stylist","Technician","AC Repair","Phone Repair","Computer Repair","Solar Installer","CCTV Installer","Furniture Maker","Tiler","POP Installer","Generator Repair","Aluminum Worker","Glass Worker","Iron Bender"],
  "Food & Restaurant": ["Restaurant","Fast Food","Food Vendor","Catering","Bakery","Cake Shop","Drinks Vendor","Shawarma","Pizza Shop","Coffee Shop","Local Kitchen","Barbecue","Seafood Restaurant","Ice Cream Shop"],
  "Hotel & Accommodation": ["Hotel","Lodge","Shortlet","Apartment","Guest House","Resort","Hostel","Vacation Home"],
  "Transport & Logistics": ["Taxi","Car Hire","Bike Rider","Delivery Rider","Logistics","Truck Transport","Moving Service","Boat Transport","Airport Pickup","Towing Service"],
  "Beauty & Fashion": ["Salon","Makeup Artist","Spa","Nail Studio","Fashion Designer","Wig Seller","Skincare Store","Perfume Store","Beauty Supply","Tattoo Studio"],
  "Health & Medical": ["Pharmacy","Clinic","Laboratory","Dental Clinic","Therapy Center","Medical Store","Diagnostic Center","Eye Clinic","Physiotherapy","Herbal Center"],
  "Retail & Shops": ["Supermarket","Grocery Store","Electronics Shop","Phone Shop","Clothing Store","Furniture Shop","Cosmetic Shop","Hardware Store","Bookstore","Stationery Shop","Gift Shop"],
  "Construction & Real Estate": ["Construction Company","Building Contractor","Real Estate Agent","Property Manager","Borehole Driller","Roofing Company","Renovation Company","Civil Engineer","Surveyor"],
  "Media & Event Services": ["Photographer","Videographer","DJ","Event Planner","MC","Studio","Content Creator","Live Streamer","Music Studio"],
  "Technology & IT": ["Software Developer","Web Developer","App Developer","IT Support","Tech Company","Cybersecurity","Internet Provider","Computer Store"],
  "Home & Personal Services": ["Laundry","Dry Cleaning","Cleaning Service","Caregiver","Security Guard","Gardening","Pest Control","Home Chef","Housekeeping"],
  "Agriculture & Farming": ["Poultry","Fish Farm","Livestock","Crop Farming","Farm Produce Seller","Palm Oil Business","Vegetable Farming","Rice Farming"],
  "Wholesale & Trade": ["Wholesale","Distributor","Importer","Exporter","Online Store","General Merchant","Market Seller","E-commerce Seller"],
  "Other Business": ["Other"],
};

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Clock for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    await fetchRecentProducts();
    setLoading(false);
  };

  const fetchRecentProducts = async () => {
    try {
      // Only fetch products uploaded in last 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("products")
        .select("id, title, category, created_at, image_url")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;

      const withCountdown = (data || []).map(product => ({
        ...product,
        expiresAt: new Date(product.created_at).getTime() + 24 * 60 * 60 * 1000,
      }));

      setRecentProducts(withCountdown);
    } catch (err) {
      console.error("Failed to fetch recent products:", err.message);
    }
  };

  const formatCountdown = (expiresAt) => {
    const diff = expiresAt - now;
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const filteredCategories = useMemo(() =>
    Object.keys(BUSINESS_CATEGORIES).filter(c =>
      c.toLowerCase().includes(search.toLowerCase())
    ), [search]);

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
          className="bg-transparent w-full outline-none text-white placeholder-gray-500"
          placeholder="Search business..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* NEW ARRIVALS */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            🆕 New Arrivals
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              24h only
            </span>
          </h2>
          {/* <button
            onClick={() => navigate("/shop")}
            className="text-xs text-green-400"
          >
            See All →
          </button> */}
        </div>

        {recentProducts.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm mb-2">No new products in last 24 hours</p>
            {/* <button
              onClick={() => navigate("/shop")}
              className="text-green-400 text-sm underline"
            >
              Browse all products
            </button> */}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3">
            {recentProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="flex flex-col items-center min-w-[110px] bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition"
              >
                <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center text-4xl mb-2 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <p className="text-xs font-medium text-center line-clamp-2 h-9">
                  {product.title}
                </p>
                <p className="text-[10px] text-green-400 mt-1">
                  ⏳ {formatCountdown(product.expiresAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIVE BUSINESS */}
      <div className="mb-8">
        <h2 className="mb-3 font-semibold">Live Business</h2>
        <div className="grid grid-cols-3 gap-4">
          {filteredCategories.map((mainCat) => (
            <button
              key={mainCat}
              onClick={() => navigate(`/subcategories?main=${encodeURIComponent(mainCat)}`)}
              className="bg-[#1a1a1a] p-4 rounded-xl flex flex-col items-center hover:bg-[#242424] transition active:scale-95"
            >
              <div className="text-2xl mb-2">
                {MAIN_CATEGORY_ICON[mainCat] || "📦"}
              </div>
              <p className="text-xs text-center leading-tight">{mainCat}</p>
            </button>
          ))}
        </div>
      </div>

      {/* GENERAL WORKERS */}
      <div>
        <h2 className="mb-3 font-semibold">General Workers</h2>
        <button
          onClick={() => navigate("/hire-worker?type=general")}
          className="w-full bg-[#1a1a1a] p-4 rounded-xl text-center hover:bg-[#242424] transition"
        >
          View All General Workers
        </button>
      </div>
    </div>
  );
}