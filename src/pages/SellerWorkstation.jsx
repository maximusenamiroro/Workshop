import { useState, useEffect } from "react";
import {
  FaBell,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
  FaPlus,
  FaSearch,
  FaClipboardList,
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function SellerWorkstation() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLive, setIsLive] = useState(false);
  const [service, setService] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);

  const [workerCategory, setWorkerCategory] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    file: null,
  });

  // ================= INIT =================
  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([
      fetchProducts(),
      fetchBookings(),
      fetchLiveStatus(),
      fetchWorkerCategory(),
    ]);
    setLoading(false);
  };

  // ================= CATEGORY =================
  const fetchWorkerCategory = async () => {
    const { data } = await supabase
      .from("workers")
      .select("category")
      .eq("worker_id", user.id)
      .maybeSingle();

    setWorkerCategory(data?.category || null);
  };

  // ================= LIVE STATUS =================
  const fetchLiveStatus = async () => {
    const { data } = await supabase
      .from("live_workers")
      .select("id, service")
      .eq("worker_id", user.id)
      .maybeSingle();

    if (data) {
      setIsLive(true);
      setService(data.service || "");
    } else {
      setIsLive(false);
    }
  };

  // ================= CATEGORY RESOLVER (CORE LOGIC) =================
  const resolveCategory = (fallbackService = "") => {
    return (
      workerCategory?.trim() ||
      fallbackService?.trim() ||
      service?.trim() ||
      "General Worker"
    );
  };

  // ================= TOGGLE LIVE =================
  const toggleLive = async () => {
    setLiveLoading(true);

    try {
      const finalService = resolveCategory(service);

      if (isLive) {
        await supabase
          .from("live_workers")
          .delete()
          .eq("worker_id", user.id);

        setIsLive(false);
      } else {
        await supabase.from("live_workers").upsert({
          worker_id: user.id,
          service: finalService,
          updated_at: new Date().toISOString(),
        });

        setIsLive(true);
        setService(finalService);
      }
    } catch (err) {
      alert(err.message);
    }

    setLiveLoading(false);
  };

  // ================= PRODUCTS =================
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  // ================= UPLOAD PRODUCT =================
  const uploadProduct = async () => {
    if (!form.title || !form.price) {
      return alert("Title and price required");
    }

    setUploading(true);

    try {
      let imageUrl = null;

      if (form.file) {
        const ext = form.file.name.split(".").pop();
        const fileName = `${user.id}_${Date.now()}.${ext}`;

        await supabase.storage
          .from("products")
          .upload(fileName, form.file);

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      // ================= CATEGORY LOGIC =================
      const finalCategory = resolveCategory(service);

      await supabase.from("products").insert({
        worker_id: user.id,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: finalCategory,
        image_url: imageUrl,
      });

      setForm({
        title: "",
        description: "",
        price: "",
        file: null,
      });

      setShowUpload(false);
      fetchProducts();

      alert(`Product posted under "${finalCategory}"`);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    setUploading(false);
  };

  // ================= DELETE =================
  const deleteProduct = async (product) => {
    await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    fetchProducts();
  };

  // ================= BOOKINGS =================
  const fetchBookings = async () => {
    const { data } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("worker_id", user.id)
      .limit(5);

    setBookings(data || []);
  };

  // ================= UI =================
  if (loading) {
    return <div className="text-white p-6">Loading workstation...</div>;
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        
        {/* LEFT SIDE (BOOKINGS + SEARCH) */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 text-sm bg-white/10 px-2 py-1 rounded">
            <FaClipboardList />
            Bookings
          </button>

          <FaSearch className="text-gray-300 cursor-pointer" />
        </div>

        {/* TITLE */}
        <h1 className="text-xl font-semibold">Workstation</h1>

        {/* RIGHT SIDE */}
        <FaBell />
      </div>

      {/* CATEGORY */}
      <div className="bg-white/5 p-3 rounded-xl">
        <p className="text-sm text-gray-400">Your Category</p>
        <p className="text-green-400 font-semibold">
          {workerCategory || "General Worker"}
        </p>
      </div>

      {/* LIVE SYSTEM */}
      <div className="bg-white/5 p-4 rounded-xl">
        <p className="text-sm mb-2 text-gray-400">
          Go Live (clients can see you)
        </p>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full p-2 mb-3 bg-black/30 rounded"
        >
          <option value="">Auto (Use Category)</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
        </select>

        <button onClick={toggleLive} disabled={liveLoading}>
          {isLive ? (
            <FaToggleOn size={32} className="text-green-400" />
          ) : (
            <FaToggleOff size={32} />
          )}
        </button>
      </div>

      {/* PRODUCTS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <h2>My Products</h2>
          <button onClick={() => setShowUpload(!showUpload)}>
            <FaPlus />
          </button>
        </div>

        {/* UPLOAD FORM */}
        {showUpload && (
          <div className="space-y-2 mb-4">
            <input
              placeholder="Title"
              className="w-full p-2 bg-black/30 rounded"
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              placeholder="Price"
              type="number"
              className="w-full p-2 bg-black/30 rounded"
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setForm({ ...form, file: e.target.files[0] })
              }
            />

            <button
              onClick={uploadProduct}
              className="bg-green-600 px-3 py-2 rounded"
            >
              {uploading ? "Uploading..." : "Upload Product"}
            </button>
          </div>
        )}

        {/* PRODUCT LIST */}
        {products.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center py-2 border-b border-white/10"
          >
            <div>
              <p>{p.title}</p>
              <p className="text-xs text-gray-400">{p.category}</p>
            </div>

            <button onClick={() => deleteProduct(p)}>
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
