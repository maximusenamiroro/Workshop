import { useState, useEffect, useMemo } from "react";
import { FaClock, FaBell, FaSearch, FaClipboardList, FaToggleOn, FaToggleOff, FaTrash, FaPlus } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  "Fashion", "Shoes", "Watches", "Electronics", "Home Appliances",
  "Food & Drinks", "Beauty", "Tools", "Furniture", "Sports",
  "Books", "Toys", "Health", "Others"
];

const SERVICES = [
  "Cleaning", "Driving", "Plumbing", "Electrical", "Carpentry",
  "Security", "Delivery", "Tailoring", "Painting", "Welding", "Others"
];

const BOOKING_STATUS_COLOR = {
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const getCountdown = (createdAt, now) => {
  const expireAt = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, expireAt - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
};

export default function SellerWorkstation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [service, setService] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    file: null,
  });

  // ========== INITIAL LOAD ==========
  useEffect(() => {
    if (!user) return;
    fetchAll();

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [user]);

  // ========== FETCH ALL ==========
  const fetchAll = async () => {
    await Promise.all([fetchProducts(), fetchBookings(), fetchLiveStatus()]);
    setLoading(false);
  };

  // ========== LIVE STATUS ==========
  const fetchLiveStatus = async () => {
    const { data } = await supabase
      .from("live_workers")
      .select("id, service")
      .eq("worker_id", user.id)
      .single();
    if (data) {
      setIsLive(true);
      setService(data.service || "");
    }
  };

  const toggleLive = async () => {
    setLiveLoading(true);
    try {
      if (isLive) {
        await supabase.from("live_workers").delete().eq("worker_id", user.id);
        setIsLive(false);
      } else {
        if (!service) return alert("Please select a service first");
        await supabase.from("live_workers").upsert({
          worker_id: user.id,
          service,
          updated_at: new Date(),
        });
        setIsLive(true);
      }
    } catch (err) {
      console.error("Live toggle error:", err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  // ========== PRODUCTS ==========
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, category, price, image_url, created_at")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Fetch products error:", error.message);
    setProducts(data || []);
  };

  const uploadProduct = async () => {
    if (!form.title || !form.price || !form.category) return alert("Please fill title, price and category");
    setUploading(true);
    try {
      let imageUrl = null;
      if (form.file) {
        const fileExt = form.file.name.split(".").pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("products").upload(fileName, form.file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("products").insert({
        worker_id: user.id,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        image_url: imageUrl,
      });
      if (error) throw error;

      setForm({ title: "", description: "", price: "", category: "", file: null });
      setShowUpload(false);
      fetchProducts();
      alert("✅ Product uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err.message);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteProduct = async (product) => {
    try {
      await supabase.from("products").delete().eq("id", product.id);
      if (product.image_url) {
        const fileName = product.image_url.split("/").pop();
        await supabase.storage.from("products").remove([fileName]);
      }
      fetchProducts();
    } catch (err) {
      console.error("Delete error:", err.message);
    }
  };

  // ========== BOOKINGS ==========
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("hire_requests")
      .select("id, status, created_at, job_description, location, client_id")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) console.error("Fetch bookings error:", error.message);
    setBookings(data || []);
  };

  const updateBookingStatus = async (id, status) => {
    const { error } = await supabase.from("hire_requests").update({ status }).eq("id", id);
    if (error) console.error("Update booking error:", error.message);
    else fetchBookings();
  };

  // ========== REAL-TIME SUBSCRIPTIONS ==========
  useEffect(() => {
    if (!user) return;

    const bookingsChannel = supabase
      .channel("hire_requests_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "hire_requests", filter: `worker_id=eq.${user.id}` }, fetchBookings)
      .subscribe();

    return () => supabase.removeChannel(bookingsChannel);
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 md:p-6 space-y-6 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Workstation</h1>
        <div className="flex items-center gap-4">
          <FaSearch className="text-gray-400 cursor-pointer" />
          <FaBell className="text-gray-400" />
        </div>
      </div>

      {/* GO LIVE */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h2 className="mb-3 font-semibold">Go Live</h2>
        <select value={service} onChange={(e) => setService(e.target.value)} disabled={isLive} className="w-full p-3 mb-3 bg-white/10 rounded-xl text-white text-sm">
          <option value="">Select Service</option>
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex justify-between items-center">
          <span className={isLive ? "text-green-400 font-semibold" : "text-gray-400"}>{isLive ? "🟢 You are Live" : "⚫ Offline"}</span>
          <button onClick={toggleLive} disabled={liveLoading}>
            {isLive ? <FaToggleOn className="text-green-400 text-4xl" /> : <FaToggleOff className="text-white/40 text-4xl" />}
          </button>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">My Products</h2>
          <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition">
            <FaPlus size={10} /> Add Product
          </button>
        </div>

        {showUpload && (
          <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-3">
            <input placeholder="Product Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-3 bg-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none" />
            <input placeholder="Price (₦) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full p-3 bg-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-3 bg-white/10 rounded-xl text-white text-sm outline-none">
              <option value="">Select Category *</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full p-3 bg-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none" />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Product Image</label>
              <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} className="text-gray-400 text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={uploadProduct} disabled={uploading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded-xl text-sm font-semibold transition">{uploading ? "Uploading..." : "Upload Product"}</button>
              <button onClick={() => setShowUpload(false)} className="px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition">Cancel</button>
            </div>
          </div>
        )}

        {products.length === 0 ? <p className="text-gray-500 text-sm">No products yet. Add one above!</p> : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col items-center min-w-[90px]">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-500 flex items-center justify-center bg-white/10">
                  {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                </div>
                <p className="text-xs mt-1 text-center truncate w-20">{p.title}</p>
                <p className="text-xs text-green-400">₦{Number(p.price).toLocaleString()}</p>
                <p className="text-xs text-gray-500 font-mono">{getCountdown(p.created_at, now)}</p>
                <button onClick={() => deleteProduct(p)} className="text-red-400 text-xs mt-1 hover:text-red-300"><FaTrash size={10} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOOKINGS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FaClock className="text-green-400" />
          <h3 className="font-semibold">Hire Requests</h3>
          <FaClipboardList className="cursor-pointer text-gray-400 ml-auto" onClick={() => navigate("/Bookings")} />
        </div>

        {bookings.length === 0 ? <p className="text-gray-500 text-sm">No hire requests yet.</p> : (
          bookings.map((b) => (
            <div key={b.id} className="py-3 border-b border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{b.job_description || "Job Request"}</p>
                  <p className="text-xs text-gray-500">📍 {b.location}</p>
                  <p className="text-xs text-gray-500">{formatDate(b.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${BOOKING_STATUS_COLOR[b.status] || BOOKING_STATUS_COLOR.pending}`}>
                  {b.status || "pending"}
                </span>
              </div>

              {(!b.status || b.status === "pending") && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => updateBookingStatus(b.id, "accepted")} className="flex-1 bg-green-600 hover:bg-green-700 py-1 rounded-lg text-xs font-semibold transition">Accept</button>
                  <button onClick={() => updateBookingStatus(b.id, "rejected")} className="flex-1 bg-red-600 hover:bg-red-700 py-1 rounded-lg text-xs font-semibold transition">Reject</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
