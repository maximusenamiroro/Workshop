import { useState, useEffect } from "react";
import { FaEye, FaTrash, FaToggleOn, FaToggleOff, FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function SellerWorkstationBento() {
  const { user } = useAuth();

  // ================= LIVE MODE =================
  const [goLive, setGoLive] = useState(false);
  const [service, setService] = useState("");
  const [liveTimestamp, setLiveTimestamp] = useState(null);
  const [liveCountdown, setLiveCountdown] = useState("");

  // ================= POSTS =================
  const [post, setPost] = useState({ title: "", price: "", description: "", file: null });
  const [posts, setPosts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [postCountdowns, setPostCountdowns] = useState({}); // id => countdown string

  // ================= BOOKINGS =================
  const [bookings, setBookings] = useState([]);

  // ================= FETCH DATA =================
  useEffect(() => {
    if (!user) return;
    fetchLiveStatus();
    fetchPosts();
    fetchBookings();
  }, [user]);

  // ================= LIVE STATUS =================
  const fetchLiveStatus = async () => {
    const { data } = await supabase
      .from("live_workers")
      .select("service, updated_at")
      .eq("worker_id", user.id)
      .single();

    if (data) {
      const timestamp = new Date(data.updated_at).getTime();
      if (Date.now() - timestamp >= 24 * 60 * 60 * 1000) {
        await supabase.from("live_workers").delete().eq("worker_id", user.id);
        setGoLive(false);
        setService("");
        setLiveTimestamp(null);
      } else {
        setGoLive(true);
        setService(data.service);
        setLiveTimestamp(timestamp);
      }
    }
  };

  const toggleLive = async () => {
    try {
      if (goLive) {
        await supabase.from("live_workers").delete().eq("worker_id", user.id);
        setGoLive(false);
        setLiveTimestamp(null);
      } else {
        if (!service) return alert("Select a service first");
        await supabase.from("live_workers").upsert({
          worker_id: user.id,
          service,
          updated_at: new Date()
        });
        setGoLive(true);
        setLiveTimestamp(Date.now());
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update live status");
    }
  };

  // ================= POSTS =================
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("reels")
      .select("id, description, price, likes, created_at, file_type, file_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error(error);

    // Filter out expired posts
    const filtered = (data || []).filter(p => Date.now() - new Date(p.created_at).getTime() < 24 * 60 * 60 * 1000);
    setPosts(filtered);

    // Initialize countdowns
    const countdowns = {};
    filtered.forEach(p => {
      const expireTime = new Date(p.created_at).getTime() + 24 * 60 * 60 * 1000;
      countdowns[p.id] = formatCountdown(expireTime - Date.now());
    });
    setPostCountdowns(countdowns);
  };

  const handleChange = (e) => setPost({ ...post, [e.target.name]: e.target.value });
  const handleFile = (e) => setPost({ ...post, file: e.target.files[0] });

  const uploadPost = async () => {
    if (!post.title || !post.file) return alert("Add title and file");

    setUploading(true);
    try {
      const ext = post.file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("reels").upload(fileName, post.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("reels").getPublicUrl(fileName);
      const fileType = post.file.type.startsWith("image") ? "image" : "video";

      await supabase.from("reels").insert({
        user_id: user.id,
        description: post.title,
        price: post.price,
        file_url: urlData.publicUrl,
        file_type: fileType,
        created_at: new Date()
      });

      setPost({ title: "", price: "", description: "", file: null });
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deletePost = async (id, fileUrl) => {
    try {
      await supabase.from("reels").delete().eq("id", id);
      const fileName = fileUrl.split("/").pop();
      await supabase.storage.from("reels").remove([fileName]);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  // ================= BOOKINGS =================
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("hire_requests")
      .select("id, created_at, status, profiles(full_name)")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) console.error(error);
    setBookings(data || []);
  };

  // ================= COUNTDOWN =================
  const formatCountdown = (ms) => {
    if (ms <= 0) return "Expired";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Update countdowns every second and remove expired posts/live
  useEffect(() => {
    const interval = setInterval(async () => {
      // Live countdown
      if (liveTimestamp) {
        const remaining = liveTimestamp + 24 * 60 * 60 * 1000 - Date.now();
        setLiveCountdown(formatCountdown(remaining));
        if (remaining <= 0) {
          setGoLive(false);
          setService("");
          await supabase.from("live_workers").delete().eq("worker_id", user.id);
        }
      }

      // Posts countdown
      const newCountdowns = {};
      const remainingPosts = [];
      for (let p of posts) {
        const expireTime = new Date(p.created_at).getTime() + 24 * 60 * 60 * 1000;
        const remaining = expireTime - Date.now();
        if (remaining > 0) {
          newCountdowns[p.id] = formatCountdown(remaining);
          remainingPosts.push(p);
        } else {
          // auto-delete expired post from Supabase
          await supabase.from("reels").delete().eq("id", p.id);
        }
      }
      setPosts(remainingPosts);
      setPostCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [liveTimestamp, posts]);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans pb-28 p-4 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <FaClipboardList className="text-xl text-white/70" />
        <h1 className="text-xl font-semibold">Workstation</h1>
        <div className="flex items-center gap-4">
          <FaSearch className="text-white/70 text-xl" />
          <FaBell className="text-white/70 text-xl" />
        </div>
      </div>

      {/* LIVE SERVICE MODE */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold mb-3">Live Service Mode</h2>
        <select
          className="w-full p-2 rounded-xl bg-white/10 border border-white/10 mb-3"
          value={service}
          onChange={(e) => setService(e.target.value)}
          disabled={goLive}
        >
          <option>Select Service</option>
          <option>Cleaning</option>
          <option>Driving</option>
          <option>Cooking</option>
          <option>Plumbing</option>
          <option>Electrical</option>
        </select>
        <div className="flex justify-between items-center">
          <span className={goLive ? "text-green-400" : "text-gray-400"}>
            Status: {goLive ? `🟢 Online (${liveCountdown})` : "⚫ Offline"}
          </span>
          <button onClick={toggleLive}>
            {goLive ? <FaToggleOn className="text-[#007AFF] text-4xl" /> : <FaToggleOff className="text-white/40 text-4xl" />}
          </button>
        </div>
      </div>

      {/* UPLOAD WORK */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-2">Upload Work</h3>
        <input
          name="title"
          placeholder="Title / Description"
          onChange={handleChange}
          value={post.title}
          className="w-full p-2 rounded-xl bg-white/10 border border-white/10 mb-2"
        />
        <input
          name="price"
          placeholder="Price (optional)"
          onChange={handleChange}
          value={post.price}
          className="w-full p-2 rounded-xl bg-white/10 border border-white/10 mb-2"
        />
        <input type="file" onChange={handleFile} className="mb-2" />
        <button
          onClick={uploadPost}
          disabled={uploading}
          className="bg-[#007AFF] w-full py-2 rounded-xl"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* POSTS GRID */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">Work Posts</h3>
        {posts.length === 0 && <p className="text-white/60 text-sm">No posts yet.</p>}
        <div className="grid grid-cols-2 gap-4">
          {posts.map((p) => (
            <div key={p.id} className="glass-card p-3">
              {p.file_type === "image" ? (
                <img src={p.file_url} className="w-full h-28 object-cover rounded-xl" alt="post" />
              ) : (
                <video src={p.file_url} className="w-full h-28 object-cover rounded-xl" controls />
              )}
              <h4 className="mt-2">{p.description}</h4>
              {p.price && <p className="text-[#007AFF]">{p.price}</p>}
              <span className="text-xs text-gray-400">Expires in: {postCountdowns[p.id]}</span>
              <div className="flex justify-between mt-2">
                <span className="flex items-center gap-1 text-sm">
                  <FaEye /> {p.likes || 0}
                </span>
                <button onClick={() => deletePost(p.id, p.file_url)} className="text-red-400">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT BOOKINGS */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">Recent Bookings</h3>
        {bookings.length === 0 && <p className="text-white/60 text-sm">No bookings yet.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="flex justify-between py-2 border-b border-white/10">
            <span>{b.profiles?.full_name || "Client"}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              b.status === "accepted" ? "bg-green-500/20 text-green-400" :
              b.status === "rejected" ? "bg-red-500/20 text-red-400" :
              "bg-yellow-500/20 text-yellow-400"
            }`}>
              {b.status || "pending"}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
