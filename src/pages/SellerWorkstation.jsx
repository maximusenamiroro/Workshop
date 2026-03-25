import { useState, useEffect } from "react";
import logo from "../assets/ws-logo.png";

import {
  FaToggleOn,
  FaToggleOff,
  FaMapMarkerAlt,
  FaTrash,
  FaEye,
  FaBox,
  FaHome,
  FaUser,
  FaBell,
  FaClock,
} from "react-icons/fa";

export default function SellerWorkstation() {

  const [goLive, setGoLive] = useState(false);
  const [service, setService] = useState("");
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("Offline");

  useEffect(() => {
    if (goLive && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStatus("Online");
      });
    }
  }, [goLive]);

  const toggleLive = () => {
    if (goLive) {
      setGoLive(false);
      setLocation(null);
      setStatus("Offline");
    } else {
      setGoLive(true);
    }
  };

  const [post, setPost] = useState({ title: "", price: "", file: null });
  const [posts, setPosts] = useState([]);

  const uploadPost = () => {
    if (!post.title) return;

    const newPost = {
      ...post,
      id: Date.now(),
      preview: post.file ? URL.createObjectURL(post.file) : null,
      views: Math.floor(Math.random() * 200),
    };

    setPosts([...posts, newPost]);
    setPost({ title: "", price: "", file: null });
  };

  const deletePost = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white pb-32">

      {/* HEADER */}
      <div className="p-5 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Workstation</h1>
        <FaBell />
      </div>

      <div className="px-4 space-y-5">

        {/* LIVE */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl">

          <h2 className="mb-3 font-semibold">Live Service</h2>

          <select
            className="w-full p-2 rounded-xl bg-white/10 mb-3"
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Select Service</option>
            <option>Cleaning</option>
            <option>Driving</option>
            <option>Cooking</option>
          </select>

          <div className="flex justify-between items-center">
            <div>
              <p>Status: {status}</p>
              <p className="text-sm text-white/60">Service: {service || "None selected"}</p>
              {location && (
                <p className="text-sm text-white/60">
                  {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
                </p>
              )}
            </div>

            <button onClick={toggleLive} className="text-4xl">
              {goLive ? (
                <FaToggleOn className="text-[#007AFF]" />
              ) : (
                <FaToggleOff className="text-white/40" />
              )}
            </button>
          </div>

        </div>

        {/* UPLOAD */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl">

          <FaBox className="text-[#007AFF]" />

          <h3 className="mt-2">Upload Product</h3>

          <input
            placeholder="Title"
            value={post.title}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            className="w-full p-2 mt-2 rounded-xl bg-white/10"
          />

          <input
            placeholder="Price"
            value={post.price}
            onChange={(e) => setPost({ ...post, price: e.target.value })}
            className="w-full p-2 mt-2 rounded-xl bg-white/10"
          />

          <input
            type="file"
            onChange={(e) => setPost({ ...post, file: e.target.files[0] })}
            className="mt-2"
          />

          <button
            onClick={uploadPost}
            className="bg-[#007AFF] w-full py-2 mt-3 rounded-xl"
          >
            Upload
          </button>

        </div>

        {/* POSTS */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl">

          <h3 className="mb-3">Products</h3>

          {posts.map((p) => (
            <div key={p.id} className="flex justify-between py-2 border-b border-white/10">
              <span>{p.title}</span>

              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <FaEye /> {p.views}
                </span>

                <button onClick={() => deletePost(p.id)}>
                  <FaTrash />
                </button>
              </div>
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