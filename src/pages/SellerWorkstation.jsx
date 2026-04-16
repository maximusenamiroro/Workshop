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

  /* ---------------- CATEGORY ---------------- */
  const fetchWorkerCategory = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data } = await supabase
      .from("workers")
      .select("category, category_group")
      .eq("id", currentUser.id)
      .maybeSingle();

    setWorkerCategory(data?.category || null);
  };

  /* ---------------- LIVE STATUS ---------------- */
  const fetchLiveStatus = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data } = await supabase
      .from("live_workers")
      .select("id, service")
      .eq("worker_id", currentUser.id)
      .maybeSingle();

    if (data) {
      setIsLive(true);
      setService(data.service || "");
    } else {
      setIsLive(false);
    }
  };

  /* ---------------- FIXED CATEGORY RESOLVER ---------------- */
  const resolveCategory = (fallbackService = "") => {
    return (
      workerCategory?.trim() ||
      fallbackService?.trim() ||
      service?.trim() ||
      "General Workers"
    );
  };

  /* ---------------- LIVE TOGGLE ---------------- */
  const toggleLive = async () => {
    setLiveLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const finalService = resolveCategory(service);

      if (isLive) {
        await supabase
          .from("live_workers")
          .delete()
          .eq("worker_id", currentUser.id);

        setIsLive(false);
      } else {
        await supabase
          .from("live_workers")
          .upsert({
            worker_id: currentUser.id,
            service: finalService,
            updated_at: new Date().toISOString(),
          });

        setIsLive(true);
        setService(finalService);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  /* ---------------- PRODUCTS ---------------- */
  const fetchProducts = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data } = await supabase
      .from("products")
      .select("id, title, category, price, image_url, created_at")
      .eq("worker_id", currentUser.id)
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  /* ---------------- ORDERS ---------------- */
  const fetchProductOrders = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data: workerProducts } = await supabase
      .from("products")
      .select("id")
      .eq("worker_id", currentUser.id);

    if (!workerProducts?.length) {
      setProductOrders([]);
      return;
    }

    const productIds = workerProducts.map(p => p.id);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    setProductOrders(ordersData || []);
  };

  /* ---------------- BOOKINGS ---------------- */
  const fetchBookings = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("worker_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setBookings(data || []);
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 space-y-6 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Workstation</h1>
        <FaBell />
      </div>

      {/* CATEGORY */}
      <div className="bg-white/5 p-3 rounded-xl">
        <p className="text-sm text-gray-400">Your Category</p>
        <p className="text-green-400 font-semibold">
          {workerCategory || "General Workers"}
        </p>
      </div>

      {/* LIVE STATUS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <p className="text-sm mb-2 text-gray-400">Live Status</p>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          disabled={isLive}
          className="w-full p-2 mb-3 bg-black/30 rounded"
        >
          <option value="">
            Auto ({workerCategory || "General Workers"})
          </option>
          <option value="Cleaning">Cleaning</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
        </select>

        <button onClick={toggleLive} disabled={liveLoading}>
          {isLive ? <FaToggleOn size={30} /> : <FaToggleOff size={30} />}
        </button>
      </div>

      {/* PRODUCTS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <h2 className="font-semibold mb-2">My Products</h2>

        {products.length === 0 ? (
          <p className="text-gray-500 text-sm">No products yet</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex justify-between py-2 border-b border-white/10">
              <span>{p.title}</span>
              <span className="text-gray-400">{p.category}</span>
            </div>
          ))
        )}
      </div>

      {/* BOOKINGS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <h2 className="font-semibold mb-2">Hire Requests</h2>

        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No requests yet</p>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="border-b border-white/10 py-2">
              <p className="text-sm">{b.job_description}</p>
              <p className="text-xs text-gray-500">{b.location}</p>
            </div>
          ))
        )}
      </div>

      {/* ORDERS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <h2 className="font-semibold mb-2">Product Orders</h2>

        {productOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet</p>
        ) : (
          productOrders.map((o) => (
            <div key={o.id} className="border-b border-white/10 py-2">
              <p className="text-sm">{o.product_name}</p>
              <p className="text-xs text-gray-400">{o.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
