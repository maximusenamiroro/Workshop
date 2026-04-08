import { useState, useEffect } from "react";
import { FaClock, FaBell, FaSearch, FaClipboardList, FaToggleOn, FaToggleOff, FaTrash } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SERVICES = [
  "Cleaning", "Driving", "Plumbing", "Electrical", "Carpentry",
  "Security", "Delivery", "Tailoring", "Painting", "Welding"
];

export default function SellerWorkstation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveProducts, setLiveProducts] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [service, setService] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    file: null
  });

  useEffect(() => {
    if (!user) return;
    fetchAll();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [user]);

  const fetchAll = async () => {
    await fetchProducts();
    await fetchLiveStatus();
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, category, price, image_url, created_at")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Fetch products error:", error.message);
    setProducts(data || []);
  };

  // ================= LIVE STATUS =================
  const fetchLiveStatus = async () => {
    const { data } = await supabase
      .from("live_workers")
      .select("id, service, product_id")
      .eq("worker_id", user.id);

    if (data && data.length > 0) {
      setIsLive(true);
      setLiveProducts(data);
      setService(data[0].service || "");
    }
  };

  const toggleLive = async (product) => {
    if (!product.category && !service) {
      alert("Please fill a service/category before going live!");
      return;
    }

    setLiveLoading(true);
    try {
      if (isLive && liveProducts.find(p => p.product_id === product.id)) {
        await supabase
          .from("live_workers")
          .delete()
          .eq("worker_id", user.id)
          .eq("product_id", product.id);
        setLiveProducts(liveProducts.filter(p => p.product_id !== product.id));
      } else {
        await supabase
          .from("live_workers")
          .upsert({
            worker_id: user.id,
            product_id: product.id,
            service: product.category || service,
            updated_at: new Date()
          });
        setLiveProducts([...liveProducts, { worker_id: user.id, product_id: product.id, service: product.category || service }]);
      }
      setIsLive(true);
    } catch (err) {
      console.error("Live toggle error:", err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  const uploadProduct = async () => {
    if (!form.title || !form.price) {
      alert("Please fill title and price");
      return;
    }

    try {
      let imageUrl = null;

      if (form.file) {
        const fileExt = form.file.name.split(".").pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        await supabase.storage.from("products").upload(fileName, form.file);
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      await supabase.from("products").insert({
        worker_id: user.id,
        title: form.title,
        price: parseFloat(form.price),
        category: form.category,
        image_url: imageUrl
      });

      setForm({ title: "", price: "", category: "", file: null });
      fetchProducts();
    } catch (err) {
      console.error("Upload error:", err.message);
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

  const getCountdown = (createdAt) => {
    const expireAt = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
    const remaining = Math.max(0, expireAt - now);
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 space-y-6 pb-24">

      <h1 className="text-xl font-semibold">Seller Workstation</h1>

      {/* PRODUCTS LIST */}
      {products.map(product => (
        <div key={product.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
              {product.image_url ? <img src={product.image_url} alt={product.title} /> : "📦"}
            </div>
            <div>
              <p className="text-sm font-medium">{product.title}</p>
              <p className="text-xs text-gray-400">{product.category || "No category"}</p>
              <p className="text-xs text-green-400">₦{Number(product.price).toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-mono">{getCountdown(product.created_at)}</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => toggleLive(product)}
              disabled={liveLoading || (!product.category && !service)}
              className={`px-2 py-1 rounded-full text-xs ${liveProducts.find(p => p.product_id === product.id) ? "bg-green-600" : "bg-gray-600"}`}
            >
              {liveProducts.find(p => p.product_id === product.id) ? "Live" : "Go Live"}
            </button>

            <button onClick={() => deleteProduct(product)} className="text-red-400">
              <FaTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
