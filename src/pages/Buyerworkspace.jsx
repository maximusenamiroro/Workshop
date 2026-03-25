import { useState, useEffect } from "react";
import logo from "../assets/ws-logo.png";

import {
  FaBox,
  FaClock,
  FaMapMarkerAlt,
  FaHome,
  FaUser,
  FaBell,
} from "react-icons/fa";

export default function BuyerWorkspaceBento() {

  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => console.log("Location denied")
      );
    }
  }, []);

  const [products] = useState([
    {
      id: 1,
      name: "Cooking Gas",
      media: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
      lat: 4.81,
      lng: 7.04,
      status: "Shipping",
    },
    {
      id: 2,
      name: "Food Delivery",
      media: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      lat: 4.8,
      lng: 7.01,
      status: "On the way",
    },
    {
      id: 3,
      name: "Cleaning Service",
      media: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
      lat: 4.9,
      lng: 7.1,
      status: "Arriving",
    },
  ]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const sortedProducts = userLocation
    ? [...products].sort(
        (a, b) =>
          calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) -
          calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : products;

  const bookings = [
    { id: 1, skill: "Electrician", time: "Tomorrow 10AM" },
    { id: 2, skill: "Cleaner", time: "Today 4PM" },
  ];

  const liveHires = [
    { id: 1, service: "Driver", distance: "1.5km away" },
    { id: 2, service: "Cook", distance: "On the way" },
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white pb-32">

      {/* HEADER */}
      <div className="p-5 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Workspace</h1>
        <FaBell className="text-lg" />
      </div>

      <div className="px-4 space-y-5">

        {/* PRODUCTS */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl">
          <h2 className="mb-3 font-semibold">Product Orders</h2>

          <div className="flex gap-4 overflow-x-auto">
            {sortedProducts.map((p) => (
              <div key={p.id} className="min-w-[110px] text-center">
                <img
                  src={p.media}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#007AFF]"
                />
                <p className="text-sm mt-1">{p.name}</p>
                <p className="text-xs text-[#007AFF]">{p.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BOOKINGS */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <FaClock className="text-[#007AFF]" />
            <h3>Bookings</h3>
          </div>

          {bookings.map((b) => (
            <div key={b.id} className="flex justify-between py-2 border-b border-white/10">
              <span>{b.skill}</span>
              <span className="text-white/60">{b.time}</span>
            </div>
          ))}
        </div>

        {/* LIVE */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <FaMapMarkerAlt className="text-[#007AFF]" />
            <h3>Live Services</h3>
          </div>

          {liveHires.map((l) => (
            <div key={l.id} className="flex justify-between py-2 border-b border-white/10">
              <span>{l.service}</span>
              <span className="text-[#007AFF]">{l.distance}</span>
            </div>
          ))}
        </div>

      </div>

      {/* NAVBAR */}
      <div className="fixed bottom-5 left-0 right-0 flex justify-center">
        <div className="bg-white/10 backdrop-blur-xl px-6 py-3 flex gap-8 rounded-full">

          <FaHome />
          <FaBox />

          <div className="bg-[#007AFF] w-14 h-14 rounded-full flex items-center justify-center -mt-8 shadow-lg">
            <img src={logo} className="w-7" />
          </div>

          <FaMapMarkerAlt />
          <FaUser />

        </div>
      </div>

    </div>
  );
}