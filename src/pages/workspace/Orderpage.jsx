import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OrderPage() {

  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state;

  const [quantity, setQuantity] = useState(1);

  const placeOrder = () => {

    const order = {
      id: Date.now(),
      productName: product.name,
      price: product.price,
      quantity,
      status: "Processing"
    };

    const existing =
      JSON.parse(localStorage.getItem("workspaceOrders")) || [];

    existing.push(order);

    localStorage.setItem(
      "workspaceOrders",
      JSON.stringify(existing)
    );

    alert("Order placed successfully");

    navigate("/workspace");
  };

  return (
    <div className="p-4 bg-[#0B0F19] min-h-screen text-white">

      <h1 className="text-xl mb-4">
        Order Product
      </h1>

      <div className="bg-[#121826] p-4 rounded-lg">

        <h2 className="font-semibold">
          {product.name}
        </h2>

        <p className="text-green-400">
          ₦{product.price}
        </p>

        <input
          type="number"
          className="w-full mt-3 p-2 rounded bg-gray-800"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value)
          }
        />

        <button
          onClick={placeOrder}
          className="w-full mt-4 bg-green-500 p-3 rounded"
        >
          Place Order
        </button>

      </div>

    </div>
  );
}
