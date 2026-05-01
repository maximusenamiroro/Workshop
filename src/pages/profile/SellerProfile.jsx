import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaUserEdit, FaEllipsisV, FaPlus, FaTrash, FaStar, FaArrowLeft
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast"
export default function SellerProfile() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { id: paramId } = useParams();

  const profileId = paramId || user?.id;
  const isOwnProfile = !paramId || paramId === user?.id;

  const [activeTab, setActiveTab] = useState("reels");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [reels, setReels] = useState([]);
  const [products, setProducts] = useState([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const { showToast, ToastUI } = useToast();
  const [viewingReel, setViewingReel] = useState(null);
const reelVideoRef = useRef(null);

  const [profile, setProfile] = useState({
    full_name: "", country: "", avatar_url: "", bio: "",
  });
  const [formData, setFormData] = useState(profile);

  const containerRef = useRef(null);
  const videoRefs = useRef(new Map());

  useEffect(() => {
    if (!profileId) return;
    fetchAll();
  }, [profileId]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    await Promise.all([
      fetchProfile(),
      fetchReels(),
      fetchProducts(),
      fetchFollowData(),
      fetchRatingData(),
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
        setFormData(data);
        if (data.avatar_url) setProfileImage(data.avatar_url);
      }
    } catch (err) {
      console.error("Fetch profile error:", err.message);
    }
  };

  const fetchReels = async () => {
    const { data } = await supabase
      .from("reels")
      .select("id, video_url, description, likes, created_at")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });
    setReels(data || []);
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
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
        setRatingCount(data.length);
      } else {
        setAverageRating(0);
        setRatingCount(0);
      }

      if (user && !isOwnProfile) {
        const myR = data?.find(r => r.client_id === user.id);
        if (myR) {
          setMyRating(myR.rating);
          setMyReview(myR.review || "");
        } else {
          setMyRating(0);
          setMyReview("");
        }
      }
    } catch (err) {
      console.error("fetchRatingData error:", err.message);
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

  // FIXED & WORKING RATING
  const submitRating = async () => {
    if (!user || role !== "client" || myRating === 0) return;

    setRatingSubmitting(true);
    try {
      const { error } = await supabase
        .from("ratings")
        .upsert(
          {
            client_id: user.id,
            worker_id: profileId,
            rating: myRating,
            review: myReview.trim() || null,
          },
          { onConflict: "client_id,worker_id" }
        );

      if (error) throw error;

      await fetchRatingData();
      setRatingOpen(false);
      alert("✅ Rating submitted!");
    } catch (err) {
      console.error("submitRating error:", err.message);
      alert("Failed to submit rating: " + (err.message || "Unknown error"));
    } finally {
      setRatingSubmitting(false);
    }
  };

const changeProfileImage = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate
  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file", "error");
    return;
  }
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 5) {
    showToast(`Image is ${sizeMB.toFixed(1)}MB — please use an image under 5MB`, "error");
    return;
  }

  // Show preview immediately
  const previewUrl = URL.createObjectURL(file);
  setProfileImage(previewUrl);
  showToast("Uploading...", "warning");

  try {
    const fileExt = file.name.split(".").pop().toLowerCase();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Add cache buster so it shows the new image immediately
    const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setProfileImage(freshUrl);
    showToast("Profile picture updated!");
  } catch (err) {
    setProfileImage(profile.avatar_url || null); // revert on fail
    showToast("Failed to upload: " + err.message, "error");
  }
};

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          country: formData.country || null,
          bio: formData.bio || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      setProfile(formData);
      setEditOpen(false);
      showToast("✅ Profile saved!");
    } catch (err) {
     showToast("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteReel = async (id, videoUrl) => {
    await supabase.from("reels").delete().eq("id", id);
    if (videoUrl) {
      const fileName = videoUrl.split("/").pop();
      await supabase.storage.from("reels").remove([fileName]);
    }
    fetchReels();
  };

  const deleteProduct = async (id, imageUrl) => {
    await supabase.from("products").delete().eq("id", id);
    if (imageUrl) {
      const fileName = imageUrl.split("/").pop();
      await supabase.storage.from("products").remove([fileName]);
    }
    fetchProducts();
  };

  const renderStars = (rating, interactive = false, size = 18) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={size}
          className={`transition-all duration-200 ${
            interactive ? "cursor-pointer active:scale-125" : "cursor-default"
          } ${
            star <= (interactive ? (hoverRating || myRating) : Math.floor(rating))
              ? "text-yellow-400" : "text-white/20"
          }`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && setMyRating(star)}
        />
      ))}
    </div>
  );

  // Pull to Refresh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0, currentY = 0, isPulling = false;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;
      currentY = e.touches[0].clientY;
      const pull = Math.max(0, currentY - startY);
      container.style.transform = `translateY(${Math.min(pull * 0.55, 75)}px)`;
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      const pullDistance = currentY - startY;
      isPulling = false;
      container.style.transition = "transform 380ms cubic-bezier(0.25, 1, 0.25, 1)";
      container.style.transform = "translateY(0)";
      if (pullDistance > 105) fetchAll(true);
      setTimeout(() => { container.style.transition = ""; }, 400);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const setupVideoPlayback = useCallback((reelId, videoEl) => {
    if (!videoEl) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) {
      const play = () => videoEl.play().catch(() => {});
      const pause = () => videoEl.pause();
      videoEl.addEventListener("mouseenter", play);
      videoEl.addEventListener("mouseleave", pause);
    } else {
      const observer = new IntersectionObserver(
        (entries) => entries.forEach(e => e.isIntersecting ? videoEl.play().catch(() => {}) : videoEl.pause()),
        { threshold: 0.6 }
      );
      observer.observe(videoEl);
    }
  }, []);

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 h-14 bg-black/95 backdrop-blur border-b border-white/10" />
        <div className="px-5 pt-8 animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-zinc-800 rounded-3xl" />
          <div className="mt-4 h-6 w-44 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
   <div ref={containerRef} className="h-full overflow-y-auto bg-black text-white  overflow-x-hidden">

      {/* HEADER - Compact */}
     <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="w-8" />
        <h1 className="font-semibold text-lg">My Profile</h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-400 hover:text-white active:scale-90 transition-transform"
        >
          <FaEllipsisV size={19} />
        </button>

        {menuOpen && (
          <div className="absolute right-4 top-14 bg-zinc-900 border border-white/10 rounded-2xl p-2 text-sm z-50 w-40 shadow-xl">
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer" onClick={() => { setMenuOpen(false); navigate("/settings"); }}>
              ⚙️ Settings
            </p>
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer text-red-400" onClick={async () => { await logout(); navigate("/login"); }}>
              🚪 Logout
            </p>
          </div>
        )}
          {menuOpen && (
          <div className="absolute right-4 top-14 bg-zinc-900 border border-white/10 rounded-2xl p-2 text-sm z-50 w-40 shadow-xl">
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer" onClick={() => { setMenuOpen(false); navigate("/seller-settings"); }}>⚙️ Settings</p>
            <p className="p-3 hover:bg-white/10 rounded-xl cursor-pointer text-red-400" onClick={async () => { await logout(); navigate("/login"); }}>🚪 Logout</p>
          </div>
        )}
      </div>

      {/* PROFILE INFO - Reduced Size */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-green-600 shadow-md transition-all group-hover:scale-105">
              {(profileImage || profile.avatar_url) ? (
                <img src={profileImage || profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-5xl font-bold">
                  {profile.full_name?.[0] || "W"}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute -bottom-1 -right-1 bg-green-600 p-2.5 rounded-2xl cursor-pointer active:scale-90">
                <FaPlus size={13} />
                <input type="file" accept="image/*" className="hidden" onChange={changeProfileImage} />
              </label>
            )}
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight">{profile.full_name || "Worker"}</h2>
          {profile.country && <p className="text-emerald-400 text-xs mt-0.5">📍 {profile.country}</p>}
          {profile.bio && <p className="mt-3 text-center text-gray-400 text-xs leading-relaxed max-w-[240px]">{profile.bio}</p>}

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-4">
            {renderStars(averageRating)}
            <span className="text-yellow-400 font-medium text-base ml-1">{averageRating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs">({ratingCount})</span>
          </div>

          {/* Stats - Compact */}
          <div className="mt-6 grid grid-cols-4 gap-5 w-full max-w-xs text-center">
            {[
              { value: reels.length, label: "Reels" },
              { value: products.length, label: "Products" },
              { value: followerCount, label: "Followers" },
              { value: reels.reduce((s, r) => s + (r.likes || 0), 0), label: "Likes" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-xl font-bold tracking-tighter">{s.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

      {/* Action Buttons - Narrower Width */}
<div className="flex gap-3 mt-7 px-5 justify-center">
  {isOwnProfile ? (
    <>
      <button
        onClick={() => setEditOpen(true)}
        className="flex-1 max-w-[140px] bg-green-600 py-2.5 rounded-2xl text-xs font-medium active:scale-[0.96] transition-all"
      >
        ✏️ Edit
      </button>
      <button
        onClick={() => navigate("/create-reel")}
        className="flex-1 max-w-[140px] bg-white/10 py-2.5 rounded-2xl text-xs font-medium active:scale-[0.96] transition-all"
      >
        + Reel
      </button>
    </>
  ) : (
    <>
      {role === "client" && (
        <>
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={`flex-1 max-w-[140px] py-2.5 rounded-2xl text-xs font-medium active:scale-[0.96] transition-all ${
              isFollowing ? "bg-zinc-800" : "bg-green-600"
            }`}
          >
            {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
          </button>
          <button
            onClick={() => setRatingOpen(true)}
            className="flex-1 max-w-[140px] py-2.5 bg-yellow-600/10 border border-yellow-600/30 text-yellow-400 rounded-2xl text-xs font-medium active:scale-[0.96] transition-all"
          >
            ⭐ Rate
          </button>
        </>
      )}
      <button
        onClick={() => navigate(`/inbox?user=${profileId}`)}
        className="flex-1 max-w-[140px] py-2.5 bg-white/10 rounded-2xl text-xs font-medium active:scale-[0.96] transition-all"
      >
        Message
      </button>
    </>
  )}
</div>
      </div>

      {/* TABS - Slim */}
      <div className="border-b border-white/10 sticky top-[53px] bg-black z-40">
        <div className="flex px-5">
          {["reels", "products"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-medium relative transition-all ${
                activeTab === tab ? "text-white" : "text-gray-400"
              }`}
            >
              {tab === "reels" ? "Reels" : "Products"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-green-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT - Compact */}
      <div className="p-4 pt-4">
        {activeTab === "reels" && (
          <div className="grid grid-cols-3 gap-2">
            {reels.length === 0 ? (
              <div className="col-span-3 py-12 text-center">
                <div className="text-5xl mb-2 opacity-30">🎥</div>
                <p className="text-gray-400 text-xs">No reels yet</p>
                {isOwnProfile && (
                  <button onClick={() => navigate("/create-reel")} className="mt-4 bg-green-600 px-5 py-2 rounded-2xl text-xs font-medium">
                    Create Reel
                  </button>
                )}
              </div>
            ) : (
              reels.map((reel, i) => (
                <div
                  key={reel.id}
                  className="group relative aspect-square bg-zinc-900 rounded-xl overflow-hidden hover:scale-105 transition-all active:scale-95"
                >
                  <video
                    ref={(el) => el && setupVideoPlayback(reel.id, el)}
                    src={reel.video_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                  {isOwnProfile && (
                    <button
                      onClick={() => deleteReel(reel.id, reel.video_url)}
                      className="absolute top-1.5 right-1.5 bg-black/70 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 px-1.5 py-px rounded">❤️ {reel.likes || 0}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid grid-cols-2 gap-3">
            {products.length === 0 ? (
              <div className="col-span-2 py-12 text-center">
                <div className="text-5xl mb-2 opacity-30">🛍️</div>
                <p className="text-gray-400 text-xs">No products yet</p>
                {isOwnProfile && (
                  <button onClick={() => navigate("/workstation")} className="mt-4 bg-green-600 px-5 py-2 rounded-2xl text-xs font-medium">
                    Add Product
                  </button>
                )}
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-green-600/40 transition-all cursor-pointer active:scale-[0.97]"
                >
                  <div className="h-36 bg-zinc-800">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium line-clamp-2">{p.title}</p>
                    <p className="text-green-400 font-bold text-sm mt-1">₦{Number(p.price).toLocaleString()}</p>
                    {isOwnProfile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProduct(p.id, p.image_url); }}
                        className="text-red-400 text-[10px] mt-1 flex items-center gap-1"
                      >
                        <FaTrash size={11} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Refreshing Indicator */}
      {refreshing && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-zinc-900 text-green-400 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs z-50 border border-green-500/30">
          <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          Refreshing...
        </div>
      )}

      {/* EDIT MODAL - Compact */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm">
            <h2 className="font-bold text-base mb-4">Edit Profile</h2>
            <input type="text" name="full_name" value={formData.full_name || ""} onChange={handleChange} placeholder="Full Name" className="w-full p-3 mb-3 rounded-xl bg-white/10 text-sm" />
            <input type="text" name="country" value={formData.country || ""} onChange={handleChange} placeholder="Country" className="w-full p-3 mb-3 rounded-xl bg-white/10 text-sm" />
            <textarea name="bio" value={formData.bio || ""} onChange={handleChange} placeholder="Bio" rows={2} className="w-full p-3 mb-4 rounded-xl bg-white/10 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setEditOpen(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-sm">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-green-600 disabled:bg-gray-600 text-sm font-medium">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL - Compact */}
      {ratingOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm text-white">
            <h2 className="font-bold text-base mb-2">Rate {profile.full_name}</h2>

            <div className="flex justify-center my-4">
              {renderStars(myRating, true, 34)}
            </div>

            <p className="text-center text-xs text-gray-400 mb-4">
              {myRating === 1 && "Poor"} {myRating === 2 && "Fair"} {myRating === 3 && "Good"}
              {myRating === 4 && "Very Good"} {myRating === 5 && "Excellent!"} 
              {myRating === 0 && "Tap a star to rate"}
            </p>

            <textarea
              value={myReview}
              onChange={(e) => setMyReview(e.target.value)}
              placeholder="Review (optional)"
              rows={2}
              className="w-full p-3 mb-4 rounded-xl bg-white/10 text-sm"
            />

            <div className="flex gap-2">
              <button onClick={() => setRatingOpen(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-sm">Cancel</button>
              <button
                onClick={submitRating}
                disabled={ratingSubmitting || myRating === 0}
                className="flex-1 py-2.5 rounded-xl bg-yellow-600 disabled:bg-gray-600 text-sm font-medium transition"
              >
                {ratingSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REEL VIEWER — for viewing own reels fullscreen */}
{viewingReel && (
  <div className="fixed inset-0 bg-black z-[70] flex flex-col">
    <div className="flex items-center justify-between p-4 pt-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-green-500">
          {(profileImage || profile.avatar_url) ? (
            <img src={profileImage || profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
              {profile.full_name?.[0] || "W"}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">@{profile.full_name}</p>
          {viewingReel.description && (
            <p className="text-xs text-gray-400 line-clamp-1">{viewingReel.description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          setViewingReel(null);
          if (reelVideoRef.current) reelVideoRef.current.pause();
        }}
        className="p-2 text-white/70 active:scale-90"
      >
        ✕
      </button>
    </div>

    <div className="flex-1 relative bg-black">
      <video
        ref={reelVideoRef}
        src={viewingReel.video_url}
        autoPlay
        loop
        playsInline
        controls
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">❤️ {viewingReel.likes || 0} likes</span>
          {isOwnProfile && (
            <button
              onClick={() => {
                setViewingReel(null);
                deleteReel(viewingReel.id, viewingReel.video_url);
              }}
              className="ml-auto text-red-400 text-xs bg-red-400/10 px-3 py-1 rounded-full"
            >
              🗑 Delete Reel
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}