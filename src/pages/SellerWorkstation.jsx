import { useState, useEffect } from "react";
import {
  FaBell,
  FaUpload,
  FaEye,
  FaToggleOn,
  FaToggleOff
} from "react-icons/fa";

export default function Workstation() {
  // ================= STATE =================
  const [isLive, setIsLive] = useState(false);
  const [views, setViews] = useState(248);

  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Deep Cleaning",
      price: "$80",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952"
    },
    {
      id: 2,
      title: "Cooking",
      price: "$60",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
    }
  ]);

  // 🔥 Simulate real-time views (ready for backend later)
  useEffect(() => {
    const interval = setInterval(() => {
      setViews((prev) => prev + Math.floor(Math.random() * 5));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ================= UI =================
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-4 md:px-8 py-4 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg md:text-2xl font-semibold">
          Workstation
        </h1>
        <FaBell />
      </div>

      {/* ================= LIVE SERVICE ================= */}
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">

        <h2 className="mb-4 text-sm md:text-base">
          Live Service Mode
        </h2>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm">Cleaning</p>
            <p className="text-xs text-white/50">
              Status: {isLive ? "Online" : "Offline"}
            </p>
          </div>

          <button onClick={() => setIsLive(!isLive)}>
            {isLive ? (
              <FaToggleOn size={40} className="text-[#007AFF]" />
            ) : (
              <FaToggleOff size={40} className="text-white/30" />
            )}
          </button>
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* UPLOAD */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">

          <FaUpload className="text-[#007AFF] mb-3" />

          <h3 className="mb-2">Upload Work</h3>

          <button className="w-full bg-[#007AFF] py-2 rounded-xl">
            Upload
          </button>
        </div>

        {/* VIEWS */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">

          <FaEye className="text-[#007AFF] mb-3" />

          <h3>Post Views</h3>

          <h2 className="text-2xl mt-2">{views}</h2>

          <p className="text-xs text-white/50">
            Total Views (Live)
          </p>
        </div>

      </div>

      {/* ================= POSTS ================= */}
      <div>
        <h3 className="mb-4">Your Work Posts</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10"
            >
              <img
                src={p.image}
                className="rounded-lg h-28 w-full object-cover"
              />

              <p className="text-sm mt-2">{p.title}</p>
              <p className="text-xs text-[#007AFF]">
                {p.price}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}