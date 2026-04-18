import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/* ---------------- LIVE CATEGORIES PAGE ---------------- */
function LiveCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("live_workers")
      .select("service");

    const unique = [...new Set((data || []).map(i => i.service))];
    setCategories(unique);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
      <h1 className="text-xl font-bold mb-4">Live Categories</h1>

      <div className="grid gap-3">
        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => navigate(`/live/${cat}`)}
            className="bg-white/10 p-4 rounded-xl text-left hover:bg-white/20"
          >
            {cat}
          </button>
        ))}

        {categories.length === 0 && (
          <p className="text-gray-400">No live workers available</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- LIVE WORKERS PAGE ---------------- */
function LiveWorkersPage() {
  const { category } = useParams();
  const [workers, setWorkers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, [category]);

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from("live_workers")
      .select("worker_id, service");

    const filtered = (data || []).filter(
      w => w.service === category
    );

    setWorkers(filtered);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
      <h1 className="text-xl font-bold mb-4">{category}</h1>

      <div className="space-y-3">
        {workers.map((w, i) => (
          <button
            key={i}
            onClick={() => navigate(`/worker/${w.worker_id}`)}
            className="w-full bg-white/10 p-4 rounded-xl text-left hover:bg-white/20"
          >
            Worker ID: {w.worker_id}
          </button>
        ))}

        {workers.length === 0 && (
          <p className="text-gray-400">No active workers in this category</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- WORKER PROFILE PAGE ---------------- */
function WorkerProfilePage() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchWorker();
    fetchProducts();
  }, [id]);

  const fetchWorker = async () => {
    const { data } = await supabase
      .from("workers")
      .select("*")
      .eq("id", id)
      .single();

    setWorker(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("worker_id", id);

    setProducts(data || []);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
      <h1 className="text-xl font-bold mb-2">Worker Profile</h1>

      {worker && (
        <div className="bg-white/10 p-4 rounded-xl mb-4">
          <p className="text-green-400 font-semibold">
            {worker.category}
          </p>
          <p className="text-sm text-gray-400">ID: {worker.id}</p>
        </div>
      )}

      <h2 className="font-semibold mb-2">Products</h2>

      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="bg-white/10 p-3 rounded-xl">
            <p>{p.title}</p>
            <p className="text-sm text-gray-400">₦{p.price}</p>
          </div>
        ))}

        {products.length === 0 && (
          <p className="text-gray-400">No products yet</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- APP ROUTER ---------------- */
export default function LiveMarketplaceApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LiveCategoriesPage />} />
        <Route path="/live/:category" element={<LiveWorkersPage />} />
        <Route path="/worker/:id" element={<WorkerProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
