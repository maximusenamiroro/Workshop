import { useState, useEffect, useMemo } from "react";
import { FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ================= MAIN CATEGORY ICON =================
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
  "Other Business": "📦"
};

// ================= FULL BUSINESS STRUCTURE =================
const BUSINESS_CATEGORIES = {
  "Handwork & Skilled Workers": [
    "Carpenter","Plumber","Electrician","Mechanic","Welder","Tailor","Painter",
    "Bricklayer","Barber","Hair Stylist","Technician","AC Repair","Phone Repair",
    "Computer Repair","Solar Installer","CCTV Installer","Furniture Maker",
    "Tiler","POP Installer","Generator Repair","Aluminum Worker","Glass Worker","Iron Bender"
  ],

  "Food & Restaurant": [
    "Restaurant","Fast Food","Food Vendor","Catering","Bakery","Cake Shop",
    "Drinks Vendor","Shawarma","Pizza Shop","Coffee Shop","Local Kitchen",
    "Barbecue","Seafood Restaurant","Ice Cream Shop"
  ],

  "Hotel & Accommodation": [
    "Hotel","Lodge","Shortlet","Apartment","Guest House","Resort","Hostel","Vacation Home"
  ],

  "Transport & Logistics": [
    "Taxi","Car Hire","Bike Rider","Delivery Rider","Logistics","Truck Transport",
    "Moving Service","Boat Transport","Airport Pickup","Towing Service"
  ],

  "Beauty & Fashion": [
    "Salon","Makeup Artist","Spa","Nail Studio","Fashion Designer","Wig Seller",
    "Skincare Store","Perfume Store","Beauty Supply","Tattoo Studio"
  ],

  "Health & Medical": [
    "Pharmacy","Clinic","Laboratory","Dental Clinic","Therapy Center","Medical Store",
    "Diagnostic Center","Eye Clinic","Physiotherapy","Herbal Center"
  ],

  "Retail & Shops": [
    "Supermarket","Grocery Store","Electronics Shop","Phone Shop","Clothing Store",
    "Furniture Shop","Cosmetic Shop","Hardware Store","Bookstore","Stationery Shop","Gift Shop"
  ],

  "Construction & Real Estate": [
    "Construction Company","Building Contractor","Real Estate Agent","Property Manager",
    "Borehole Driller","Roofing Company","Renovation Company","Civil Engineer","Surveyor"
  ],

  "Media & Event Services": [
    "Photographer","Videographer","DJ","Event Planner","MC","Studio",
    "Content Creator","Live Streamer","Music Studio"
  ],

  "Technology & IT": [
    "Software Developer","Web Developer","App Developer","IT Support",
    "Tech Company","Cybersecurity","Internet Provider","Computer Store"
  ],

  "Home & Personal Services": [
    "Laundry","Dry Cleaning","Cleaning Service","Caregiver","Security Guard",
    "Gardening","Pest Control","Home Chef","Housekeeping"
  ],

  "Agriculture & Farming": [
    "Poultry","Fish Farm","Livestock","Crop Farming","Farm Produce Seller",
    "Palm Oil Business","Vegetable Farming","Rice Farming"
  ],

  "Wholesale & Trade": [
    "Wholesale","Distributor","Importer","Exporter","Online Store",
    "General Merchant","Market Seller","E-commerce Seller"
  ],

  "Other Business": ["Other"]
};

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [recentSubcategories, setRecentSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  const fetchRecentUploads = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("workers")
      .select("category, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    const dynamic = (data || []).map(i => i.category).filter(Boolean);

    // merge dynamic + full list (ensures completeness)
    const allSub = Object.values(BUSINESS_CATEGORIES).flat();

    const merged = [...new Set([...dynamic, ...allSub])];

    setRecentSubcategories(merged);
    setLoading(false);
  };

  const filteredRecent = useMemo(() =>
    recentSubcategories.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [recentSubcategories, search]
  );

  if (loading) {
    return <div className="text-white text-center mt-20">Loading workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <FaClipboardList onClick={() => navigate("/productorder")} />
        <h1 className="text-xl font-semibold">Workspace</h1>
        <FaBell />
      </div>

      {/* SEARCH */}
      <div className="flex items-center bg-white/5 p-2 rounded-xl mb-6">
        <FaSearch className="mr-2" />
        <input
          className="bg-transparent w-full outline-none"
          placeholder="Search business..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* BUSINESS STATUS */}
      <div className="mb-8">
        <h2 className="mb-3 font-semibold">Business Status</h2>

        <div className="flex gap-4 overflow-x-auto">
          {filteredRecent.slice(0, 15).map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/business/${cat}`)}
              className="flex flex-col items-center min-w-[70px]"
            >
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center text-lg">
                {cat[0]}
              </div>
              <span className="text-xs mt-2 text-center">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LIVE BUSINESS */}
      <div className="mb-8">
        <h2 className="mb-3 font-semibold">Live Business</h2>

        <div className="grid grid-cols-3 gap-4">
          {Object.keys(BUSINESS_CATEGORIES).map((mainCat) => (
            <button
              key={mainCat}
              onClick={() => navigate(`/live/${mainCat}`)}
              className="bg-[#1a1a1a] p-4 rounded-xl flex flex-col items-center"
            >
              <div className="text-2xl mb-2">
                {MAIN_CATEGORY_ICON[mainCat]}
              </div>
              <p className="text-xs text-center">{mainCat}</p>
            </button>
          ))}
        </div>
      </div>

      {/* GENERAL WORKERS */}
      <div>
        <h2 className="mb-3 font-semibold">General Workers</h2>

        <button
          onClick={() => navigate("/general-workers")}
          className="w-full bg-[#1a1a1a] p-4 rounded-xl text-center"
        >
          View All Workers
        </button>
      </div>

    </div>
  );
}
