import { useEffect, useState } from "react";

export default function Orders() {

  const [orders, setOrders] = useState([]);

  useEffect(() => {

    const stored =
      JSON.parse(localStorage.getItem("workspaceOrders")) || [];

    setOrders(stored);

  }, []);

  const updateStatus = (id, status) => {

    const updated = orders.map(order =>
      order.id === id
        ? { ...order, status }
        : order
    );

    setOrders(updated);

    localStorage.setItem(
      "workspaceOrders",
      JSON.stringify(updated)
    );
  };

  return (
    <div className="p-4 text-white bg-[#0B0F19] min-h-screen">

      <h1 className="text-xl font-semibold mb-4">
        Product Orders
      </h1>

      {orders.map(order => (

        <div
          key={order.id}
          className="bg-[#121826] p-4 rounded-lg mb-3"
        >

          <h3 className="font-semibold">
            {order.productName}
          </h3>

          <p className="text-gray-400">
            {order.price}
          </p>

          <p className="text-green-400">
            {order.status || "Processing"}
          </p>

          <div className="flex gap-2 mt-2">

            <button
              onClick={() =>
                updateStatus(order.id, "Processing")
              }
              className="bg-blue-500 px-3 py-1 rounded"
            >
              Processing
            </button>

            <button
              onClick={() =>
                updateStatus(order.id, "Ready")
              }
              className="bg-yellow-500 px-3 py-1 rounded"
            >
              Ready
            </button>

            <button
              onClick={() =>
                updateStatus(order.id, "Delivered")
              }
              className="bg-green-500 px-3 py-1 rounded"
            >
              Delivered
            </button>

          </div>

        </div>

      ))}

    </div>
  );
}
