import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";   // ← Adjust path if needed

export default function ProductOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("workspaceUser"));

      if (!user?.id) {
        setError("Please log in to view your orders");
        setOrders([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)                    // Show only this user's orders
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="bg-[#121826] p-4 rounded-lg text-white">
      <h3 className="font-semibold mb-4 text-lg">Product Orders</h3>

      {loading ? (
        <p className="text-gray-400 py-8 text-center">Loading orders...</p>
      ) : error ? (
        <p className="text-red-400 py-4">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400 py-8 text-center">No orders found</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-[#1a2332] p-4 rounded-xl border border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-base">{order.product_name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Qty: {order.quantity} • Total: ₦{Number(order.total_amount || order.price * order.quantity).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    order.status === "Processing"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : order.status === "Completed"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}