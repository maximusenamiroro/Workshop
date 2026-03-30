import { useEffect, useState } from "react";

export default function ProductOrders() {

  const [orders, setOrders] = useState([]);

  useEffect(() => {

    const stored =
      JSON.parse(localStorage.getItem("workspaceOrders")) || [];

    setOrders(stored);

  }, []);

  return (
    <div className="bg-[#121826] p-4 rounded-lg text-white">

      <h3 className="font-semibold mb-3">
        Product Orders
      </h3>

      {orders.map(order => (

        <div
          key={order.id}
          className="mb-3"
        >

          <p className="font-semibold">
            {order.productName}
          </p>

          <p className="text-gray-400">
            {order.status}
          </p>

          <p className="text-green-400">
            ₦{order.price}
          </p>

        </div>

      ))}

    </div>
  );
}
