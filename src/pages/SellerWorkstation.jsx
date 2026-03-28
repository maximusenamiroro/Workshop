import { useState, useEffect } from "react";
import { FaEye, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function SellerWorkstation() {

  // ================= LIVE MODE =================
  const [isLive, setIsLive] = useState(false);
  const [service, setService] = useState("");

  // ================= POSTS =================
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    file: null
  });

  // ================= BOOKINGS =================
  const [bookings, setBookings] = useState([]);

  // ================= LOAD MOCK =================
  useEffect(() => {
    setBookings([
      { id: 1, name: "Cleaning Job", time: "Today 4PM" }
    ]);
  }, []);

  // ================= UPLOAD =================
  const uploadPost = () => {
    if (!form.title) return;

    const newPost = {
      ...form,
      id: Date.now(),
      preview: form.file ? URL.createObjectURL(form.file) : null,
      views: 0,
      createdAt: Date.now()
    };

    setPosts(prev => [newPost, ...prev]);

    setForm({ title: "", price: "", file: null });
  };

  // ================= AUTO DELETE (24HRS) =================
  useEffect(() => {
    const interval = setInterval(() => {
      setPosts(prev =>
        prev.filter(p => Date.now() - p.createdAt < 86400000)
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white p-4 md:p-8 space-y-6">

      <h1 className="text-xl md:text-2xl font-semibold">
        Workstation
      </h1>

      {/* ================= LIVE ================= */}
      <div className="glass-card p-5">
        <h2 className="mb-3">Go Live</h2>

        <select
          onChange={(e) => setService(e.target.value)}
          className="w-full p-2 mb-3 bg-white/10 rounded-xl"
        >
          <option>Select Service</option>
          <option>Cleaning</option>
          <option>Driving</option>
        </select>

        <div className="flex justify-between items-center">
          <span>Status: {isLive ? "Online" : "Offline"}</span>

          <button onClick={() => setIsLive(!isLive)}>
            {isLive ? (
              <FaToggleOn className="text-[#007AFF] text-3xl" />
            ) : (
              <FaToggleOff className="text-white/40 text-3xl" />
            )}
          </button>
        </div>
      </div>

      {/* ================= UPLOAD ================= */}
      <div className="glass-card p-5">
        <h3 className="mb-3">Upload Product</h3>

        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 mb-2 bg-white/10 rounded-xl"
        />

        <input
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full p-2 mb-2 bg-white/10 rounded-xl"
        />

        <input
          type="file"
          onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
        />

        <button
          onClick={uploadPost}
          className="w-full mt-3 bg-[#007AFF] py-2 rounded-xl"
        >
          Upload
        </button>
      </div>

      {/* ================= POSTS ================= */}
      <div className="glass-card p-5">
        <h3 className="mb-3">Posts (24hrs)</h3>

        {posts.map(p => (
          <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/10">
            <span>{p.title}</span>

            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <FaEye /> {p.views}
              </span>

              <button onClick={() => setPosts(posts.filter(x => x.id !== p.id))}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= BOOKINGS ================= */}
      <div className="glass-card p-5">
        <h3 className="mb-3">Bookings</h3>

        {bookings.map(b => (
          <div key={b.id} className="flex justify-between py-2 border-b border-white/10">
            <span>{b.name}</span>
            <span className="text-[#007AFF]">{b.time}</span>
          </div>
        ))}
      </div>

    </div>
  );
}