import React, { useState, useEffect } from "react";
import {
  FaClipboardList,
  FaCalendarCheck,
  FaConciergeBell,
  FaSearch,
  FaBell,
} from "react-icons/fa";


export default function Workspace() {
  const [activeTab, setActiveTab] = useState("orders");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 🔥 Simulated Real-Time Notifications (Replace with Firebase/WebSocket)
  useEffect(() => {
    const events = [
      "New order placed",
      "Seller accepted your booking",
      "New message from seller",
      "Order shipped",
      "Service completed",
    ];

    const interval = setInterval(() => {
      const randomEvent = events[Math.floor(Math.random() * events.length)];

      const newNotification = {
        id: Date.now(),
        text: randomEvent,
        time: "Just now",
      };

      setNotifications((prev) => [newNotification, ...prev]);
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Top Right Controls */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Workspace</h1>

        <div className="flex items-center gap-3 relative">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200 focus-within:ring-2 focus-within:ring-green-700 transition">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="outline-none w-40 text-sm"
            />
          </div>

          {/* Notification */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-white p-3 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition relative"
            >
              <FaBell className="text-gray-700" />

              {/* Live Count */}
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs px-1.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b font-semibold text-gray-700">
                   Notifications
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-gray-400 text-sm">
                      No activity yet...
                    </p>
                  ) : (
                    notifications.map((note) => (
                      <div
                        key={note.id}
                        className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer animate-pulse"
                      >
                        <p className="text-sm text-gray-800">
                          {note.text}
                        </p>
                        <span className="text-xs text-gray-400">
                          {note.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 text-center text-sm text-green-700 font-medium hover:bg-green-50 cursor-pointer">
                  View all
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-6">
        {/* Left Navigation */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "orders"
                ? "bg-green-700 text-white shadow-lg"
                : "text-gray-600 hover:bg-green-100"
            }`}
          >
            <FaClipboardList />
            <span className="font-medium">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "bookings"
                ? "bg-green-700 text-white shadow-lg"
                : "text-gray-600 hover:bg-green-100"
            }`}
          >
            <FaCalendarCheck />
            <span className="font-medium">Bookings</span>
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "services"
                ? "bg-green-700 text-white shadow-lg"
                : "text-gray-600 hover:bg-green-100"
            }`}
          >
            <FaConciergeBell />
            <span className="font-medium">Services</span>
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 bg-white rounded-2xl p-10 shadow-md">
          <p className="text-gray-500 text-lg">
            
          </p>
        </div>
      </div>
    </div>
  );
}
