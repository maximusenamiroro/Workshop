import { useState, useEffect } from "react";
import { FaClock, FaMapMarkerAlt, FaBell } from "react-icons/fa";

export default function BuyerWorkspace() {

  // ================= PRODUCT ORDERS (READY FOR SUPABASE) =================
  const [orders, setOrders] = useState([
    {
      id: 1,
      name: "Luxury Watch",
      category: "watch",
      status: "Shipping",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    },
    {
      id: 2,
      name: "Designer Clothes",
      category: "clothes",
      status: "On the way",
      image: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47",
    },
    {
      id: 3,
      name: "Sneakers",
      category: "shoes",
      status: "Arriving",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    },
    {
      id: 4,
      name: "Food Delivery",
      category: "food",
      status: "Delivered",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    },
  ]);

  // 🔥 REAL-TIME SIMULATION (replace with Supabase later)
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.status === "Shipping") return { ...o, status: "On the way" };
          if (o.status === "On the way") return { ...o, status: "Arriving" };
          return o;
        })
      );
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // ================= BOOKINGS =================
  const bookings = [
    { id: 1, name: "Plumber", time: "Tomorrow 10AM" },
    { id: 2, name: "Gardener", time: "Today 3PM" },
  ];

  // ================= UI =================
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
        <h1 className="text-xl font-semibold">Workspace</h1>
        <FaBell />
      </div>

      {/* CONTENT */}
      <div className="px-4 md:px-8 py-4 space-y-6">

        {/* ================= PRODUCT ORDERS (TOP) ================= */}
        <div className="glass-card p-4 md:p-6">
          <h2 className="mb-4 text-sm md:text-base font-semibold">
            Product Orders
          </h2>

          <div className="flex gap-4 overflow-x-auto scrollbar-hide">

            {orders.map((order) => (
              <div
                key={order.id}
                className="min-w-[110px] flex flex-col items-center"
              >
                <img
                  src={order.image}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-[#007AFF]"
                />

                <p className="text-xs mt-2 text-center">
                  {order.name}
                </p>

                <p className="text-xs text-[#007AFF]">
                  {order.status}
                </p>
              </div>
            ))}

          </div>
        </div>

        {/* ================= BOOKINGS ================= */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex gap-2 mb-4 items-center">
            <FaClock className="text-[#007AFF]" />
            <h3>Handskill Bookings</h3>
          </div>

          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex justify-between py-2 border-b border-white/10"
            >
              <span>{b.name}</span>
              <span className="text-white/60 text-sm">{b.time}</span>
            </div>
          ))}
        </div>

        {/* ================= LIVE SERVICE ================= */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex gap-2 mb-4 items-center">
            <FaMapMarkerAlt className="text-[#007AFF]" />
            <h3>Live Service</h3>
          </div>

          <div className="bg-black/40 rounded-xl h-32 flex items-center justify-center text-white/50">
            Map Preview
          </div>

          <button className="mt-4 w-full bg-[#007AFF] py-2 rounded-xl">
            View Map
          </button>
        </div>

      </div>
    </div>
  );
}