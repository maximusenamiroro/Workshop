import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function OrderPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Safety check if product is missing (e.g. page refreshed)
  if (!product) {
    return (
      <div className="p-4 bg-[#0B0F19] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Product information not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-green-400 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const placeOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("workspaceUser"));

      if (!user?.id) {
        alert("Please log in to place an order");
        navigate("/login");
        return;
      }

      const orderData = {
        user_id: user.id,
        product_id: product.id || null,
        product_name: product.name,
        price: Number(product.price),
        quantity: Number(quantity),
        total_amount: Number(product.price) * Number(quantity),
        status: "Processing",
      };

      const { error: supabaseError } = await supabase
        .from("orders")
        .insert([orderData]);

      if (supabaseError) throw supabaseError;

      alert("✅ Order placed successfully!");
      navigate("/workspace");

    } catch (err) {
      console.error("Order error:", err);
      setError("Failed to place order. Please try again.");
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#0B0F19] min-h-screen text-white">
      <h1 className="text-xl font-bold mb-6">Order Product</h1>

      <div className="bg-[#121826] p-6 rounded-xl">
        <h2 className="font-semibold text-lg mb-1">{product.name}</h2>
        <p className="text-green-400 text-2xl font-medium">
          ₦{Number(product.price).toLocaleString()}
        </p>

        <div className="mt-6">
          <label className="block text-sm text-gray-400 mb-2">Quantity</label>
          <input
            type="number"
            min="1"
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-green-500 outline-none"
            value={quantity}
            onChange={(e) => 
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
          />
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">Total Amount</p>
          <p className="text-3xl font-bold text-white">
            ₦{(Number(product.price) * Number(quantity)).toLocaleString()}
          </p>
        </div>

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

        <button
          onClick={placeOrder}
          disabled={loading}
          className="w-full mt-8 bg-green-500 hover:bg-green-600 disabled:bg-green-700 disabled:cursor-not-allowed p-4 rounded-xl font-semibold text-lg transition-all"
        >
          {loading ? "Processing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}