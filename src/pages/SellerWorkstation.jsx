import { useState, useEffect } from "react";
import {
  FaBell, FaToggleOn, FaToggleOff,
  FaTrash, FaPlus, FaSearch, FaClipboardList,
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const BOOKING_STATUS_COLOR = {
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

const ORDER_STATUS_COLOR = {
  pending: "bg-yellow-500/20 text-yellow-400",
  shipping: "bg-blue-500/20 text-blue-400",
  "on the way": "bg-blue-500/20 text-blue-400",
  arriving: "bg-purple-500/20 text-purple-400",
  delivered: "bg-green-500/20 text-green-400",
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SellerWorkstation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLive, setIsLive] = useState(false);
  const [workerCategory, setWorkerCategory] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    file: null,
  });

  // SINGLE SOURCE OF TRUTH
  const category = workerCategory || "General Worker";

  useEffect(() => {
    if (!user) return;
    fetchAll();

    const bookingsChannel = supabase
      .channel(`workstation_bookings_${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "hire_requests",
        filter: `worker_id=eq.${user.id}`,
      }, fetchBookings)
      .subscribe();

    const ordersChannel = supabase
      .channel(`workstation_orders_${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
      }, fetchProductOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([
      fetchWorkerCategory(),
      fetchLiveStatus(),
      fetchProducts(),
      fetchBookings(),
      fetchProductOrders(),
    ]);
    setLoading(false);
  };

  // ---------------- CATEGORY (SINGLE SOURCE) ----------------
  const fetchWorkerCategory = async () => {
    try {
      const { data } = await supabase
        .from("workers")
        .select("category")
        .eq("id", user.id)
        .maybeSingle();

      setWorkerCategory(data?.category || null);
    } catch (err) {
      console.error(err.message);
    }
  };

  // ---------------- LIVE STATUS ----------------
  const fetchLiveStatus = async () => {
    try {
      const { data } = await supabase
        .from("live_workers")
        .select("id")
        .eq("worker_id", user.id)
        .maybeSingle();

      setIsLive(!!data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const toggleLive = async () => {
    try {
      if (isLive) {
        await supabase
          .from("live_workers")
          .delete()
          .eq("worker_id", user.id);

        setIsLive(false);
      } else {
        await supabase
          .from("live_workers")
          .upsert({
            worker_id: user.id,
            service: category,
            updated_at: new Date().toISOString(),
          });

        setIsLive(true);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  // ---------------- PRODUCTS ----------------
  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false });

      setProducts(data || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  const uploadProduct = async () => {
    if (!form.title || !form.price) return alert("Title and price required");

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

      await supabase.from("products").insert({
        worker_id: user.id,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: category, // SINGLE SOURCE OF TRUTH
        image_url: imageUrl,
      });

      setForm({ title: "", description: "", price: "", file: null });
      setShowUpload(false);
      fetchProducts();

      alert(`✅ Posted under "${category}"`);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteProduct = async (product) => {
    await supabase.from("products").delete().eq("id", product.id);
    fetchProducts();
  };

  // ---------------- BOOKINGS ----------------
  const fetchBookings = async () => {
    const { data } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setBookings(data || []);
  };

  const updateBookingStatus = async (id, status) => {
    await supabase
      .from("hire_requests")
      .update({ status })
      .eq("id", id);

    fetchBookings();
  };

  // ---------------- ORDERS ----------------
  const fetchProductOrders = async () => {
    const { data: workerProducts } = await supabase
      .from("products")
      .select("id")
      .eq("worker_id", user.id);

    if (!workerProducts?.length) return setProductOrders([]);

    const productIds = workerProducts.map(p => p.id);

    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    setProductOrders(data || []);
  };

  const updateOrderStatus = async (id, status) => {
    await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    fetchProductOrders();
  };

  // ---------------- UI ----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 space-y-6 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate("/Bookings")} className="text-sm">
          <FaClipboardList /> Bookings
        </button>

        <h1 className="font-semibold">Workstation</h1>

        <FaBell />
      </div>

      {/* CATEGORY */}
      <div className="bg-white/5 p-3 rounded-xl">
        <p className="text-gray-400 text-sm">Category</p>
        <p className="text-green-400 font-semibold">{category}</p>
      </div>

      {/* LIVE */}
      <div className="bg-white/5 p-4 rounded-xl">
        <p className="text-gray-400 text-sm mb-2">
          Go Live (visible in {category})
        </p>

        <div className="flex justify-between items-center">
          <span className={isLive ? "text-green-400" : "text-gray-400"}>
            {isLive ? "Live" : "Offline"}
          </span>

          <button onClick={toggleLive}>
            {isLive ? <FaToggleOn size={30} /> : <FaToggleOff size={30} />}
          </button>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <div className="flex justify-between">
          <h2>Products</h2>
          <button onClick={() => setShowUpload(!showUpload)}>
            <FaPlus />
          </button>
        </div>

        {showUpload && (
          <div className="space-y-2 mt-3">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2 bg-black/30"
            />

            <input
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full p-2 bg-black/30"
            />

            <button onClick={uploadProduct} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}

        {products.map(p => (
          <div key={p.id} className="flex justify-between py-2">
            <div>
              {p.title} — ₦{p.price}
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
