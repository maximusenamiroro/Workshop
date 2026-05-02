import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastUI } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Real-time order status updates
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order_status_${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrderStatus(payload.new.status);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [orderId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, category, price, image_url, description, worker_id, stock, profiles(full_name, avatar_url)")
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
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.title,
          product_image_url: product.image_url || null,
          price: product.price,
          quantity: quantity,
          total_amount: product.price ? product.price * quantity : null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      setOrderId(data.id);
      setOrderStatus("pending");
      setOrdered(true);
    } catch (err) {
      showToast("Failed to place order: " + err.message, "error");
    } finally {
      setOrdering(false);
    }
  };

  const STATUS_STEPS = ["pending", "shipping", "on the way", "arriving", "delivered"];

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": return "text-green-400";
      case "arriving": return "text-purple-400";
      case "on the way": case "shipping": return "text-blue-400";
      default: return "text-yellow-400";
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case "pending": return "⏳";
      case "shipping": return "📦";
      case "on the way": return "🚚";
      case "arriving": return "📍";
      case "delivered": return "✅";
      default: return "⏳";
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#0B0F19]">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="h-full flex items-center justify-center bg-[#0B0F19] text-white">
      <p className="text-gray-400">Product not found</p>
    </div>
  );

  // Order success screen with real-time tracking
  if (ordered) {
    const currentStep = STATUS_STEPS.indexOf(orderStatus || "pending");

    return (
      <div className="h-full bg-[#0B0F19] overflow-y-auto pb-28">
        <ToastUI />

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <button onClick={() => navigate("/workspace")} className="text-gray-400 hover:text-white p-2">←</button>
          <h1 className="text-white font-semibold">Order Placed</h1>
        </div>

        <div className="p-5 space-y-6">
          {/* Success banner */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
            <p className="text-5xl mb-3">{getStatusEmoji(orderStatus)}</p>
            <h2 className="text-xl font-bold text-white mb-1">Order Placed!</h2>
            <p className="text-gray-400 text-sm">The seller has been notified</p>
          </div>

          {/* Product summary */}
          <div className="bg-zinc-900 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{product.title}</p>
              <p className="text-xs text-gray-400">by {product.profiles?.full_name}</p>
              <p className="text-green-400 font-bold mt-1">
                {product.price
                  ? `₦${Number(product.price * quantity).toLocaleString()}`
                  : "Price on request"
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Qty</p>
              <p className="text-white font-bold">{quantity}</p>
            </div>
          </div>

          {/* Real-time status tracker */}
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Order Status</h3>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-white/10 ${getStatusColor(orderStatus)}`}>
                {getStatusEmoji(orderStatus)} {orderStatus || "pending"}
              </span>
            </div>

            {/* Progress steps */}
            <div className="space-y-3">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      isCompleted ? "bg-green-500 text-white" :
                      isCurrent ? "bg-green-500/20 border-2 border-green-500 text-green-400" :
                      "bg-zinc-800 text-gray-600"
                    }`}>
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm capitalize font-medium ${
                        isCurrent ? "text-white" :
                        isCompleted ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {step}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-green-400 mt-0.5">Current status</p>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              🔴 Live — updates automatically when seller changes status
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/inbox?user=${product.worker_id}`)}
              className="flex-1 bg-white/10 hover:bg-white/15 py-3 rounded-2xl text-sm font-semibold transition active:scale-95"
            >
              💬 Message Seller
            </button>
            <button
              onClick={() => navigate("/workspace")}
              className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-2xl text-sm font-semibold transition active:scale-95"
            >
              View Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0B0F19] text-white pb-28">
      <ToastUI />

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="sticky top-4 left-4 z-30 bg-black/70 p-3 rounded-full ml-4 mt-4 inline-block"
      >←</button>

      {/* Image */}
      <div className="w-full h-[260px] sm:h-[300px] bg-zinc-900 overflow-hidden -mt-12">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-40">📦</div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold leading-tight">{product.title}</h1>
            <p className="text-gray-400 mt-1 text-sm">by {product.profiles?.full_name || "Seller"}</p>
          </div>
          <p className="text-green-400 font-bold text-2xl whitespace-nowrap">
            {product.price ? `₦${Number(product.price).toLocaleString()}` : "Price on request"}
          </p>
        </div>

        <span className="inline-block bg-white/10 px-4 py-1.5 rounded-full text-sm">
          {product.category}
        </span>

        {product.description && (
          <p className="text-gray-300 text-[15px] leading-relaxed">{product.description}</p>
        )}

        {/* Seller info */}
        <div
          className="flex items-center gap-3 bg-zinc-900 p-3 rounded-2xl cursor-pointer hover:bg-zinc-800 transition"
          onClick={() => navigate(`/seller-profile/${product.worker_id}`)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
            {product.profiles?.avatar_url ? (
              <img src={product.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-white">{product.profiles?.full_name?.[0] || "S"}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{product.profiles?.full_name || "Seller"}</p>
            <p className="text-xs text-green-400">View Profile →</p>
          </div>
        </div>

        {/* Quantity — only show if product has price */}
        {product.price && (
          <div>
            <p className="text-gray-400 text-sm mb-2">Quantity</p>
            <div className="flex items-center gap-6 bg-zinc-900 w-fit px-6 py-3 rounded-2xl">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="text-3xl w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg active:scale-90 transition"
              >−</button>
              <span className="text-2xl font-semibold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="text-3xl w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg active:scale-90 transition"
              >+</button>
            </div>
          </div>
        )}

        {/* Total */}
        {product.price && (
          <div className="flex justify-between items-center bg-zinc-900/70 px-5 py-4 rounded-2xl">
            <span className="text-gray-400">Total</span>
            <span className="text-green-400 font-bold text-2xl">
              ₦{Number(product.price * quantity).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Order button — mobile */}
      <div className="fixed bottom-[68px] left-0 right-0 bg-[#0B0F19]/95 backdrop-blur border-t border-white/10 px-4 py-3 z-40 md:hidden">
        <button
          onClick={handleOrder}
          disabled={ordering}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all"
        >
          {ordering ? "Placing Order..." : product.price
            ? `Place Order • ₦${Number(product.price * quantity).toLocaleString()}`
            : "Place Order"
          }
        </button>
      </div>

      {/* Order button — desktop */}
      <div className="hidden md:block max-w-3xl mx-auto px-8 pb-12">
        <button
          onClick={handleOrder}
          disabled={ordering}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-4 rounded-2xl font-bold text-lg transition-all"
        >
          {ordering ? "Placing Order..." : product.price
            ? `Place Order • ₦${Number(product.price * quantity).toLocaleString()}`
            : "Place Order"
          }
        </button>
      </div>
    </div>
  );
}