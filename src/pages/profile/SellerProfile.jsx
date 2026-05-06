import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaUserEdit, FaEllipsisV, FaPlus, FaTrash,
  FaStar, FaBell, FaHeart, FaEye,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

export default function SellerProfile() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { id: paramId } = useParams();
  const { showToast, ToastUI } = useToast();

  const profileId = paramId || user?.id;
  const isOwnProfile = !paramId || paramId === user?.id;
  const isWorkerViewingWorker = role === "worker" && !isOwnProfile;

  const [activeTab, setActiveTab] = useState("reels");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [viewingProfileImage, setViewingProfileImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [reels, setReels] = useState([]);
  const [reelViews, setReelViews] = useState({}); // reelId -> view count
  const [products, setProducts] = useState([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalReelViews, setTotalReelViews] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [recentViewers, setRecentViewers] = useState([]);
  const [viewingReel, setViewingReel] = useState(null);
  const reelVideoRef = useRef(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const [profile, setProfile] = useState({ full_name: "", country: "", avatar_url: "", bio: "" });
  const [formData, setFormData] = useState({ full_name: "", country: "", bio: "" });

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRefs = useRef(new Map());

  useEffect(() => {
    if (!profileId) return;
    fetchAll();
  }, [profileId]);

  // Record profile view when a non-owner visits
  useEffect(() => {
    if (!profileId || !user || isOwnProfile) return;
    recordProfileView();
  }, [profileId, user]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchReels(),
      fetchProducts(),
      fetchFollowData(),
      fetchRatingData(),
      fetchProfileViews(),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, country, avatar_url, bio")
        .eq("id", profileId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          country: data.country || "",
          bio: data.bio || "",
        });
        if (data.avatar_url) setProfileImage(data.avatar_url);
      }
    } catch (err) {
      console.error("fetchProfile error:", err.message);
    }
  };

  const fetchReels = async () => {
    try {
      const { data } = await supabase
        .from("reels")
        .select("id, video_url, description, likes, created_at, type")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      setReels(data || []);

      const likes = (data || []).reduce((sum, r) => sum + (r.likes || 0), 0);
      setTotalLikes(likes);

      // Fetch view counts for all reels
      if (data && data.length > 0) {
        await fetchReelViews(data.map(r => r.id));
      } else {
        setReelViews({});
        setTotalReelViews(0);
      }
    } catch (err) {
      console.error("fetchReels error:", err.message);
    }
  };

  const fetchReelViews = async (reelIds) => {
    try {
      const { data, error } = await supabase
        .from("reel_views")
        .select("reel_id")
        .in("reel_id", reelIds);

      if (error) {
        // Table might not exist yet — fail silently
        console.warn("reel_views fetch error:", error.message);
        setReelViews({});
        setTotalReelViews(0);
        return;
      }

      const counts = {};
      (data || []).forEach(v => {
        counts[v.reel_id] = (counts[v.reel_id] || 0) + 1;
      });
      setReelViews(counts);
      setTotalReelViews(Object.values(counts).reduce((s, n) => s + n, 0));
    } catch (err) {
      console.error("fetchReelViews error:", err.message);
    }
  };

  const recordReelView = async (reelId) => {
    if (!user) return;
    try {
      await supabase
        .from("reel_views")
        .upsert(
          { reel_id: reelId, viewer_id: user.id, viewed_at: new Date().toISOString() },
          { onConflict: "reel_id,viewer_id" }
        );
      // Update local count immediately
      setReelViews(prev => ({
        ...prev,
        [reelId]: (prev[reelId] || 0) + (prev[reelId] ? 0 : 1),
      }));
    } catch (err) {
      console.error("recordReelView error:", err.message);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, price, image_url, category")
      .eq("worker_id", profileId)
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const fetchFollowData = async () => {
    try {
      const { count } = await supabase
        .from("followers")
        .select("id", { count: "exact" })
        .eq("following_id", profileId);
      setFollowerCount(count || 0);
      if (user && !isOwnProfile) {
        const { data } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profileId)
          .maybeSingle();
        setIsFollowing(!!data);
      }
    } catch (err) {
      console.error("fetchFollowData error:", err.message);
    }
  };

  const fetchRatingData = async () => {
    try {
      const { data } = await supabase
        .from("ratings")
        .select("rating, review, client_id")
        .eq("worker_id", profileId);
      if (data?.length > 0) {
        setAverageRating(data.reduce((sum, r) => sum + r.rating, 0) / data.length);
        setRatingCount(data.length);
      } else {
        setAverageRating(0);
        setRatingCount(0);
      }
      if (user && !isOwnProfile) {
        const myR = data?.find(r => r.client_id === user.id);
        if (myR) { setMyRating(myR.rating); setMyReview(myR.review || ""); }
        else { setMyRating(0); setMyReview(""); }
      }
    } catch (err) {
      console.error("fetchRatingData error:", err.message);
    }
  };

  const fetchProfileViews = async () => {
    try {
      const { count } = await supabase
        .from("profile_views")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId);
      setProfileViews(count || 0);

      if (isOwnProfile) {
        const { data } = await supabase
          .from("profile_views")
          .select(`
            viewer_id, viewed_at,
            profiles!profile_views_viewer_id_fkey(full_name, avatar_url, role)
          `)
          .eq("profile_id", profileId)
          .order("viewed_at", { ascending: false })
          .limit(30);
        setRecentViewers(data || []);
      }
    } catch (err) {
      console.error("fetchProfileViews error:", err.message);
    }
  };

  const recordProfileView = async () => {
    if (!user || isOwnProfile) return;
    try {
      await supabase
        .from("profile_views")
        .upsert(
          { profile_id: profileId, viewer_id: user.id, viewed_at: new Date().toISOString() },
          { onConflict: "profile_id,viewer_id" }
        );
    } catch (err) {
      console.error("recordProfileView error:", err.message);
    }
  };

  const toggleFollow = async () => {
    if (!user || role !== "client") return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("followers").delete()
          .eq("follower_id", user.id).eq("following_id", profileId);
        setIsFollowing(false);
        setFollowerCount(p => Math.max(0, p - 1));
      } else {
        await supabase.from("followers").insert({ follower_id: user.id, following_id: profileId });
        setIsFollowing(true);
        setFollowerCount(p => p + 1);
      }
    } catch (err) {
      console.error("toggleFollow error:", err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const submitRating = async () => {
    if (!user || role !== "client" || myRating === 0) return;
    setRatingSubmitting(true);
    try {
      const { error } = await supabase
        .from("ratings")
        .upsert(
          { client_id: user.id, worker_id: profileId, rating: myRating, review: myReview.trim() || null },
          { onConflict: "client_id,worker_id" }
        );
      if (error) throw error;
      await fetchRatingData();
      setRatingOpen(false);
      showToast("Rating submitted!");
    } catch (err) {
      showToast("Failed to submit: " + err.message, "error");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) { showToast("Please select an image file", "error"); return; }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 5) { showToast("Image too large — max 5MB", "error"); return; }

    const localUrl = URL.createObjectURL(file);
    setProfileImage(localUrl);
    setUploading(true);
    showToast("Uploading...", "warning");

    try {
      const fileExt = file.name.split(".").pop().toLowerCase() || "jpg";
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Clean old files
      const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
      if (existingFiles?.length > 0) {
        await supabase.storage.from("avatars").remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(`${user.id}/${fileName}`, file, {
          cacheControl: "3600", upsert: false, contentType: file.type,
        });
      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/${fileName}`);
      if (!urlData?.publicUrl) throw new Error("Failed to get URL");

      const { error: updateError } = await supabase
        .from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
      if (updateError) throw new Error("Save failed: " + updateError.message);

      const finalUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setProfileImage(finalUrl);
      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      showToast("Profile photo updated! ✅");
    } catch (err) {
      setProfileImage(profile.avatar_url || null);
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  const openEdit = () => {
    setFormData({
      full_name: profile.full_name || "",
      country: profile.country || "",
      bio: profile.bio || "",
    });
    setEditOpen(true);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const saveProfile = async () => {
    if (!formData.full_name?.trim()) { showToast("Name is required", "warning"); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          country: formData.country?.trim() || null,
          bio: formData.bio?.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      setProfile(prev => ({
        ...prev,
        full_name: formData.full_name.trim(),
        country: formData.country?.trim() || null,
        bio: formData.bio?.trim() || null,
      }));
      setEditOpen(false);
      showToast("Profile saved!");
    } catch (err) {
      showToast("Failed to save: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteReel = async (id, videoUrl) => {
    if (!window.confirm("Delete this reel?")) return;
    await supabase.from("reels").delete().eq("id", id);
    if (videoUrl) {
      const fileName = videoUrl.split("/").pop();
      await supabase.storage.from("reels").remove([fileName]);
    }
    const updated = reels.filter(r => r.id !== id);
    setReels(updated);
    setTotalLikes(updated.reduce((s, r) => s + (r.likes || 0), 0));
    const newViews = { ...reelViews };
    delete newViews[id];
    setReelViews(newViews);
    setTotalReelViews(Object.values(newViews).reduce((s, n) => s + n, 0));
    if (viewingReel?.id === id) {
      setViewingReel(null);
      if (reelVideoRef.current) reelVideoRef.current.pause();
    }
  };

  const deleteProduct = async (id, imageUrl) => {
    if (!window.confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    if (imageUrl) {
      const fileName = imageUrl.split("/").pop();
      await supabase.storage.from("products").remove([fileName]);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const renderStars = (rating, interactive = false, size = 18) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar key={star} size={size}
          className={`transition-all ${interactive ? "cursor-pointer active:scale-125" : "cursor-default"} ${
            star <= (interactive ? (hoverRating || myRating) : Math.round(rating))
              ? "text-yellow-400" : "text-white/20"
          }`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && setMyRating(star)}
        />
      ))}
    </div>
  );

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  // Pull to refresh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let startY = 0, currentY = 0, isPulling = false;
    const onStart = (e) => { if (window.scrollY === 0) { startY = e.touches[0].clientY; isPulling = true; } };
    const onMove = (e) => { if (!isPulling) return; currentY = e.touches[0].clientY; container.style.transform = `translateY(${Math.min(Math.max(0, currentY - startY) * 0.55, 75)}px)`; };
    const onEnd = () => {
      if (!isPulling) return;
      const d = currentY - startY; isPulling = false;
      container.style.transition = "transform 380ms cubic-bezier(0.25,1,0.25,1)";
      container.style.transform = "translateY(0)";
      if (d > 105) fetchAll(true);
      setTimeout(() => { container.style.transition = ""; }, 400);
    };
    container.addEventListener("touchstart", onStart, { passive: true });
    container.addEventListener("touchmove", onMove, { passive: true });
    container.addEventListener("touchend", onEnd);
    return () => {
      container.removeEventListener("touchstart", onStart);
      container.removeEventListener("touchmove", onMove);
      container.removeEventListener("touchend", onEnd);
    };
  }, []);

  const setupVideoPlayback = useCallback((reelId, videoEl) => {
    if (!videoEl) return;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouch) {
      videoEl.addEventListener("mouseenter", () => videoEl.play().catch(() => {}));
      videoEl.addEventListener("mouseleave", () => videoEl.pause());
    } else {
      const observer = new IntersectionObserver(
        entries => entries.forEach(e => e.isIntersecting ? videoEl.play().catch(() => {}) : videoEl.pause()),
        { threshold: 0.6 }
      );
      observer.observe(videoEl);
    }
  }, []);

  if (loading && !refreshing) return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 h-14 bg-black/95 backdrop-blur border-b border-white/10" />
      <div className="px-5 pt-8 animate-pulse flex flex-col items-center">
        <div className="w-24 h-24 bg-zinc-800 rounded-3xl" />
        <div className="mt-4 h-6 w-44 bg-zinc-800 rounded-xl" />
        <div className="mt-2 h-4 w-28 bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );

  // Total stats computed
  const totalStats = [
    { value: formatCount(reels.length), label: "Reels" },
    { value: formatCount(totalLikes), label: "Likes", icon: <FaHeart size={9} className="text-red-400 mr-0.5 inline" /> },
    { value: formatCount(totalReelViews), label: "Reel Views", icon: <FaEye size={9} className="text-blue-400 mr-0.5 inline" /> },
    { value: formatCount(followerCount), label: "Followers" },
    { value: formatCount(profileViews), label: "Profile Views", icon: <FaEye size={9} className="text-purple-400 mr-0.5 inline" /> },
  ];

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-black text-white overflow-x-hidden">
      <ToastUI />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 py-3 flex items-center justify-between">
        {paramId ? (
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white transition">←</button>
        ) : <div className="w-8" />}

        <h1 className="font-semibold text-lg">
          {isOwnProfile ? "My Profile" : (profile.full_name || "Profile")}
        </h1>

        <div className="flex items-center gap-1">
          {isOwnProfile && (
            <button onClick={() => navigate("/notifications")}
              className="p-2 text-gray-400 hover:text-white transition">
              <FaBell size={18} />
            </button>
          )}
          {isOwnProfile && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-400 hover:text-white active:scale-90 transition-transform">
              <FaEllipsisV size={18} />
            </button>
          )}
        </div>

        {menuOpen && (
          <div className="absolute right-4 top-14 bg-zinc-900 border border-white/10 rounded-2xl p-2 text-sm z-50 w-44 shadow-xl">
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer"
              onClick={() => { setMenuOpen(false); navigate("/seller-settings"); }}>
              ⚙️ Settings
            </p>
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer text-red-400"
              onClick={async () => { await logout(); navigate("/login"); }}>
              🚪 Logout
            </p>
          </div>
        )}
      </div>

      {/* ── PROFILE INFO ── */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex flex-col items-center">

          {/* Avatar */}
          <div className="relative">
            <div
              className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-green-600 shadow-md cursor-pointer active:scale-95 transition-transform"
              onClick={() => (profileImage || profile.avatar_url) && setViewingProfileImage(true)}
            >
              {uploading ? (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (profileImage || profile.avatar_url) ? (
                <img src={profileImage || profile.avatar_url} alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => setProfileImage(null)} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-5xl font-bold">
                  {profile.full_name?.[0]?.toUpperCase() || "W"}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-2.5 rounded-2xl cursor-pointer active:scale-90 transition-all shadow-md"
              >
                <FaPlus size={13} />
              </button>
            )}
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight">{profile.full_name || "Worker"}</h2>
          {profile.country && <p className="text-emerald-400 text-xs mt-0.5">📍 {profile.country}</p>}
          {profile.bio && (
            <p className="mt-2 text-center text-gray-400 text-xs leading-relaxed max-w-[260px]">{profile.bio}</p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-3">
            {renderStars(averageRating)}
            <span className="text-yellow-400 font-semibold text-sm ml-1">{averageRating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs">({ratingCount})</span>
          </div>

          {/* ── STATS GRID ── */}
          <div className="mt-5 w-full max-w-sm">
            {/* Row 1 — reels, likes, reel views */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {totalStats.slice(0, 3).map((s, i) => (
                <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold">{s.icon}{s.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Row 2 — followers, profile views */}
            <div className="grid grid-cols-2 gap-2">
              {totalStats.slice(3).map((s, i) => (
                <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold">{s.icon}{s.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 mt-5 w-full max-w-sm">
            {isOwnProfile ? (
              <>
                <button onClick={openEdit}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-2.5 rounded-2xl text-xs font-semibold active:scale-[0.96] transition-all flex items-center justify-center gap-1.5">
                  <FaUserEdit size={12} /> Edit Profile
                </button>
                <button onClick={() => navigate("/create-reel")}
                  className="flex-1 bg-white/10 hover:bg-white/15 py-2.5 rounded-2xl text-xs font-semibold active:scale-[0.96] transition-all">
                  🎬 + Reel
                </button>
              </>
            ) : (
              <>
                {!isWorkerViewingWorker ? (
                  <>
                    <button onClick={toggleFollow} disabled={followLoading}
                      className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold active:scale-[0.96] transition-all ${
                        isFollowing ? "bg-zinc-800 hover:bg-zinc-700" : "bg-green-600 hover:bg-green-700"
                      }`}>
                      {followLoading ? "..." : isFollowing ? "Following ✓" : "Follow"}
                    </button>
                    <button onClick={() => setRatingOpen(true)}
                      className="flex-1 py-2.5 bg-yellow-600/10 border border-yellow-600/30 text-yellow-400 hover:bg-yellow-600/20 rounded-2xl text-xs font-semibold active:scale-[0.96] transition-all">
                      ⭐ Rate
                    </button>
                    <button onClick={() => navigate(`/inbox?user=${profileId}`)}
                      className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-2xl text-xs font-semibold active:scale-[0.96] transition-all">
                      💬 Message
                    </button>
                  </>
                ) : (
                  <div className="flex-1 bg-white/5 border border-white/10 py-2.5 rounded-2xl text-xs text-gray-500 text-center">
                    Viewing profile only
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="border-b border-white/10 sticky top-[53px] bg-black z-40 mt-4">
        <div className="flex px-2">
          {[
            { id: "reels", label: `Reels` },
            { id: "products", label: `Products` },
            ...(isOwnProfile ? [{ id: "views", label: `👁 Viewers` }] : []),
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium relative transition-all ${
                activeTab === tab.id ? "text-white" : "text-gray-400"
              }`}>
              {tab.label}
              {tab.id === "reels" && <span className="text-gray-500 text-xs ml-1">({reels.length})</span>}
              {tab.id === "products" && <span className="text-gray-500 text-xs ml-1">({products.length})</span>}
              {tab.id === "views" && <span className="text-gray-500 text-xs ml-1">({profileViews})</span>}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 bg-green-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-3 pb-28">

        {/* REELS GRID */}
        {activeTab === "reels" && (
          <div className="grid grid-cols-3 gap-1.5">
            {reels.length === 0 ? (
              <div className="col-span-3 py-16 text-center">
                <div className="text-5xl mb-2 opacity-20">🎥</div>
                <p className="text-gray-400 text-sm">No reels yet</p>
                {isOwnProfile && (
                  <button onClick={() => navigate("/create-reel")}
                    className="mt-4 bg-green-600 px-5 py-2.5 rounded-2xl text-xs font-semibold active:scale-95">
                    Create First Reel
                  </button>
                )}
              </div>
            ) : reels.map((reel) => (
              <div
                key={reel.id}
                className="group relative aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden hover:scale-[1.02] transition-all active:scale-95 cursor-pointer"
                onClick={() => {
                  setViewingReel(reel);
                  if (!isOwnProfile) recordReelView(reel.id);
                }}
              >
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(reel.id, el);
                      setupVideoPlayback(reel.id, el);
                    }
                  }}
                  src={reel.video_url}
                  className="w-full h-full object-cover"
                  muted loop playsInline
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[12px] border-l-white ml-1" />
                  </div>
                </div>

                {/* Stats overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-[10px] text-white/80">
                        <FaHeart size={9} className="text-red-400" />
                        {formatCount(reel.likes || 0)}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-white/80">
                        <FaEye size={9} className="text-blue-400" />
                        {formatCount(reelViews[reel.id] || 0)}
                      </span>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteReel(reel.id, reel.video_url); }}
                        className="bg-black/60 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      >
                        <FaTrash size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRODUCTS GRID */}
        {activeTab === "products" && (
          <div className="grid grid-cols-2 gap-3">
            {products.length === 0 ? (
              <div className="col-span-2 py-16 text-center">
                <div className="text-5xl mb-2 opacity-20">🛍️</div>
                <p className="text-gray-400 text-sm">No products yet</p>
                {isOwnProfile && (
                  <button onClick={() => navigate("/workstation")}
                    className="mt-4 bg-green-600 px-5 py-2.5 rounded-2xl text-xs font-semibold active:scale-95">
                    Add Products
                  </button>
                )}
              </div>
            ) : products.map((p) => (
              <div
                key={p.id}
                onClick={() => !isWorkerViewingWorker && role === "client" && navigate(`/product/${p.id}`)}
                className={`bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden transition-all ${
                  !isWorkerViewingWorker && role === "client" ? "cursor-pointer hover:border-green-600/40 active:scale-[0.97]" : ""
                }`}
              >
                <div className="h-36 bg-zinc-800">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  }
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold line-clamp-2 mb-1">{p.title}</p>
                  <p className="text-green-400 font-bold text-sm">
                    {p.price ? `₦${Number(p.price).toLocaleString()}` : "Price on request"}
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProduct(p.id, p.image_url); }}
                      className="text-red-400 text-[10px] mt-2 flex items-center gap-1 hover:text-red-300 transition active:scale-95"
                    >
                      <FaTrash size={10} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEWERS TAB — who visited your profile */}
        {activeTab === "views" && isOwnProfile && (
          <div>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FaEye size={14} className="text-purple-400" />
                  <span className="text-2xl font-bold">{formatCount(profileViews)}</span>
                </div>
                <p className="text-xs text-gray-500">Profile Views</p>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FaEye size={14} className="text-blue-400" />
                  <span className="text-2xl font-bold">{formatCount(totalReelViews)}</span>
                </div>
                <p className="text-xs text-gray-500">Reel Views</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Recent Profile Visitors
            </h3>

            {recentViewers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-3 opacity-20">👁</p>
                <p className="text-gray-500 text-sm">No profile visitors yet</p>
                <p className="text-xs text-gray-600 mt-1">Clients who view your profile appear here</p>
                <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
                  <p className="text-xs text-green-400 font-semibold mb-1">🟢 Go Live to get discovered</p>
                  <p className="text-xs text-gray-500 mb-3">Live workers are shown to nearby clients first</p>
                  <button onClick={() => navigate("/workstation")}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition">
                    Go to Workstation →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {recentViewers.map((v) => (
                  <div
                    key={v.viewer_id}
                    onClick={() => navigate(`/seller-profile/${v.viewer_id}`)}
                    className="flex items-center gap-3 bg-zinc-900 border border-white/5 rounded-2xl p-3 hover:border-white/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0 flex items-center justify-center text-lg font-bold">
                      {v.profiles?.avatar_url ? (
                        <img src={v.profiles.avatar_url} alt={v.profiles?.full_name}
                          className="w-full h-full object-cover" />
                      ) : (
                        <span>{v.profiles?.full_name?.[0]?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">
                        {v.profiles?.full_name || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {v.profiles?.role === "client" ? "👤 Client" : "🏢 Business"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 flex-shrink-0">{formatTimeAgo(v.viewed_at)}</p>
                  </div>
                ))}

                {/* CTA at bottom */}
                <div className="mt-4 bg-green-500/5 border border-green-500/20 rounded-2xl p-4 text-center">
                  <p className="text-xs text-green-400 font-semibold mb-1">🟢 Stay Live to get more visitors</p>
                  <p className="text-xs text-gray-500">Live workers are shown first in search results</p>
                  <button onClick={() => navigate("/workstation")}
                    className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition">
                    Go Live Now →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refreshing indicator */}
      {refreshing && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-zinc-900 text-green-400 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs z-50 border border-green-500/30">
          <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          Refreshing...
        </div>
      )}

      {/* EDIT MODAL */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4"
          onClick={() => setEditOpen(false)}>
          <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-base mb-1">Edit Profile</h2>
            <p className="text-xs text-gray-500 mb-4">Update your business information</p>

            <label className="text-xs text-gray-400 block mb-1">Full Name *</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange}
              placeholder="Your name"
              className="w-full p-3 mb-3 rounded-xl bg-white/10 text-sm outline-none focus:ring-1 focus:ring-green-500 transition" />

            <label className="text-xs text-gray-400 block mb-1">Location</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange}
              placeholder="e.g. Lagos, Nigeria"
              className="w-full p-3 mb-3 rounded-xl bg-white/10 text-sm outline-none focus:ring-1 focus:ring-green-500 transition" />

            <label className="text-xs text-gray-400 block mb-1">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange}
              placeholder="Describe your services..." rows={3}
              className="w-full p-3 mb-4 rounded-xl bg-white/10 text-sm outline-none focus:ring-1 focus:ring-green-500 transition resize-none" />

            <div className="flex gap-2">
              <button onClick={() => setEditOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-sm hover:bg-white/20 transition">
                Cancel
              </button>
              <button onClick={saveProfile} disabled={saving || !formData.full_name?.trim()}
                className="flex-1 py-3 rounded-xl bg-green-600 disabled:bg-gray-600 text-sm font-semibold transition">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4"
          onClick={() => setRatingOpen(false)}>
          <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm text-white"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-base mb-1">Rate {profile.full_name}</h2>
            <p className="text-xs text-gray-500 mb-4">Your honest rating helps the community</p>

            <div className="flex justify-center my-5">{renderStars(myRating, true, 36)}</div>

            <p className="text-center text-sm font-medium mb-4 h-5">
              {myRating === 1 && <span className="text-red-400">Poor</span>}
              {myRating === 2 && <span className="text-orange-400">Fair</span>}
              {myRating === 3 && <span className="text-yellow-400">Good</span>}
              {myRating === 4 && <span className="text-green-400">Very Good</span>}
              {myRating === 5 && <span className="text-green-400">Excellent! 🎉</span>}
            </p>

            <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)}
              placeholder="Write a review (optional)..." rows={3}
              className="w-full p-3 mb-4 rounded-xl bg-white/10 text-sm outline-none focus:ring-1 focus:ring-green-500 transition resize-none" />

            <div className="flex gap-2">
              <button onClick={() => setRatingOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-sm hover:bg-white/20 transition">
                Cancel
              </button>
              <button onClick={submitRating} disabled={ratingSubmitting || myRating === 0}
                className="flex-1 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-sm font-semibold transition">
                {ratingSubmitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE IMAGE VIEWER */}
      {viewingProfileImage && (
        <div className="fixed inset-0 bg-black/95 z-[80] flex items-center justify-center p-6"
          onClick={() => setViewingProfileImage(false)}>
          <button className="absolute top-12 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white z-10 text-lg active:scale-90"
            onClick={() => setViewingProfileImage(false)}>✕</button>
          <div className="max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <img src={profileImage || profile.avatar_url} alt={profile.full_name}
              className="w-full aspect-square object-cover rounded-3xl shadow-2xl border-4 border-green-600/40" />
            <p className="text-center text-white font-bold mt-4 text-xl">{profile.full_name}</p>
            {profile.country && <p className="text-center text-emerald-400 text-sm mt-1">📍 {profile.country}</p>}
          </div>
        </div>
      )}

      {/* REEL FULLSCREEN VIEWER */}
      {viewingReel && (
        <div className="fixed inset-0 bg-black z-[70] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-12 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-green-500">
                {(profileImage || profile.avatar_url)
                  ? <img src={profileImage || profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-sm font-bold">
                      {profile.full_name?.[0] || "W"}
                    </div>
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-white">@{profile.full_name}</p>
                {viewingReel.description && (
                  <p className="text-xs text-gray-300 line-clamp-1 max-w-[220px]">{viewingReel.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => { setViewingReel(null); if (reelVideoRef.current) reelVideoRef.current.pause(); }}
              className="p-2 bg-black/50 rounded-full active:scale-90 text-white"
            >✕</button>
          </div>

          {/* Video */}
          <video
            ref={reelVideoRef}
            src={viewingReel.video_url}
            autoPlay loop playsInline controls
            className="w-full h-full object-contain"
          />

          {/* Stats + actions at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm text-white">
                  <FaHeart className="text-red-400" size={14} />
                  {formatCount(viewingReel.likes || 0)}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white">
                  <FaEye className="text-blue-400" size={14} />
                  {formatCount(reelViews[viewingReel.id] || 0)}
                </span>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => { deleteReel(viewingReel.id, viewingReel.video_url); }}
                  className="text-red-400 text-xs bg-red-400/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 border border-red-400/20"
                >
                  <FaTrash size={10} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}