import { useState, useEffect, useRef } from "react";
import {
  FaBell, FaToggleOn, FaToggleOff,
  FaTrash, FaPlus, FaSearch, FaClipboardList, FaEye,
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";

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

const ORDER_STATUS_STEPS = ["shipping", "on the way", "arriving", "delivered"];

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function SellerWorkstation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const geoWatchRef = useRef(null);
  const channelsRef = useRef([]);
  const { showToast, ToastUI } = useToast();

  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [productViews, setProductViews] = useState({});
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [service, setService] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [workerCategory, setWorkerCategory] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  const [form, setForm] = useState({
    title: "", description: "", price: "", file: null,
  });

  useEffect(() => {
    return () => {
      if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    setupRealtime();
  }, [user]);

  const setupRealtime = () => {
    // ── Bookings channel — ALL .on() before .subscribe() ──
    const bookingsChannel = supabase
      .channel(`workstation_bookings_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "hire_requests",
        filter: `worker_id=eq.${user.id}`,
      }, (payload) => {
        setBookings(prev => [payload.new, ...prev]);
        showToast("📋 New hire request received!", "success");
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "hire_requests",
        filter: `worker_id=eq.${user.id}`,
      }, (payload) => {
        setBookings(prev =>
          prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b)
        );
      })
      .subscribe(); // ← subscribe LAST

    // ── Orders channel — ALL .on() before .subscribe() ──
    const ordersChannel = supabase
      .channel(`workstation_orders_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "orders",
      }, async (payload) => {
        const newOrder = payload.new;
        if (!newOrder.product_id) return;

        const { data: product } = await supabase
          .from("products")
          .select("id, title, image_url")
          .eq("id", newOrder.product_id)
          .eq("worker_id", user.id)
          .maybeSingle();

        if (!product) return;

        const { data: buyer } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", newOrder.user_id)
          .maybeSingle();

        const enrichedOrder = {
          ...newOrder,
          buyer_name: buyer?.full_name || "Customer",
          product_image_url: newOrder.product_image_url || product.image_url,
        };

        setProductOrders(prev => [enrichedOrder, ...prev]);
        setNewOrderIds(prev => new Set([...prev, newOrder.id]));
        showToast(`🛍️ New order from ${buyer?.full_name || "a customer"}!`);

        setTimeout(() => {
          setNewOrderIds(prev => {
            const next = new Set(prev);
            next.delete(newOrder.id);
            return next;
          });
        }, 10000);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      }, (payload) => {
        setProductOrders(prev =>
          prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o)
        );
      })
      .subscribe(); // ← subscribe LAST

    channelsRef.current = [bookingsChannel, ordersChannel];
  };

  const fetchAll = async () => {
    if (!user) return;
    await Promise.all([
      fetchWorkerCategory(),
      fetchLiveStatus(),
      fetchProducts(),
      fetchBookings(),
      fetchProductOrders(),
    ]);
    setLoading(false);
  };

  const fetchWorkerCategory = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("workers")
        .select("category, category_group")
        .eq("id", user.id)
        .maybeSingle();
      setWorkerCategory(data?.category || null);
    } catch (err) {
      console.error("fetchWorkerCategory failed:", err.message);
    }
  };

  const fetchLiveStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("live_workers")
        .select("id, service")
        .eq("worker_id", user.id)
        .maybeSingle();
      if (data) { setIsLive(true); setService(data.service || ""); }
      else setIsLive(false);
    } catch (err) {
      console.error("fetchLiveStatus failed:", err.message);
    }
  };

  const resolveCategory = (fallbackService = "") =>
    workerCategory?.trim() || fallbackService?.trim() || service?.trim() || "General Worker";

  const toggleLive = async () => {
    if (!user) return;
    setLiveLoading(true);
    try {
      const finalService = resolveCategory(service);

      if (isLive) {
        if (geoWatchRef.current) { navigator.geolocation.clearWatch(geoWatchRef.current); geoWatchRef.current = null; }
        await supabase.from("live_workers").delete().eq("worker_id", user.id);
        setIsLive(false);
        setLiveLoading(false);
        showToast("You are now offline");
        return;
      }

      if (!navigator.geolocation) {
        showToast("Your device does not support location.", "error");
        setLiveLoading(false);
        return;
      }

      if (navigator.permissions) {
        try {
          const perm = await navigator.permissions.query({ name: "geolocation" });
          if (perm.state === "denied") {
            showToast("Location blocked. Enable it in browser settings.", "error");
            setLiveLoading(false);
            return;
          }
        } catch (e) { console.warn("Permissions API not supported"); }
      }

      showToast("Getting your location...", "warning");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { error } = await supabase.from("live_workers").upsert({
              worker_id: user.id,
              service: finalService,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              last_seen: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            if (error) throw error;
            setIsLive(true);
            setService(finalService);
            showToast("🟢 You are now live!");

            geoWatchRef.current = navigator.geolocation.watchPosition(
              async (position) => {
                try {
                  await supabase.from("live_workers").update({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    last_seen: new Date().toISOString(),
                  }).eq("worker_id", user.id);
                } catch (err) { console.error("GPS update error:", err.message); }
              },
              (err) => console.warn("GPS watch error:", err.message),
              { enableHighAccuracy: false, maximumAge: 10000, timeout: 15000 }
            );
          } catch (err) {
            showToast("Failed to go live: " + err.message, "error");
          } finally {
            setLiveLoading(false);
          }
        },
        (err) => {
          if (err.code === 1) showToast("Location access denied. Enable in browser settings.", "error");
          else if (err.code === 2) showToast("Could not get location. Turn on GPS.", "error");
          else if (err.code === 3) showToast("Location timed out. Try again.", "error");
          else showToast("Location error. Enable location and try again.", "error");
          setLiveLoading(false);
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 }
      );
    } catch (err) {
      showToast("Failed: " + err.message, "error");
      setLiveLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("products")
        .select("id, title, category, price, image_url, created_at")
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false });
      setProducts(data || []);
      if (data?.length > 0) await fetchProductViews(data.map(p => p.id));
    } catch (err) {
      console.error("fetchProducts failed:", err.message);
    }
  };

  const fetchProductViews = async (productIds) => {
    try {
      const { data, error } = await supabase
        .from("product_views")
        .select("product_id")
        .in("product_id", productIds);
      if (error) throw error;
      const viewCounts = {};
      (data || []).forEach(v => { viewCounts[v.product_id] = (viewCounts[v.product_id] || 0) + 1; });
      setProductViews(viewCounts);
    } catch (err) {
      console.error("fetchProductViews failed:", err.message);
    }
  };

  const fetchProductOrders = async () => {
    if (!user) return;
    try {
      const { data: workerProducts } = await supabase
        .from("products").select("id").eq("worker_id", user.id);
      if (!workerProducts?.length) { setProductOrders([]); return; }

      const productIds = workerProducts.map(p => p.id);
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("id, product_name, product_image_url, status, created_at, user_id, quantity, total_amount, product_id")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const buyerIds = [...new Set((ordersData || []).map(o => o.user_id).filter(Boolean))];
      let buyerMap = {};
      if (buyerIds.length > 0) {
        const { data: buyersData } = await supabase
          .from("profiles").select("id, full_name").in("id", buyerIds);
        (buyersData || []).forEach(b => { buyerMap[b.id] = b.full_name; });
      }

      setProductOrders((ordersData || []).map(o => ({
        ...o, buyer_name: buyerMap[o.user_id] || "Customer",
      })));
    } catch (err) {
      console.error("fetchProductOrders failed:", err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setProductOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { showToast("Failed to update: " + error.message, "error"); fetchProductOrders(); }
    else showToast(`Order marked as "${status}"`);
  };

  const uploadProduct = async () => {
    if (!form.title) { showToast("Title is required", "warning"); return; }
    if (!user) return;
    setUploading(true);
    try {
      let imageUrl = null;
      if (form.file) {
        if (!form.file.type.startsWith("image/")) throw new Error("Please select an image file");
        const sizeMB = form.file.size / (1024 * 1024);
        if (sizeMB > 10) throw new Error(`Image too large. Use under 10MB`);
        const ext = form.file.name.split(".").pop().toLowerCase();
        const fileName = `${user.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, form.file, { cacheControl: "3600", upsert: false, contentType: form.file.type });
        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
      const finalCategory = resolveCategory(service);
      const { error } = await supabase.from("products").insert({
        worker_id: user.id,
        title: form.title,
        description: form.description || "",
        price: form.price ? parseFloat(form.price) : null,
        category: finalCategory,
        image_url: imageUrl,
      });
      if (error) throw new Error("Failed to save product: " + error.message);
      setForm({ title: "", description: "", price: "", file: null });
      setShowUpload(false);
      fetchProducts();
      showToast(`Product posted under "${finalCategory}"`);
    } catch (err) {
      showToast(err.message, "error");
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
      setProducts(prev => prev.filter(p => p.id !== product.id));
      showToast("Product deleted");
    } catch (err) {
      showToast("Failed to delete product", "error");
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("hire_requests")
        .select("id, status, created_at, job_description, location, client_id")
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setBookings(data || []);
    } catch (err) {
      console.error("fetchBookings failed:", err.message);
    }
  };

  const updateBookingStatus = async (id, status) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    const { error } = await supabase.from("hire_requests").update({ status }).eq("id", id);
    if (error) { showToast("Failed to update: " + error.message, "error"); fetchBookings(); }
    else showToast(`Booking ${status}`);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#1A1A1A] text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pendingOrdersCount = productOrders.filter(o => o.status === "pending").length;
  const pendingBookingsCount = bookings.filter(b => !b.status || b.status === "pending").length;

  return (
    <div className="h-full overflow-y-auto bg-[#1A1A1A] text-white p-4 space-y-6 pb-28">
      <ToastUI />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/Bookings")}
            className="flex items-center gap-1 text-sm bg-white/10 px-2 py-1 rounded relative"
          >
            <FaClipboardList />
            Bookings
            {pendingBookingsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">
                {pendingBookingsCount}
              </span>
            )}
          </button>
        </div>
        <h1 className="text-xl font-semibold">Workstation</h1>
        <FaBell />
      </div>

      {/* CATEGORY */}
      <div className="bg-white/5 p-3 rounded-xl">
        <p className="text-sm text-gray-400">Your Category</p>
        <p className="text-green-400 font-semibold">{workerCategory || "General Worker"}</p>
      </div>

      {/* LIVE SYSTEM */}
      <div className="bg-white/5 p-4 rounded-xl">
        <p className="text-sm mb-2 text-gray-400">Go Live (clients can see you)</p>
        {isLive && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 mb-3 text-xs text-green-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            GPS is active — your location is being shared with clients
          </div>
        )}
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          disabled={isLive}
          className="w-full p-2 mb-3 bg-black/30 rounded text-white"
        >
          <option value="">Auto (Use Category: {workerCategory || "General"})</option>
          <option value="Sale's Representative">Sale's Representative</option>
          <option value="Office help">Office help</option>
          <option value="House keeping">House keeping</option>
          <option value="Cook">Cook</option>
          <option value="Receptionist">Receptionist</option>
          <option value="Security">Security</option>
          <option value="Drivers">Drivers</option>
          <option value="Cashier">Cashier</option>
          <option value="Personal Assistant">Personal Assistant</option>
          <option value="Body Massage">Body Massage</option>
        </select>
        <div className="flex items-center justify-between">
          <span className={isLive ? "text-green-400 font-semibold" : "text-gray-400"}>
            {isLive ? "🟢 You are Live" : "⚫ Offline"}
          </span>
          <button onClick={toggleLive} disabled={liveLoading}>
            {liveLoading ? (
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            ) : isLive ? (
              <FaToggleOn size={32} className="text-green-400" />
            ) : (
              <FaToggleOff size={32} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* PRODUCT ORDERS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            Product Orders
            {pendingOrdersCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                {pendingOrdersCount} new
              </span>
            )}
          </h2>
          <span className="text-xs text-gray-500">{productOrders.length} total</span>
        </div>

        {productOrders.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-gray-500 text-sm">No product orders yet</p>
            <p className="text-xs text-gray-600 mt-1">Orders appear here in real-time</p>
          </div>
        ) : (
          productOrders.map((o) => (
            <div
              key={o.id}
              className={`py-3 border-b border-white/10 transition-all duration-500 ${
                newOrderIds.has(o.id) ? "bg-green-500/5 border-l-2 border-l-green-500 pl-2 rounded-r-lg" : ""
              }`}
            >
              {newOrderIds.has(o.id) && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-400 font-semibold">New Order!</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                    {o.product_image_url ? (
                      <img src={o.product_image_url} className="w-full h-full object-cover" alt={o.product_name} />
                    ) : <span>📦</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{o.product_name}</p>
                    <button
                      onClick={() => navigate(`/inbox?user=${o.user_id}`)}
                      className="text-xs text-green-400 hover:underline text-left"
                    >
                      👤 {o.buyer_name}
                    </button>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
                    {o.quantity && <p className="text-xs text-gray-400">Qty: {o.quantity}</p>}
                    {o.total_amount && (
                      <p className="text-xs text-green-400 font-semibold">
                        ₦{Number(o.total_amount).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${ORDER_STATUS_COLOR[o.status] || ORDER_STATUS_COLOR.pending}`}>
                  {o.status || "pending"}
                </span>
              </div>

              <div className="mb-2">
                <p className="text-[10px] text-gray-500 mb-1.5">Update Status:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ORDER_STATUS_STEPS.map(s => (
                    <button
                      key={s}
                      onClick={() => updateOrderStatus(o.id, s)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                        o.status === s
                          ? "bg-green-600 text-white font-semibold"
                          : "bg-white/10 hover:bg-white/20 text-gray-300"
                      }`}
                    >
                      {s === "shipping" ? "📦 " : s === "on the way" ? "🚚 " : s === "arriving" ? "📍 " : "✅ "}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate(`/inbox?user=${o.user_id}`)}
                className="w-full mt-1 bg-white/10 hover:bg-white/20 py-1.5 rounded-lg text-xs transition"
              >
                💬 Message Customer
              </button>
            </div>
          ))
        )}
      </div>

      {/* MY PRODUCTS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">My Products</h2>
          <button onClick={() => setShowUpload(!showUpload)}>
            <FaPlus className="text-green-400" />
          </button>
        </div>

        {showUpload && (
          <div className="space-y-2 mb-4 bg-black/20 p-3 rounded-xl">
            <input
              placeholder="Title *"
              value={form.title}
              className="w-full p-2 bg-black/30 rounded text-white placeholder-gray-500 outline-none"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              placeholder="Price ₦ (optional)"
              type="number"
              value={form.price}
              className="w-full p-2 bg-black/30 rounded text-white placeholder-gray-500 outline-none"
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              rows={2}
              className="w-full p-2 bg-black/30 rounded text-white placeholder-gray-500 outline-none"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div>
              <label className="text-xs text-gray-400 block mb-1">Product Image (optional)</label>
              <label className="flex items-center gap-2 cursor-pointer bg-black/30 p-2 rounded border border-white/10 hover:border-green-500/50 transition">
                <span className="text-green-400 text-sm">📷</span>
                <span className="text-sm text-gray-300 truncate">
                  {form.file ? form.file.name : "Tap to choose image"}
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
              </label>
              {form.file && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={URL.createObjectURL(form.file)} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
                  <button onClick={() => setForm({ ...form, file: null })} className="text-red-400 text-xs">Remove</button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">Category: {resolveCategory(service)}</p>
            <div className="flex gap-2">
              <button onClick={uploadProduct} disabled={uploading || !form.title}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm font-semibold transition">
                {uploading ? "Uploading..." : "Upload Product"}
              </button>
              <button onClick={() => { setShowUpload(false); setForm({ title: "", description: "", price: "", file: null }); }}
                className="px-3 py-2 bg-white/10 rounded text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <p className="text-gray-500 text-sm">No products yet.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex justify-between items-center py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                  {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <span>📦</span>}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-400">
                    {p.category} {p.price ? `• ₦${Number(p.price).toLocaleString()}` : "• Price on request"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <FaEye size={10} className="text-blue-400" />
                    <span className="text-xs text-blue-400">
                      {productViews[p.id] || 0} view{(productViews[p.id] || 0) !== 1 ? "s" : ""}
                    </span>
                    {Date.now() - new Date(p.created_at).getTime() < 48 * 60 * 60 * 1000 && (
                      <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full ml-1">48h</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteProduct(p)} className="text-red-400 hover:text-red-300 ml-2">
                <FaTrash size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* HIRE REQUESTS */}
      <div className="bg-white/5 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Hire Requests</h2>
          {pendingBookingsCount > 0 && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
              {pendingBookingsCount} pending
            </span>
          )}
        </div>
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No hire requests yet.</p>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="py-3 border-b border-white/10">
              <div className="flex justify-between items-start mb-2">
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
                  <button onClick={() => updateBookingStatus(b.id, "accepted")}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">
                    ✅ Accept
                  </button>
                  <button onClick={() => updateBookingStatus(b.id, "rejected")}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">
                    ❌ Reject
                  </button>
                </div>
              )}
              {b.status === "accepted" && (
                <button onClick={() => navigate(`/inbox?user=${b.client_id}`)}
                  className="w-full mt-2 bg-white/10 hover:bg-white/20 py-1.5 rounded-lg text-xs transition">
                  💬 Message Client
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}