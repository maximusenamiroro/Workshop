import { useState, useEffect } from "react";
import { FaEye, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function SellerWorkstation() {
  const { user } = useAuth();

  // ================= LIVE MODE =================
  const [isLive, setIsLive] = useState(false);
  const [service, setService] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);

  // ================= POSTS =================
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", price: "", file: null });
  const [uploading, setUploading] = useState(false);

  // ================= BOOKINGS =================
  const [bookings, setBookings] = useState([]);

  // ================= LOAD DATA =================
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
      .select("id, service")
      .eq("worker_id", user.id)
      .single();

    if (data) {
      setIsLive(true);
      setService(data.service || "");
    }
  };

  const toggleLive = async () => {
    setLiveLoading(true);
    try {
      if (isLive) {
        // Go offline
        await supabase
          .from("live_workers")
          .delete()
          .eq("worker_id", user.id);
        setIsLive(false);
      } else {
        // Go live
        if (!service) {
          alert("Please select a service first");
          return;
        }
        const { error } = await supabase
          .from("live_workers")
          .upsert({ worker_id: user.id, service, updated_at: new Date() });
        if (error) throw error;
        setIsLive(true);
      }
    } catch (err) {
      console.error("Live toggle error:", err.message);
      alert("Failed to update live status");
    } finally {
      setLiveLoading(false);
    }
  };

  // ================= POSTS =================
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("reels")
      .select("id, description, likes, created_at, video_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Fetch posts error:", error.message);
    setposts(data || []);
  };

  const uploadPost = async () => {
    if (!form.title) return alert("Please add a title");
    if (!form.file) return alert("Please select a file");

    setUploading(true);
    try {
      // 1. Upload video to Supabase Storage
      const fileExt = form.file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(fileName, form.file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from("reels")
        .getPublicUrl(fileName);

      // 3. Insert reel record
      const { error: insertError } = await supabase.from("reels").insert({
        user_id: user.id,
        video_url: urlData.publicUrl,
        description: form.title,
        type: "service",
      });

      if (insertError) throw insertError;

      setForm({ title: "", price: "", file: null });
      fetchPosts();
    } catch (err) {
      console.error("Upload error:", err.message);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deletePost = async (id, videoUrl) => {
    try {
      // Delete from DB
      await supabase.from("reels").delete().eq("id", id);

      // Delete from storage
      const fileName = videoUrl.split("/").pop();
      await supabase.storage.from("reels").remove([fileName]);

      fetchPosts();
    } catch (err) {
      console.error("Delete error:", err.message);
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

    if (error) console.error("Fetch bookings error:", error.message);
    setBookings(data || []);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white p-4 md:p-8 space-y-6">

      <h1 className="text-xl md:text-2xl font-semibold">Workstation</h1>

      {/* ================= LIVE ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="mb-3 font-semibold">Go Live</h2>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full p-2 mb-3 bg-white/10 rounded-xl text-white"
          disabled={isLive}
        >
          <option value="">Select Service</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Driving">Driving</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
          <option value="Carpentry">Carpentry</option>
          <option value="Security">Security</option>
          <option value="Delivery">Delivery</option>
        </select>

        <div className="flex justify-between items-center">
          <span className={isLive ? "text-green-400" : "text-gray-400"}>
            Status: {isLive ? "🟢 Online" : "⚫ Offline"}
          </span>

          <button onClick={toggleLive} disabled={liveLoading}>
            {isLive ? (
              <FaToggleOn className="text-green-400 text-3xl" />
            ) : (
              <FaToggleOff className="text-white/40 text-3xl" />
            )}
          </button>
        </div>
      </div>

      {/* ================= UPLOAD ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="mb-3 font-semibold">Upload Reel</h3>

        <input
          placeholder="Title / Description"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 mb-2 bg-white/10 rounded-xl text-white placeholder-gray-500"
        />

        <input
          placeholder="Price (optional)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full p-2 mb-2 bg-white/10 rounded-xl text-white placeholder-gray-500"
        />

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
          className="text-gray-400 text-sm mb-2"
        />

        <button
          onClick={uploadPost}
          disabled={uploading}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded-xl font-semibold transition"
        >
          {uploading ? "Uploading..." : "Upload Reel"}
        </button>
      </div>

      {/* ================= POSTS ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="mb-3 font-semibold">My Reels</h3>

        {posts.length === 0 && (
          <p className="text-gray-500 text-sm">No reels yet. Upload one above!</p>
        )}

        {posts.map((p) => (
          <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/10">
            <div>
              <p className="text-sm font-medium">{p.description}</p>
              <p className="text-xs text-gray-500">{formatDate(p.created_at)}</p>
            </div>
            <div className="flex gap-3 items-center">
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <FaEye /> {p.likes}
              </span>
              <button
                onClick={() => deletePost(p.id, p.video_url)}
                className="text-red-400 hover:text-red-300"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= BOOKINGS ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="mb-3 font-semibold">Recent Bookings</h3>

        {bookings.length === 0 && (
          <p className="text-gray-500 text-sm">No bookings yet.</p>
        )}

        {bookings.map((b) => (
          <div key={b.id} className="flex justify-between py-2 border-b border-white/10">
            <span className="text-sm">{b.profiles?.full_name || "Client"}</span>
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