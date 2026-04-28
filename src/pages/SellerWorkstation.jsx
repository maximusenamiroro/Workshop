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

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function SellerWorkstation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const geoWatchRef = useRef(null);
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

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    file: null,
  });

  useEffect(() => {
    return () => {
      if (geoWatchRef.current) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAll();

    const bookingsChannel = supabase
      .channel(`workstation_bookings_${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "hire_requests",
        filter: `worker_id=eq.${user.id}`,
      }, fetchBookings)
      .subscribe();

    const ordersChannel = supabase
      .channel(`workstation_orders_${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public",
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

  const fetchWorkerCategory = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      const { data } = await supabase
        .from("workers")
        .select("category, category_group")
        .eq("id", currentUser.id)
        .maybeSingle();
      setWorkerCategory(data?.category || null);
    } catch (err) {
      console.error("fetchWorkerCategory failed:", err.message);
    }
  };

  const fetchLiveStatus = async () => {
    try {
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
    } catch (err) {
      console.error("fetchLiveStatus failed:", err.message);
    }
  };

  const resolveCategory = (fallbackService = "") => {
    return (
      workerCategory?.trim() ||
      fallbackService?.trim() ||
      service?.trim() ||
      "General Worker"
    );
  };

  const toggleLive = async () => {
    setLiveLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");
      const finalService = resolveCategory(service);

      if (isLive) {
        if (geoWatchRef.current) {
          navigator.geolocation.clearWatch(geoWatchRef.current);
          geoWatchRef.current = null;
        }
        const { error } = await supabase
          .from("live_workers")
          .delete()
          .eq("worker_id", currentUser.id);
        if (error) throw error;
        setIsLive(false);
        setLiveLoading(false);
      } else {
        if (!navigator.geolocation) {
          showToast("Geolocation is not supported by your browser", "error");
          setLiveLoading(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { error } = await supabase
                .from("live_workers")
                .upsert({
                  worker_id: currentUser.id,
                  service: finalService,
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  last_seen: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              if (error) throw error;
              setIsLive(true);
              setService(finalService);

              geoWatchRef.current = navigator.geolocation.watchPosition(
                async (position) => {
                  try {
                    await supabase
                      .from("live_workers")
                      .update({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        last_seen: new Date().toISOString(),
                      })
                      .eq("worker_id", currentUser.id);
                  } catch (err) {
                    console.error("GPS update error:", err.message);
                  }
                },
                (err) => console.error("GPS watch error:", err),
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
              );
            } catch (err) {
              showToast("Failed to go live: " + err.message, "error");
            } finally {
              setLiveLoading(false);
            }
          },
          (err) => {
            console.error("GPS error:", err);
            showToast("Please allow location access to go live.", "warning");
            setLiveLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
        return;
      }
    } catch (err) {
      showToast("Failed: " + err.message, "error");
      setLiveLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      const { data } = await supabase
        .from("products")
        .select("id, title, category, price, image_url, created_at")
        .eq("worker_id", currentUser.id)
        .order("created_at", { ascending: false });
      setProducts(data || []);
      if (data && data.length > 0) {
        await fetchProductViews(data.map(p => p.id));
      }
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
      (data || []).forEach(v => {
        viewCounts[v.product_id] = (viewCounts[v.product_id] || 0) + 1;
      });
      setProductViews(viewCounts);
    } catch (err) {
      console.error("fetchProductViews failed:", err.message);
    }
  };

  const fetchProductOrders = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: workerProducts } = await supabase
        .from("products")
        .select("id")
        .eq("worker_id", currentUser.id);

      if (!workerProducts || workerProducts.length === 0) {
        setProductOrders([]);
        return;
      }

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
          .from("profiles")
          .select("id, full_name")
          .in("id", buyerIds);
        (buyersData || []).forEach(b => { buyerMap[b.id] = b.full_name; });
      }

      setProductOrders((ordersData || []).map(o => ({
        ...o,
        buyer_name: buyerMap[o.user_id] || "Customer",
      })));
    } catch (err) {
      console.error("fetchProductOrders failed:", err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    if (error) showToast("Failed to update: " + error.message, "error");
    else fetchProductOrders();
  };

  const uploadProduct = async () => {
    if (!form.title || !form.price) {
      showToast("Title and price required", "warning");
      return;
    }
    setUploading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      let imageUrl = null;
      if (form.file) {
        if (!form.file.type.startsWith("image/")) {
          throw new Error("Please select an image file");
        }
        const sizeMB = form.file.size / (1024 * 1024);
        if (sizeMB > 10) {
          throw new Error(`Image is ${sizeMB.toFixed(1)}MB — please use an image under 10MB`);
        }

        const ext = form.file.name.split(".").pop().toLowerCase();
        const fileName = `${currentUser.id}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, form.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: form.file.type,
          });

        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const finalCategory = resolveCategory(service);
      const { error } = await supabase.from("products").insert({
        worker_id: currentUser.id,
        title: form.title,
        description: form.description || "",
        price: parseFloat(form.price),
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
      fetchProducts();
      showToast("Product deleted");
    } catch (err) {
      showToast("Failed to delete product", "error");
    }
  };

  const fetchBookings = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      const { data } = await supabase
        .from("hire_requests")
        .select("id, status, created_at, job_description, location, client_id")
        .eq("worker_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setBookings(data || []);
    } catch (err) {
      console.error("fetchBookings failed:", err.message);
    }
  };

  const updateBookingStatus = async (id, status) => {
    const { error } = await supabase
      .from("hire_requests")
      .update({ status })
      .eq("id", id);
    if (error) showToast("Failed to update: " + error.message, "error");
    else {
      showToast(`Booking ${status}`);
      fetchBookings();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 space-y-6 pb-24">
      <ToastUI />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/Bookings")}
            className="flex items-center gap-1 text-sm bg-white/10 px-2 py-1 rounded"
          >
            <FaClipboardList />
            Bookings
          </button>
          <FaSearch className="text-gray-300 cursor-pointer" />
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
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 mb-3 text-xs text-green-400">
            📡 GPS is active — your location is being shared with clients
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
        <h2 className="font-semibold mb-3">Product Orders</h2>
        {productOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No product orders yet.</p>
        ) : (
          productOrders.map((o) => (
            <div key={o.id} className="py-3 border-b border-white/10">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                    {o.product_image_url ? (
                      <img src={o.product_image_url} className="w-full h-full object-cover" alt={o.product_name} />
                    ) : <span>📦</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{o.product_name}</p>
                    <button
                      onClick={() => navigate(`/seller-profile/${o.user_id}`)}
                      className="text-xs text-green-400 hover:underline text-left"
                    >
                      👤 {o.buyer_name}
                    </button>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
                    {o.total_amount && (
                      <p className="text-xs text-green-400">₦{Number(o.total_amount).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${ORDER_STATUS_COLOR[o.status] || ORDER_STATUS_COLOR.pending}`}>
                  {o.status || "pending"}
                </span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["shipping", "on the way", "arriving", "delivered"].map(s => (
                  <button
                    key={s}
                    onClick={() => updateOrderStatus(o.id, s)}
                    className={`text-xs px-2 py-1 rounded-lg transition ${
                      o.status === s ? "bg-green-600 text-white" : "bg-white/10 hover:bg-white/20 text-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate(`/inbox?user=${o.user_id}`)}
                className="w-full mt-2 bg-white/10 hover:bg-white/20 py-1.5 rounded-lg text-xs transition"
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
              placeholder="Price (₦) *"
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
              <label className="text-xs text-gray-400 block mb-1">Product Image</label>
              <input
                type="file"
                accept="image/*"
                className="text-gray-400 text-sm"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
              />
            </div>
            <p className="text-xs text-gray-500">Category: {resolveCategory(service)}</p>
            <div className="flex gap-2">
              <button
                onClick={uploadProduct}
                disabled={uploading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm font-semibold transition"
              >
                {uploading ? "Uploading..." : "Upload Product"}
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="px-3 py-2 bg-white/10 rounded text-sm"
              >
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
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  ) : <span>📦</span>}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.category} • ₦{Number(p.price).toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <FaEye size={10} className="text-blue-400" />
                    <span className="text-xs text-blue-400">
                      {productViews[p.id] || 0} view{(productViews[p.id] || 0) !== 1 ? "s" : ""}
                    </span>
                    {Date.now() - new Date(p.created_at).getTime() < 48 * 60 * 60 * 1000 && (
                      <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full ml-1">
                        48h status
                      </span>
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
        <h2 className="font-semibold mb-3">Hire Requests</h2>
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
                  <button
                    onClick={() => updateBookingStatus(b.id, "accepted")}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => updateBookingStatus(b.id, "rejected")}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
              {b.status === "accepted" && (
                <button
                  onClick={() => navigate(`/inbox?user=${b.client_id}`)}
                  className="w-full mt-2 bg-white/10 hover:bg-white/20 py-1.5 rounded-lg text-xs transition"
                >
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