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
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
        <p className="text-gray-400">Product not found</p>
      </div>
    );
  }

  if (ordered) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white gap-4">
        <p className="text-6xl">✅</p>
        <h2 className="text-2xl font-bold">Order Placed!</h2>
        <p className="text-gray-400 text-sm">Your order is being processed</p>
        <button
          onClick={() => navigate("/workspace")}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold transition"
        >
          Track in Workspace
        </button>
        <button
          onClick={() => navigate("/shop")}
          className="text-gray-400 text-sm underline"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pb-32">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded-full"
      >
        ←
      </button>

      {/* Product Image */}
      <div className="w-full h-72 bg-white/10 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-8xl">📦</span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <p className="text-gray-400 text-sm mt-1">
              by {product.profiles?.full_name || "Seller"}
            </p>
          </div>
          <p className="text-green-400 font-bold text-xl">
            ₦{Number(product.price).toLocaleString()}
          </p>
        </div>

        <p className="text-xs bg-white/10 px-3 py-1 rounded-full w-fit">
          {product.category}
        </p>

        {product.description && (
          <p className="text-gray-300 text-sm leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400">Quantity:</p>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="text-white font-bold text-lg w-6"
            >
              −
            </button>
            <span className="font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="text-white font-bold text-lg w-6"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">Total:</p>
          <p className="text-green-400 font-bold text-lg">
            ₦{Number(product.price * quantity).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0B0F19] border-t border-white/10">
        <button
          onClick={handleOrder}
          disabled={ordering}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-4 rounded-2xl font-bold text-lg transition"
        >
          {ordering ? "Placing Order..." : `Order Now • ₦${Number(product.price * quantity).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}