import { useState, useEffect } from "react";
import logo from "../assets/ws-logo.png";

import {
  FaBox,
  FaClock,
  FaMapMarkerAlt,
  FaHome,
  FaUser,
  FaBell,
  FaPlay
} from "react-icons/fa";

export default function BuyerWorkspaceBento() {

  // ================= REAL TIME LOCATION =================

  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => console.log("Location denied")
    );
  }, []);

  // ================= PRODUCT ORDERS (WHATSAPP STATUS STYLE) =================

  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Cooking Gas",
      media: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
      lat: 4.81,
      lng: 7.04,
      status: "Shipping"
    },
    {
      id: 2,
      name: "Food Delivery",
      media: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      lat: 4.80,
      lng: 7.01,
      status: "On the way"
    },
    {
      id: 3,
      name: "Cleaning Service",
      media: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
      lat: 4.90,
      lng: 7.10,
      status: "Arriving"
    }
  ]);

  // ================= DISTANCE CALCULATION =================

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // ================= SORT BY CLOSEST =================

  const sortedProducts = userLocation
    ? [...products].sort((a, b) => {
        const d1 = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.lat,
          a.lng
        );

        const d2 = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.lat,
          b.lng
        );

        return d1 - d2;
      })
    : products;

  // ================= BOOKINGS =================

  const bookings = [
    { id: 1, skill: "Electrician", time: "Tomorrow 10AM" },
    { id: 2, skill: "Cleaner", time: "Today 4PM" }
  ];

  // ================= LIVE HIRE =================

  const liveHires = [
    { id: 1, service: "Driver", distance: "1.5km away" },
    { id: 2, service: "Cook", distance: "On the way" }
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white pb-28">

      {/* HEADER */}
      <div className="p-5 flex justify-between">
        <h1 className="text-xl font-semibold">
          Workspace
        </h1>

        <FaBell />
      </div>

      <div className="px-4 space-y-4">

        {/* ================= PRODUCT STATUS ================= */}

        <div className="glass-card p-4">

          <h2 className="mb-3">
            Product Orders
          </h2>

          <div className="flex gap-4 overflow-x-auto">

            {sortedProducts.map(product => (

              <div
                key={product.id}
                className="min-w-[120px] relative"
              >

                <img
                  src={product.media}
                  className="w-28 h-28 rounded-full object-cover border-2 border-[#007AFF]"
                />

                <p className="text-sm mt-1 text-center">
                  {product.name}
                </p>

                <p className="text-xs text-[#007AFF] text-center">
                  {product.status}
                </p>

              </div>

            ))}

          </div>

        </div>

        {/* ================= BOOKINGS ================= */}

        <div className="glass-card p-4">

          <div className="flex items-center gap-2 mb-3">
            <FaClock className="text-[#007AFF]" />
            <h3>Handskill Bookings</h3>
          </div>

          {bookings.map(b => (
            <div
              key={b.id}
              className="flex justify-between py-2 border-b border-white/10"
            >
              <span>{b.skill}</span>
              <span className="text-white/60">
                {b.time}
              </span>
            </div>
          ))}

        </div>

        {/* ================= LIVE SERVICE ================= */}

        <div className="glass-card p-4">

          <div className="flex items-center gap-2 mb-3">
            <FaMapMarkerAlt className="text-[#007AFF]" />
            <h3>Live Service Hires</h3>
          </div>

          {liveHires.map(l => (
            <div
              key={l.id}
              className="flex justify-between py-2 border-b border-white/10"
            >
              <span>{l.service}</span>
              <span className="text-[#007AFF]">
                {l.distance}
              </span>
            </div>
          ))}

        </div>

      </div>

      {/* ================= FLOATING NAVBAR ================= */}

      <div className="fixed bottom-6 left-0 right-0 flex justify-center">

        <div className="glass-card px-6 py-3 flex gap-8 rounded-full">

          <FaHome />

          <FaBox />

          <div className="bg-[#007AFF] w-14 h-14 rounded-full flex items-center justify-center -mt-8">
            <img src={logo} className="w-7" />
          </div>

          <FaMapMarkerAlt />

          <FaUser />

        </div>

      </div>

    </div>
  );
}
