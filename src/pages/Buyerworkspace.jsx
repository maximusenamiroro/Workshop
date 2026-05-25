import { useState, useEffect, useMemo, useRef } from "react";
import { FaSearch, FaClipboardList, FaBell } from "react-icons/fa";
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

const SUBCATEGORY_EMOJI = {
  "Carpenter": "🪚", "Plumber": "🔧", "Electrician": "⚡", "Mechanic": "🔩",
  "Welder": "🔥", "Tailor": "🧵", "Painter": "🎨", "Barber": "💈",
  "Hair Stylist": "💇", "Restaurant": "🍽️", "Fast Food": "🍔", "Bakery": "🍞",
  "Taxi": "🚕", "Delivery Rider": "🛵", "Salon": "💅", "Makeup Artist": "💄",
  "Pharmacy": "💊", "Clinic": "🏥", "Photographer": "📸", "Videographer": "🎥",
  "DJ": "🎧", "Software Developer": "💻", "Laundry": "👕", "Cleaning Service": "🧹",
  "Security Guard": "🔒", "Catering": "🍱", "Hotel": "🏨", "Lodge": "🏠",
};

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const channelsRef = useRef([]);

  const [search, setSearch] = useState("");
  const [activeSubCategories, setActiveSubCategories] = useState([]);
  // Map of subcategory -> latest product with profile
  const [latestProductByCategory, setLatestProductByCategory] = useState({});
  // Set of main categories that have at least one live subcategory worker
  const [liveMainCategories, setLiveMainCategories] = useState(new Set());
  const [liveWorkerCount, setLiveWorkerCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    setupRealtime();
    fetchNotifCount();

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [user]);

  const setupRealtime = () => {
    const productsChannel = supabase
      .channel(`workspace_products_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "products",
      }, () => {
        fetchActiveSubCategories();
      })
      .subscribe();

    const liveChannel = supabase
      .channel(`workspace_live_${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_workers" },
        () => { fetchLiveWorkerCount(); fetchLiveMainCategories(); })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "live_workers" },
        () => { fetchLiveWorkerCount(); fetchLiveMainCategories(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_workers" },
        () => { fetchLiveMainCategories(); })
      .subscribe();

    const notifChannel = supabase
      .channel(`workspace_notif_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "notifications", filter: `user_id=eq.${user.id}`,
      }, () => setNotifCount(prev => prev + 1))
      .subscribe();

    channelsRef.current = [productsChannel, liveChannel, notifChannel];
  };

  const fetchAll = async () => {
    await Promise.all([
      fetchActiveSubCategories(),
      fetchLiveWorkerCount(),
      fetchLiveMainCategories(),
    ]);
    setLoading(false);
  };

  const fetchNotifCount = async () => {
    try {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotifCount(count || 0);
    } catch (err) {
      console.error("fetchNotifCount error:", err.message);
    }
  };

  // Fetch active subcategories + latest product poster per category
  const fetchActiveSubCategories = async () => {
    try {
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("products")
        .select(`
          id, worker_id, category, created_at, image_url, title,
          profiles!products_worker_id_fkey(full_name, avatar_url)
        `)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const workerIds = [...new Set((data || []).map(p => p.worker_id).filter(Boolean))];
      let workerCategoryMap = {};
      if (workerIds.length > 0) {
        const { data: workersData } = await supabase
          .from("workers")
          .select("id, category")
          .in("id", workerIds);
        (workersData || []).forEach(w => {
          if (w.category) workerCategoryMap[w.id] = w.category;
        });
      }

      // Build subcategory set + latest product per category
      const subCatSet = new Set();
      const latestMap = {};

      (data || []).forEach(p => {
        const cat = workerCategoryMap[p.worker_id] || p.category;
        if (!cat) return;
        subCatSet.add(cat);
        // Keep only the most recent product per category (data is already sorted desc)
        if (!latestMap[cat]) {
          latestMap[cat] = {
            avatar_url: p.profiles?.avatar_url || null,
            full_name: p.profiles?.full_name || "Worker",
            product_image: p.image_url || null,
          };
        }
      });

      setActiveSubCategories([...subCatSet]);
      setLatestProductByCategory(latestMap);
    } catch (err) {
      console.error("fetchActiveSubCategories error:", err.message);
    }
  };

  const fetchLiveWorkerCount = async () => {
    try {
      const { count } = await supabase
        .from("live_workers")
        .select("id", { count: "exact", head: true });
      setLiveWorkerCount(count || 0);
    } catch (err) {
      console.error("fetchLiveWorkerCount error:", err.message);
    }
  };

  // Fetch which main categories have live workers under their subcategories
  const fetchLiveMainCategories = async () => {
    try {
      // Get all live workers with their category
      const { data: liveData } = await supabase
        .from("live_workers")
        .select("worker_id");

      if (!liveData || liveData.length === 0) {
        setLiveMainCategories(new Set());
        return;
      }

      const workerIds = liveData.map(w => w.worker_id);

      // Get categories for these workers
      const { data: workersData } = await supabase
        .from("workers")
        .select("id, category, category_group")
        .in("id", workerIds);

      // Map subcategory → main category
      const liveMainCats = new Set();

      (workersData || []).forEach(w => {
        if (w.category_group) {
          liveMainCats.add(w.category_group);
          return;
        }
        // Try to find which main category this subcategory belongs to
        if (w.category) {
          for (const [mainCat, subCats] of Object.entries(BUSINESS_CATEGORIES)) {
            if (subCats.includes(w.category)) {
              liveMainCats.add(mainCat);
              break;
            }
          }
        }
      });

      setLiveMainCategories(liveMainCats);
    } catch (err) {
      console.error("fetchLiveMainCategories error:", err.message);
    }
  };

  const filteredCategories = useMemo(() =>
    Object.keys(BUSINESS_CATEGORIES).filter(c =>
      c.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#0f0f0f] text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0f0f0f] text-white p-4 pb-28">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-6 px-1">
        {/* Orders */}
        <button
          onClick={() => navigate("/my-orders")}
          className="flex flex-col items-center cursor-pointer active:opacity-70 p-2"
        >
          <FaClipboardList className="text-white/70 text-xl" />
          <span className="text-[10px] text-gray-400 mt-1">Orders</span>
        </button>

        {/* Title */}
        <h1 className="text-xl font-semibold">Workspace</h1>

        {/* Right side — Bell + Live count stacked neatly */}
        <div className="flex flex-col items-center gap-1">
          {/* Notification bell — clean and aligned */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition-all"
          >
            <FaBell size={16} className="text-white/70" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                <span className="text-white text-[9px] font-bold leading-none">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              </span>
            )}
          </button>

          {/* Live workers count */}
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">{liveWorkerCount} live</span>
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="flex items-center bg-white/5 p-2.5 rounded-xl mb-6">
        <FaSearch className="mr-2 text-white/40 flex-shrink-0" />
        <input
          className="bg-transparent w-full outline-none text-white placeholder-gray-500 text-sm"
          placeholder="Search business..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── NEW ARRIVALS ── */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            🆕 New Arrivals
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              48h only
            </span>
          </h2>
          {activeSubCategories.length > 0 && (
            <button onClick={() => navigate("/new-arrivals")} className="text-xs text-green-400">
              See All →
            </button>
          )}
        </div>

        {activeSubCategories.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">No new products in last 48 hours</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {activeSubCategories.map((cat) => {
              const latest = latestProductByCategory[cat];
              return (
                <button
                  key={cat}
                  onClick={() => navigate(`/new-arrivals?category=${encodeURIComponent(cat)}`)}
                  className="flex flex-col items-center min-w-[72px] cursor-pointer active:scale-95 transition-transform"
                >
                  {/* Story ring — shows poster's profile picture if available */}
                  <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-green-400 to-green-600 relative">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#0f0f0f] bg-[#1a1a1a]">
                      {latest?.avatar_url ? (
                        <img
                          src={latest.avatar_url}
                          alt={latest.full_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : latest?.product_image ? (
                        <img
                          src={latest.product_image}
                          alt={cat}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">{SUBCATEGORY_EMOJI[cat] || "📦"}</span>
                        </div>
                      )}
                    </div>
                    {/* Small category emoji badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0f0f0f] rounded-full flex items-center justify-center text-[10px] border border-[#0f0f0f]">
                      {SUBCATEGORY_EMOJI[cat] || "📦"}
                    </div>
                  </div>
                  <p className="text-[10px] text-white mt-1.5 truncate w-16 text-center font-medium">
                    {cat}
                  </p>
                  {latest?.full_name && (
                    <p className="text-[9px] text-gray-500 truncate w-16 text-center">
                      @{latest.full_name.split(" ")[0]}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LIVE BUSINESS — green dot if any subcat has live worker ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold">Live Business</h2>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filteredCategories.map((mainCat) => {
            const hasLive = liveMainCategories.has(mainCat);
            return (
              <button
                key={mainCat}
                onClick={() => navigate(`/subcategories?main=${encodeURIComponent(mainCat)}`)}
                className={`bg-[#1a1a1a] p-4 rounded-xl flex flex-col items-center hover:bg-[#242424] transition active:scale-95 relative ${
                  hasLive ? "ring-1 ring-green-500/30" : ""
                }`}
              >
                {/* Live dot badge on top-right */}
                {hasLive && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
                <div className="text-2xl mb-2">{MAIN_CATEGORY_ICON[mainCat] || "📦"}</div>
                <p className="text-xs text-center leading-tight">{mainCat}</p>
                {hasLive && (
                  <p className="text-[9px] text-green-400 mt-1 font-medium">Live Now</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GENERAL WORKERS ── */}
      <div>
        <h2 className="mb-3 font-semibold">General Workers</h2>
        <button
          onClick={() => navigate("/hire-worker?type=general")}
          className="w-full bg-[#1a1a1a] p-4 rounded-xl text-center hover:bg-[#242424] transition active:scale-95"
        >
          View All General Workers
        </button>
      </div>
    </div>
  );
}