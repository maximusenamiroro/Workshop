import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, category, price, image_url, description, worker_id, stock, profiles(full_name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (err) {
      console.error("Fetch product error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!user) return navigate("/login");
    setOrdering(true);

    try {
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        product_id: product.id,
        product_name: product.title,
        product_image_url: product.image_url || null,
        price: product.price,
        quantity: quantity,
        total_amount: product.price * quantity,
        status: "shipping",
      });

      if (error) throw error;
      setOrdered(true);
    } catch (err) {
      console.error("Order error:", err.message);
      alert("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B0F19]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B0F19] text-white">
        <p className="text-gray-400">Product not found</p>
      </div>
    );
  }

  if (ordered) {
    return (
      <div className="h-full bg-[#0B0F19] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-7xl mb-6">✅</p>
        <h2 className="text-3xl font-bold mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-400 mb-8">Your order is being processed</p>
        <button
          onClick={() => navigate("/workspace")}
          className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-2xl font-semibold w-full max-w-xs"
        >
          Track in Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0B0F19] text-white pb-28">   {/* ← Key fix here */}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="sticky top-6 left-4 z-30 bg-black/70 hover:bg-black/90 p-3 rounded-full transition-all ml-4 mt-4"
      >
        ←
      </button>

      {/* Product Image */}
      <div className="w-full h-[260px] sm:h-[300px] md:h-[380px] bg-zinc-900 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-40">
            📦
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              {product.title}
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              by {product.profiles?.full_name || "Seller"}
            </p>
          </div>
          <p className="text-green-400 font-bold text-2xl md:text-3xl">
            ₦{Number(product.price).toLocaleString()}
          </p>
        </div>

        <p className="inline-block bg-white/10 px-4 py-1.5 rounded-full text-sm">
          {product.category}
        </p>

        {product.description && (
          <p className="text-gray-300 text-[15px] leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Quantity */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Quantity</p>
          <div className="flex items-center gap-6 bg-zinc-900 w-fit px-6 py-3 rounded-2xl">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="text-3xl w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg active:scale-90 transition"
            >
              −
            </button>
            <span className="text-2xl font-semibold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="text-3xl w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg active:scale-90 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-zinc-900/70 px-5 py-4 rounded-2xl">
          <span className="text-gray-400">Total Amount</span>
          <span className="text-green-400 font-bold text-2xl">
            ₦{Number(product.price * quantity).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Mobile Order Button - Above Bottom Nav */}
      <div className="fixed bottom-[68px] left-0 right-0 bg-[#0B0F19] border-t border-white/10 px-4 py-3 z-40 md:hidden">
        <button
          onClick={handleOrder}
          disabled={ordering}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-[17px] rounded-2xl font-bold text-lg active:scale-[0.98] transition-all"
        >
          {ordering ? "Placing Order..." : `Order Now • ₦${Number(product.price * quantity).toLocaleString()}`}
        </button>
      </div>

      {/* Desktop Order Button */}
      <div className="hidden md:block max-w-3xl mx-auto px-8 pb-12">
        <button
          onClick={handleOrder}
          disabled={ordering}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-4 rounded-2xl font-bold text-lg transition-all"
        >
          {ordering ? "Placing Order..." : `Order Now • ₦${Number(product.price * quantity).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}