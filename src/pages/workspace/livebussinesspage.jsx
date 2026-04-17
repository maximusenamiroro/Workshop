// ================= BUSINESS PAGE =================
// route: /business/:subcategory
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function BusinessPage() {
  const { subcategory } = useParams();
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, [subcategory]);

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from("workers")
      .select("*")
      .eq("category", subcategory);

    setWorkers(data || []);
  };

  if (!workers.length) {
    return <p className="text-center text-gray-400 mt-10">No workers available.</p>;
  }

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl mb-4">{subcategory}</h1>

      <div className="grid grid-cols-2 gap-4">
        {workers.map((w) => (
          <div key={w.id} className="bg-[#1a1a1a] p-3 rounded-xl">
            <p className="font-semibold">{w.name}</p>
            <p className="text-sm text-gray-400">{w.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= LIVE BUSINESS PAGE =================
// route: /live/:mainCategory
import { useParams } from "react-router-dom";

const BUSINESS_CATEGORIES = {
  "Handwork & Skilled Workers": ["Carpenter","Plumber","Electrician"],
  "Food & Restaurant": ["Restaurant","Fast Food"],
  "Technology & IT": ["Software Developer","Web Developer"]
};

export function LiveBusinessPage() {
  const { mainCategory } = useParams();
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, [mainCategory]);

  const fetchWorkers = async () => {
    const subcategories = BUSINESS_CATEGORIES[mainCategory] || [];

    const { data } = await supabase
      .from("workers")
      .select("*")
      .in("category", subcategories);

    setWorkers(data || []);
  };

  if (!workers.length) {
    return <p className="text-center text-gray-400 mt-10">No live business available.</p>;
  }

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl mb-4">{mainCategory}</h1>

      <div className="grid grid-cols-2 gap-4">
        {workers.map((w) => (
          <div key={w.id} className="bg-[#1a1a1a] p-3 rounded-xl">
            <p className="font-semibold">{w.name}</p>
            <p className="text-sm text-gray-400">{w.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= GENERAL WORKERS PAGE =================
// route: /general-workers
export function GeneralWorkersPage() {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from("workers")
      .select("*");

    setWorkers(data || []);
  };

  if (!workers.length) {
    return <p className="text-center text-gray-400 mt-10">No workers found.</p>;
  }

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl mb-4">General Workers</h1>

      <div className="grid grid-cols-2 gap-4">
        {workers.map((w) => (
          <div key={w.id} className="bg-[#1a1a1a] p-3 rounded-xl">
            <p className="font-semibold">{w.name}</p>
            <p className="text-sm text-gray-400">{w.category || "General"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= ROUTER SETUP =================
// Add this in your App.js or Router file
/*
import { BusinessPage, LiveBusinessPage, GeneralWorkersPage } from "./pages/DynamicPages";

<Route path="/business/:subcategory" element={<BusinessPage />} />
<Route path="/live/:mainCategory" element={<LiveBusinessPage />} />
<Route path="/general-workers" element={<GeneralWorkersPage />} />
*/
