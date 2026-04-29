import { useState, useEffect, useRef } from "react";
import {
  FaBookmark, FaShoppingBag, FaBox,
  FaEllipsisV, FaUserEdit, FaPlus,
  FaPlay, FaTimes, FaTrash
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

export default function BuyerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const containerRef = useRef(null);
  const { showToast, ToastUI } = useToast();

  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [activeReel, setActiveReel] = useState(null);
  const videoRef = useRef(null);

  const [profile, setProfile] = useState({ full_name: "", country: "", avatar_url: "", bio: "" });
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  useEffect(() => {
    if (activeTab === "saved" && savedReels.length === 0) fetchSavedReels();
  }, [activeTab]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    await Promise.all([fetchProfile(), fetchOrders(), fetchBookings()]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, country, avatar_url, bio")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormData(data);
        if (data.avatar_url) setProfileImage(data.avatar_url);
      }
    } catch (err) {
      console.error("Fetch profile error:", err.message);
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, product_name, status, created_at, price")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setOrders(data || []);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("hire_requests")
      .select("id, job_description, status, created_at, location, worker_id")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setBookings(data || []);
  };

  const fetchSavedReels = async () => {
    setSavedLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_reels")
        .select(`id, created_at, reels(id, video_url, description, type, likes, user_id, profiles(full_name, avatar_url))`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSavedReels((data || []).map(s => s.reels).filter(Boolean));
    } catch (err) {
      console.error("fetchSavedReels error:", err.message);
    } finally {
      setSavedLoading(false);
    }
  };

  const unsaveReel = async (reelId) => {
    await supabase.from("saved_reels").delete().eq("user_id", user.id).eq("reel_id", reelId);
    setSavedReels(prev => prev.filter(r => r.id !== reelId));
    if (activeReel?.id === reelId) setActiveReel(null);
    showToast("Reel unsaved");
  };

  const changeProfile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setProfileImage(URL.createObjectURL(file));
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
      setProfileImage(urlData.publicUrl);
      showToast("Profile picture updated!");
    } catch (err) {
      showToast("Failed to upload: " + err.message, "error");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: formData.full_name, country: formData.country || null, bio: formData.bio || null })
        .eq("id", user.id);
      if (error) throw error;
      setProfile(formData);
      setEditOpen(false);
      showToast("Profile saved!");
    } catch (err) {
      showToast("Failed to save: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let startY = 0, currentY = 0, isPulling = false;
    const handleTouchStart = (e) => { if (window.scrollY === 0) { startY = e.touches[0].clientY; isPulling = true; } };
    const handleTouchMove = (e) => { if (!isPulling) return; currentY = e.touches[0].clientY; container.style.transform = `translateY(${Math.min(Math.max(0, currentY - startY) * 0.55, 85)}px)`; };
    const handleTouchEnd = () => { if (!isPulling) return; const d = currentY - startY; isPulling = false; container.style.transition = "transform 420ms cubic-bezier(0.34,1.56,0.64,1)"; container.style.transform = "translateY(0)"; if (d > 115) fetchAll(true); setTimeout(() => { container.style.transition = ""; }, 450); };
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    return () => { container.removeEventListener("touchstart", handleTouchStart); container.removeEventListener("touchmove", handleTouchMove); container.removeEventListener("touchend", handleTouchEnd); };
  }, []);

  const getStatusColor = (s) => s === "accepted" || s === "delivered" ? "text-green-400" : s === "rejected" ? "text-red-400" : "text-yellow-400";
  const getStatusBg = (s) => s === "accepted" || s === "delivered" ? "bg-green-500/20 text-green-400" : s === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400";
  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading && !refreshing) return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 h-14 bg-black/95 backdrop-blur-lg border-b border-white/10" />
      <div className="px-5 pt-8 pb-6 animate-pulse flex flex-col items-center">
        <div className="w-24 h-24 bg-zinc-800 rounded-full" />
        <div className="mt-4 h-6 w-48 bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      <ToastUI />

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="w-8" />
        <h1 className="font-semibold text-lg">My Profile</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400 hover:text-white active:scale-90 transition-transform">
          <FaEllipsisV size={19} />
        </button>
        {menuOpen && (
          <div className="absolute right-4 top-14 bg-zinc-900 border border-white/10 rounded-2xl p-2 text-sm z-50 w-40 shadow-xl">
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer" onClick={() => { setMenuOpen(false); navigate("/settings"); }}>⚙️ Settings</p>
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer text-red-400" onClick={async () => { await logout(); navigate("/login"); }}>🚪 Logout</p>
          </div>
        )}
      </div>

      {/* PROFILE INFO */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-600 shadow-lg shadow-green-500/20 transition-all group-hover:scale-105">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-4xl font-bold">
                  {profile.full_name?.[0] || "U"}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-green-600 hover:bg-green-700 p-2.5 rounded-2xl cursor-pointer shadow-md active:scale-90 transition-all">
              <FaPlus size={12} />
              <input type="file" accept="image/*" className="hidden" onChange={changeProfile} />
            </label>
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight">{profile.full_name || "Your Name"}</h2>
          {profile.country && <p className="text-emerald-400 text-xs mt-0.5">📍 {profile.country}</p>}
          {profile.bio && <p className="mt-3 text-center text-gray-400 text-xs leading-relaxed max-w-[260px]">{profile.bio}</p>}

          <div className="flex gap-8 mt-7 text-center">
            {[{ value: orders.length, label: "Orders" }, { value: bookings.length, label: "Bookings" }, { value: savedReels.length, label: "Saved" }].map((stat, i) => (
              <div key={i}>
                <div className="text-xl font-bold tracking-tighter">{stat.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setEditOpen(true)} className="mt-6 bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-semibold active:scale-[0.96] transition-all">
            <FaUserEdit size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-white/10 sticky top-[57px] bg-black z-40">
        <div className="flex px-4">
          {[{ id: "orders", icon: <FaBox size={13} />, label: "Orders" }, { id: "bookings", icon: <FaShoppingBag size={13} />, label: "Bookings" }, { id: "saved", icon: <FaBookmark size={13} />, label: "Saved" }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 relative transition-all duration-200 ${activeTab === tab.id ? "text-white" : "text-gray-500"}`}>
              {tab.icon}{tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-green-500 rounded" />}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 pt-4">
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-30">📦</div>
                <p className="text-gray-500 text-xs">No orders yet</p>
              </div>
            ) : orders.map((o, i) => (
              <div key={o.id} className="bg-zinc-900 border border-white/10 rounded-xl p-3.5 flex justify-between items-center hover:border-white/20 transition-all">
                <div>
                  <p className="font-medium text-sm truncate pr-2">{o.product_name}</p>
                  <p className="text-[10px] text-gray-500">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${getStatusColor(o.status)}`}>{o.status || "pending"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">₦{Number(o.price || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-30">📋</div>
                <p className="text-gray-500 text-xs">No bookings yet</p>
                <button onClick={() => navigate("/hire-worker")} className="mt-4 bg-green-600 px-5 py-2.5 rounded-2xl text-xs font-semibold active:scale-95">Hire a Worker</button>
              </div>
            ) : bookings.map((b) => (
              <div key={b.id} className="bg-zinc-900 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                <div className="flex justify-between">
                  <div className="flex-1 pr-3">
                    <p className="font-medium text-sm line-clamp-2">{b.job_description || "Job Request"}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {b.location}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full self-start ${getStatusBg(b.status)}`}>{b.status || "pending"}</span>
                </div>
                {b.worker_id && (
                  <button onClick={() => navigate(`/seller-profile/${b.worker_id}`)} className="mt-3 text-xs text-blue-400 hover:text-blue-300">View Worker →</button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "saved" && (
          <>
            {savedLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : savedReels.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaBookmark size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-xs">No saved reels</p>
                <button onClick={() => navigate("/reels")} className="mt-5 bg-green-600 px-5 py-2.5 rounded-2xl text-xs font-semibold">Browse Reels</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {savedReels.map((reel) => (
                  <div key={reel.id} className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden ring-1 ring-white/5 hover:ring-green-500/30 hover:scale-[1.02] transition-all active:scale-95">
                    <video src={reel.video_url} className="w-full h-full object-cover" muted onClick={() => setActiveReel(reel)} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20" onClick={() => setActiveReel(reel)}>
                      <div className="w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <FaPlay size={9} className="text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 p-1.5 cursor-pointer" onClick={() => navigate(`/seller-profile/${reel.user_id}`)}>
                      <p className="text-[10px] text-white truncate">@{reel.profiles?.full_name || "Worker"}</p>
                    </div>
                    <button onClick={() => unsaveReel(reel.id)} className="absolute top-1.5 right-1.5 bg-black/70 p-1 rounded-lg z-10">
                      <FaBookmark size={10} className="text-yellow-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {refreshing && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-green-500/30 text-green-400 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs z-50">
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          Refreshing...
        </div>
      )}

      {/* EDIT MODAL */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm">
            <h2 className="font-bold mb-4">Edit Profile</h2>
            <input type="text" name="full_name" value={formData.full_name || ""} onChange={handleChange} placeholder="Full Name" className="w-full p-3 mb-3 rounded-xl bg-white/10 text-sm outline-none" />
            <input type="text" name="country" value={formData.country || ""} onChange={handleChange} placeholder="Country" className="w-full p-3 mb-3 rounded-xl bg-white/10 text-sm outline-none" />
            <textarea name="bio" value={formData.bio || ""} onChange={handleChange} placeholder="Bio" rows={2} className="w-full p-3 mb-4 rounded-xl bg-white/10 text-sm outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setEditOpen(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-sm">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="flex-1 py-3 rounded-xl bg-green-600 disabled:bg-gray-600 text-sm font-semibold">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REEL VIEWER */}
      {activeReel && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="flex items-center justify-between p-4 pt-12">
            <button onClick={() => navigate(`/seller-profile/${activeReel.user_id}`)} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-green-500">
                {activeReel.profiles?.avatar_url ? (
                  <img src={activeReel.profiles.avatar_url} alt="" className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
                    {activeReel.profiles?.full_name?.[0] || "W"}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium">@{activeReel.profiles?.full_name}</p>
            </button>
            <button onClick={() => setActiveReel(null)} className="p-2"><FaTimes size={20} /></button>
          </div>
          <div className="flex-1 relative bg-black">
            <video ref={videoRef} src={activeReel.video_url} autoPlay loop playsInline className="w-full h-full object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black p-5">
              {activeReel.description && <p className="text-sm text-gray-300 mb-4">{activeReel.description}</p>}
              <div className="flex gap-3">
                <button onClick={() => navigate(`/seller-profile/${activeReel.user_id}`)} className="flex-1 bg-white/20 py-3 rounded-2xl text-sm font-medium">View Profile</button>
                <button onClick={() => unsaveReel(activeReel.id)} className="flex-1 bg-yellow-600/20 text-yellow-400 py-3 rounded-2xl text-sm font-medium">Unsave</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}