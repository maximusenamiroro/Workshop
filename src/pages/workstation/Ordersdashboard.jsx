import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view your orders");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)                    // Show only this client's orders
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Refresh the list after update
      loadOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-white bg-[#0B0F19] min-h-screen flex items-center justify-center">
        Loading orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-white bg-[#0B0F19] min-h-screen">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 text-white bg-[#0B0F19] min-h-screen">
      <h1 className="text-xl font-semibold mb-6">Product Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-400">No orders yet</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-[#121826] p-5 rounded-xl mb-4"
          >
            <h3 className="font-semibold text-lg">{order.product_name}</h3>

            <p className="text-green-400 text-xl mt-1">
              ₦{Number(order.price).toLocaleString()}
            </p>

            <p className="text-gray-400 mt-2">
              Quantity: {order.quantity} • Total: ₦{Number(order.total_amount || order.price * order.quantity).toLocaleString()}
            </p>

            <p className="mt-3">
              Status:{" "}
              <span className={`capitalize font-medium ${
                order.status === "Delivered" ? "text-green-400" :
                order.status === "Ready" ? "text-yellow-400" : "text-blue-400"
              }`}>
                {order.status || "Processing"}
              </span>
            </p>

            <div className="flex gap-2 mt-5 flex-wrap">
              <button
                onClick={() => updateStatus(order.id, "Processing")}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm"
              >
                Processing
              </button>

              <button
                onClick={() => updateStatus(order.id, "Ready")}
                className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-sm"
              >
                Ready
              </button>

              <button
                onClick={() => updateStatus(order.id, "Delivered")}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-sm"
              >
                Delivered
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}