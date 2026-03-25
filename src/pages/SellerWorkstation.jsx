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
  FaClock
} from "react-icons/fa";

export default function SellerWorkstation() {

  // ================= LIVE SERVICE =================

  const [goLive, setGoLive] = useState(false);
  const [service, setService] = useState("");
  const [location, setLocation] = useState(null);
  const [liveTime, setLiveTime] = useState(null);
  const [status, setStatus] = useState("Offline");

  useEffect(() => {
    if (goLive) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });

        setLiveTime(Date.now());
        setStatus("Online");
      });
    } else {
      setLocation(null);
      setLiveTime(null);
      setStatus("Offline");
    }
  }, [goLive]);

  // auto turn off after 24hrs

  useEffect(() => {
    const timer = setInterval(() => {
      if (liveTime && Date.now() - liveTime > 86400000) {
        setGoLive(false);
        setStatus("Expired");
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [liveTime]);

  // ================= PRODUCT MANAGER =================

  const [post, setPost] = useState({
    title: "",
    price: "",
    file: null
  });

  const [posts, setPosts] = useState([]);

  const handleChange = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setPost({ ...post, file: e.target.files[0] });
  };

  const uploadPost = () => {
    if (!post.title) return;

    const newPost = {
      ...post,
      id: Date.now(),
      preview: post.file
        ? URL.createObjectURL(post.file)
        : null,
      views: Math.floor(Math.random() * 200),
      createdAt: Date.now()
    };

    setPosts([...posts, newPost]);

    setPost({
      title: "",
      price: "",
      file: null
    });
  };

  // auto remove post after 24hrs

  useEffect(() => {
    const timer = setInterval(() => {
      setPosts((prev) =>
        prev.filter(
          (p) => Date.now() - p.createdAt < 86400000
        )
      );
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const deletePost = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  // ================= BOOKINGS =================

  const [bookings, setBookings] = useState([
    {
      id: 1,
      name: "Cleaning Job",
      time: "Today 4PM",
      createdAt: Date.now()
    },
    {
      id: 2,
      name: "Driver Request",
      time: "Tomorrow 10AM",
      createdAt: Date.now()
    }
  ]);

  // auto remove booking after 24hrs

  useEffect(() => {
    const timer = setInterval(() => {
      setBookings((prev) =>
        prev.filter(
          (b) => Date.now() - b.createdAt < 86400000
        )
      );
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white pb-28">

      {/* HEADER */}

      <div className="p-5 flex justify-between">
        <h1 className="text-xl font-semibold">
          Workstation
        </h1>

        <FaBell />
      </div>

      <div className="px-4 space-y-4">

        {/* LIVE SERVICE */}

        <div className="glass-card p-5">

          <h2 className="mb-3">
            Live Service Mode
          </h2>

          <select
            className="w-full p-2 rounded-xl bg-white/10 mb-3"
            onChange={(e) => setService(e.target.value)}
          >
            <option>Select Service</option>
            <option>Cleaning</option>
            <option>Driving</option>
            <option>Cooking</option>
          </select>

          <div className="flex justify-between items-center">

            <div>

              <p>Status: {status}</p>

              {location && (
                <p className="text-sm text-white/60">
                  {location.lat.toFixed(4)} |{" "}
                  {location.lng.toFixed(4)}
                </p>
              )}

            </div>

            <button
              onClick={() => setGoLive(!goLive)}
              className="text-4xl"
            >
              {goLive ? (
                <FaToggleOn className="text-[#007AFF]" />
              ) : (
                <FaToggleOff className="text-white/40" />
              )}
            </button>

          </div>

        </div>

        {/* PRODUCT UPLOAD */}

        <div className="glass-card p-4">

          <FaBox className="text-[#007AFF]" />

          <h3 className="mt-2">
            Upload Product
          </h3>

          <input
            name="title"
            placeholder="Title"
            onChange={handleChange}
            className="w-full p-2 mt-2 rounded-xl bg-white/10"
          />

          <input
            name="price"
            placeholder="Price"
            onChange={handleChange}
            className="w-full p-2 mt-2 rounded-xl bg-white/10"
          />

          <input
            type="file"
            onChange={handleFile}
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

        <div className="glass-card p-4">

          <h3 className="mb-3">
            Products (24hrs)
          </h3>

          {posts.map((p) => (

            <div
              key={p.id}
              className="flex justify-between py-2 border-b border-white/10"
            >

              <span>{p.title}</span>

              <div className="flex gap-3">

                <span className="flex items-center gap-1">
                  <FaEye /> {p.views}
                </span>

                <button
                  onClick={() => deletePost(p.id)}
                >
                  <FaTrash />
                </button>

              </div>

            </div>

          ))}

        </div>

        {/* BOOKINGS */}

        <div className="glass-card p-4">

          <div className="flex gap-2 mb-3">
            <FaClock />
            <h3>Bookings (24hrs)</h3>
          </div>

          {bookings.map((b) => (

            <div
              key={b.id}
              className="flex justify-between py-2 border-b border-white/10"
            >

              <span>{b.name}</span>
              <span className="text-[#007AFF]">
                {b.time}
              </span>

            </div>

          ))}

        </div>

      </div>

      {/* NAVBAR */}

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
