import { useState, useEffect } from "react";
import {
  FaToggleOn,
  FaToggleOff,
  FaMapMarkerAlt,
  FaTrash,
  FaEye,
  FaBox
} from "react-icons/fa";

export default function SellerWorkstationBento() {

  // ================= LIVE SERVICE MODE =================
  const [goLive, setGoLive] = useState(false);
  const [service, setService] = useState("");
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("Offline");
  const [liveTimestamp, setLiveTimestamp] = useState(null); // store when went live

  useEffect(() => {
    if (goLive) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setStatus("Online");
          setLiveTimestamp(Date.now()); // mark timestamp
        },
        () => setStatus("Location Denied")
      );
    } else {
      setLocation(null);
      setStatus("Offline");
      setLiveTimestamp(null);
    }
  }, [goLive]);

  // Auto-expire live status after 24 hours
  useEffect(() => {
    if (!liveTimestamp) return;
    const timer = setInterval(() => {
      if (Date.now() - liveTimestamp >= 24 * 60 * 60 * 1000) {
        setGoLive(false);
      }
    }, 60 * 1000); // check every 1 min
    return () => clearInterval(timer);
  }, [liveTimestamp]);

  // ================= PRODUCT / POST MANAGER =================
  const [post, setPost] = useState({
    title: "",
    price: "",
    description: "",
    file: null,
    timestamp: null
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
      preview: post.file ? URL.createObjectURL(post.file) : null,
      views: Math.floor(Math.random() * 200),
      timestamp: Date.now()
    };

    setPosts([...posts, newPost]);

    setPost({
      title: "",
      price: "",
      description: "",
      file: null,
      timestamp: null
    });
  };

  // Auto-remove posts after 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPosts((prev) =>
        prev.filter((p) => now - p.timestamp < 24 * 60 * 60 * 1000)
      );
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const deletePost = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans pb-28">

      {/* HEADER */}
      <div className="p-5 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Workstation</h1>
      </div>

      {/* BENTO GRID */}
      <div className="px-4 grid grid-cols-2 gap-4">

        {/* LIVE SERVICE MODE */}
        <div className="col-span-2 glass-card p-5">
          <h2 className="text-lg font-semibold mb-3">Live Service Mode</h2>

          <select
            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 mb-3"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option>Select Service</option>
            <option>Cleaning</option>
            <option>Driving</option>
            <option>Cooking</option>
            <option>Plumbing</option>
            <option>Electrical</option>
          </select>

          <div className="flex justify-between items-center">
            <div className="text-sm">
              <p>Status: {status}</p>
              {location && (
                <p>{location.lat.toFixed(4)} | {location.lng.toFixed(4)}</p>
              )}
            </div>

            <button onClick={() => setGoLive(!goLive)} className="text-4xl">
              {goLive ? (
                <FaToggleOn className="text-[#007AFF]" />
              ) : (
                <FaToggleOff className="text-white/40" />
              )}
            </button>
          </div>
        </div>

        {/* PRODUCT MANAGER */}
        <div className="glass-card p-4">
          <FaBox className="text-[#007AFF] text-xl mb-2" />
          <h3 className="font-semibold mb-2">Upload Work</h3>

          <input
            name="title"
            placeholder="Title"
            onChange={handleChange}
            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 mb-2"
          />

          <input
            name="price"
            placeholder="Price"
            onChange={handleChange}
            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 mb-2"
          />

          <input
            type="file"
            onChange={handleFile}
            className="mb-2"
          />

          <button
            onClick={uploadPost}
            className="bg-[#007AFF] w-full py-2 rounded-xl"
          >
            Upload
          </button>
        </div>

        {/* POSTS ANALYTICS */}
        <div className="glass-card p-4">
          <FaEye className="text-[#007AFF] text-xl mb-2" />
          <h3 className="font-semibold">Your Posts</h3>

          <p className="text-white/60 text-sm">{posts.length} posts uploaded</p>
          <p className="text-white/60 text-sm mt-2">
            Total Views: {posts.reduce((a, b) => a + b.views, 0)}
          </p>
        </div>

        {/* POSTS GRID */}
        <div className="col-span-2">
          <h3 className="mb-3 font-semibold">Work Posts</h3>

          <div className="grid grid-cols-2 gap-4">
            {posts.map((p) => (
              <div key={p.id} className="glass-card p-3">
                {p.preview && (
                  <img src={p.preview} alt={p.title} className="w-full h-28 object-cover rounded-xl" />
                )}

                <h4 className="mt-2">{p.title}</h4>
                <p className="text-[#007AFF]">{p.price}</p>

                <div className="flex justify-between mt-2">
                  <span className="flex items-center gap-1 text-sm">
                    <FaEye />
                    {p.views}
                  </span>

                  <button onClick={() => deletePost(p.id)} className="text-red-400">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
