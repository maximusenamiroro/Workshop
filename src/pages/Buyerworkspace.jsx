import { useState, useEffect } from "react";
import { FaClock, FaMapMarkerAlt, FaBell } from "react-icons/fa";

export default function BuyerWorkspace() {

  const [orders, setOrders] = useState([
    {
      id: 1,
      name: "Cooking Gas Cylinder",
      status: "Shipping",
      progress: 40,
      eta: "2 days",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c"
    },
    {
      id: 2,
      name: "Running Shoes",
      status: "Delivered",
      progress: 100,
      eta: "Today",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
    }
  ]);

  const bookings = [
    { id: 1, name: "Electrician", time: "Tomorrow 10AM" },
    { id: 2, name: "Cleaner", time: "Today 4PM" }
  ];

  const hires = [
    { id: 1, name: "Maria - Cleaner", status: "Arriving in 5 mins" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) =>
          o.progress < 100
            ? { ...o, progress: o.progress + 3 }
            : o
        )
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-[#0f0f0f] text-white flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
        <h1 className="text-lg font-semibold">Workspace</h1>
        <FaBell />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-6 pb-24">

        {/* ORDERS */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl">
          <h2 className="mb-4">Product Orders</h2>

          {orders.map((o) => (
            <div key={o.id} className="flex gap-4 mb-4 items-center">
              
              <img
                src={o.image}
                className="w-14 h-14 rounded-xl object-cover"
              />

              <div className="flex-1">
                <div className="flex justify-between">
                  <h3>{o.name}</h3>
                  <span className="text-xs text-white/60">{o.eta}</span>
                </div>

                <p className="text-xs text-[#007AFF]">{o.status}</p>

                <div className="w-full h-2 bg-white/10 rounded-full mt-1">
                  <div
                    className="h-full bg-[#007AFF] rounded-full transition-all"
                    style={{ width: `${o.progress}%` }}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-white/5 p-4 rounded-2xl">
            <div className="flex gap-2 mb-3">
              <FaClock className="text-[#007AFF]" />
              <h3>Bookings</h3>
            </div>

            {bookings.map((b) => (
              <div key={b.id} className="flex justify-between py-2 border-b border-white/10">
                <span>{b.name}</span>
                <span className="text-sm text-white/60">{b.time}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/5 p-4 rounded-2xl">
            <div className="flex gap-2 mb-3">
              <FaMapMarkerAlt className="text-[#007AFF]" />
              <h3>Live Service</h3>
            </div>

            <div className="bg-black/40 h-32 rounded-xl flex items-center justify-center text-white/50">
              Map Preview
            </div>

            <button className="mt-3 w-full bg-[#007AFF] py-2 rounded-xl">
              View Map
            </button>
          </div>

        </div>

        {/* HIRES */}
        <div className="bg-white/5 p-4 rounded-2xl">
          <h3 className="mb-3">Active Hires</h3>

          {hires.map((h) => (
            <div key={h.id} className="flex justify-between">
              <span>{h.name}</span>
              <span className="bg-[#007AFF] px-3 py-1 rounded-full text-xs">
                {h.status}
              </span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}