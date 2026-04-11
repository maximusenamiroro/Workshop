import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { label: "All", emoji: "🛍️" },
  { label: "Fashion", emoji: "👗" },
  { label: "Shoes", emoji: "👟" },
  { label: "Watches", emoji: "⌚" },
  { label: "Electronics", emoji: "📱" },
  { label: "Home Appliances", emoji: "🏠" },
  { label: "Food & Drinks", emoji: "🍔" },
  { label: "Beauty", emoji: "💄" },
  { label: "Tools", emoji: "🛠️" },
  { label: "Furniture", emoji: "🛋️" },
  { label: "Sports", emoji: "⚽" },
  { label: "Books", emoji: "📚" },
  { label: "Toys", emoji: "🧸" },
  { label: "Health", emoji: "💊" },
  { label: "Others", emoji: "📦" },
];

export default function ProductCatalogue() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch products without profiles join — join separately
      let query = supabase
        .from("products")
        .select("id, title, category, price, image_url, description, worker_id")
        .order("created_at", { ascending: false });

      if (activeCategory !== "All") {
        query = query.eq("category", activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      const productsData = data || [];

      // Fetch seller names separately
      const workerIds = [...new Set(productsData.map(p => p.worker_id).filter(Boolean))];

      let profileMap = {};
      if (workerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", workerIds);

        (profilesData || []).forEach(p => {
          profileMap[p.id] = p.full_name;
        });
      }

      // Merge seller name into products
      const merged = productsData.map(p => ({
        ...p,
        seller_name: profileMap[p.worker_id] || "Seller",
      }));

      setProducts(merged);
    } catch (err) {
      console.error("Fetch products error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pb-24">

      {/* HEADER */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold mb-4">Shop</h1>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-500 outline-none text-sm"
        />
      </div>

      {/* SCROLLING CATEGORIES */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`flex flex-col items-center min-w-[64px] py-2 px-3 rounded-2xl transition ${
              activeCategory === cat.label
                ? "bg-green-600 text-white"
                : "bg-white/5 text-gray-400"
            }`}
          >
            <span className="text-2xl">{cat.emoji}</span>
            <span className="text-xs mt-1 whitespace-nowrap">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* PRODUCTS GRID */}
      <div className="px-4 mt-2">
        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-gray-400">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/10 transition"
              >
                <div className="w-full h-40 bg-white/10 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">
                      {CATEGORIES.find(c => c.label === product.category)?.emoji || "📦"}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{product.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{product.seller_name}</p>
                  <p className="text-green-400 font-bold text-sm mt-2">
                    ₦{Number(product.price).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}