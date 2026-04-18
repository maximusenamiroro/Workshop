import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaArrowLeft, FaUsers } from "react-icons/fa";

// Import your BUSINESS_CATEGORIES (same as in BuyerWorkspace)
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
  "Other Business": ["Other"]
};

export default function SubCategoriesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mainCategory = searchParams.get("main");

  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mainCategory) {
      fetchSubCategoriesWithCount();
    }
  }, [mainCategory]);

  const fetchSubCategoriesWithCount = async () => {
    try {
      setLoading(true);

      // Get the official subcategories for this main category
      const officialSubs = BUSINESS_CATEGORIES[mainCategory] || [];

      // Get live workers
      const { data: liveData } = await supabase
        .from("live_workers")
        .select("service, worker_id");

      const workerIds = liveData?.map(w => w.worker_id) || [];

      let categoryMap = {};
      if (workerIds.length > 0) {
        const { data: workersData } = await supabase
          .from("workers")
          .select("id, category")
          .in("id", workerIds);

        (workersData || []).forEach(w => {
          categoryMap[w.id] = w.category;
        });
      }

      // Count only subcategories that belong to this main category
      const countMap = {};
      (liveData || []).forEach(w => {
        const subCat = categoryMap[w.worker_id] || w.service;
        if (subCat && officialSubs.includes(subCat)) {
          countMap[subCat] = (countMap[subCat] || 0) + 1;
        }
      });

      // Format result (only show subs that have at least 1 live worker)
      const formatted = Object.entries(countMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count); // Sort by most live first

      setSubCategories(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
          <FaArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{mainCategory}</h1>
          <p className="text-gray-400 text-sm">Choose a subcategory</p>
        </div>
      </div>

      {subCategories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">😔</p>
          <p>No live workers available in this category yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subCategories.map((sub) => (
            <button
              key={sub.name}
              onClick={() => navigate(`/hire-worker?category=${encodeURIComponent(sub.name)}`)}
              className="w-full bg-[#1a1a1a] hover:bg-[#242424] p-5 rounded-2xl flex justify-between items-center transition-all active:scale-[0.98]"
            >
              <div className="text-left">
                <p className="font-semibold text-lg">{sub.name}</p>
              </div>
              <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
                <FaUsers />
                <span>{sub.count} live</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}