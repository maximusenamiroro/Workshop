import { useState, useEffect } from "react";
import {
  FaUserEdit, FaEllipsisV, FaPlus, FaTrash, FaStar
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function SellerProfile() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  // Support viewing other workers profiles via /seller-profile/:id
  const { id: paramId } = useParams();
  const profileId = paramId || user?.id;
  const isOwnProfile = !paramId || paramId === user?.id;

  const [activeTab, setActiveTab] = useState("reels");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [reels, setReels] = useState([]);
  const [products, setProducts] = useState([]);

  // Follow & Rating state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const [profile, setProfile] = useState({
    full_name: "",
    country: "",
    avatar_url: "",
    bio: "",
  });
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    if (!profileId) return;
    fetchAll();
  }, [profileId, user]);

  const fetchAll = async () => {
    await Promise.all([
      fetchProfile(),
      fetchReels(),
      fetchProducts(),
      fetchFollowData(),
      fetchRatingData(),
    ]);
    setLoading(false);
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
      // Get follower count
      const { count } = await supabase
        .from("followers")
        .select("id", { count: "exact" })
        .eq("following_id", profileId);

      setFollowerCount(count || 0);

      // Check if current user follows this worker
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
      // Get all ratings for this worker
      const { data } = await supabase
        .from("ratings")
        .select("rating, review, client_id")
        .eq("worker_id", profileId);

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
        setRatingCount(data.length);
      }

      // Get current user's rating if any
      if (user && !isOwnProfile) {
        const myR = data?.find(r => r.client_id === user.id);
        if (myR) {
          setMyRating(myR.rating);
          setMyReview(myR.review || "");
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
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileId);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("followers")
          .insert({ follower_id: user.id, following_id: profileId });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
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
      await supabase
        .from("ratings")
        .upsert({
          client_id: user.id,
          worker_id: profileId,
          rating: myRating,
          review: myReview.trim() || null,
        });

      await fetchRatingData();
      setRatingOpen(false);
      alert("✅ Rating submitted!");
    } catch (err) {
      console.error("submitRating error:", err.message);
      alert("Failed to submit rating: " + err.message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const changeProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setProfileImage(URL.createObjectURL(file));
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
      setProfileImage(urlData.publicUrl);
      alert("✅ Profile picture updated!");
    } catch (err) {
      alert("Failed to upload: " + err.message);
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
      alert("✅ Profile saved!");
    } catch (err) {
      alert("Failed to save: " + err.message);
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

  const renderStars = (rating, interactive = false, size = 20) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={size}
            className={`cursor-${interactive ? "pointer" : "default"} transition-colors ${
              star <= (interactive ? (hoverRating || myRating) : rating)
                ? "text-yellow-400"
                : "text-white/20"
            }`}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setMyRating(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20">

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md flex justify-between items-center px-4 py-4 border-b border-white/10">
        {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            ←
          </button>
        )}
        <h1 className="font-bold text-lg flex-1 text-center">
          {isOwnProfile ? "Profile" : profile.full_name}
        </h1>
        {isOwnProfile && (
          <div className="relative">
            <FaEllipsisV
              className="cursor-pointer text-gray-400"
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 text-sm z-50 w-36">
                <p
                  className="p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                  onClick={() => { setMenuOpen(false); navigate("/seller-settings"); }}
                >
                  Settings
                </p>
                <p
                  className="p-2 hover:bg-white/10 rounded-lg cursor-pointer text-red-400"
                  onClick={async () => { await logout(); navigate("/login"); }}
                >
                  Logout
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROFILE INFO */}
      <div className="flex flex-col items-center px-4 py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-600 bg-white/10 flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold">{profile.full_name?.[0] || "W"}</span>
            )}
          </div>
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full cursor-pointer">
              <FaPlus size={10} />
              <input type="file" accept="image/*" className="hidden" onChange={changeProfileImage} />
            </label>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold">{profile.full_name || "Worker"}</h3>
        <p className="text-white/60 text-sm mt-1 text-center px-8">{profile.bio || ""}</p>
        <p className="text-gray-500 text-xs mt-1">{profile.country || ""}</p>

        {/* RATING DISPLAY */}
        <div className="flex items-center gap-2 mt-3">
          {renderStars(averageRating)}
          <span className="text-yellow-400 font-semibold text-sm">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </span>
          <span className="text-gray-500 text-xs">({ratingCount} reviews)</span>
        </div>

        {/* STATS */}
        <div className="flex gap-10 mt-4 text-center">
          <div>
            <p className="font-bold">{reels.length}</p>
            <span className="text-xs text-white/50">Reels</span>
          </div>
          <div>
            <p className="font-bold">{products.length}</p>
            <span className="text-xs text-white/50">Products</span>
          </div>
          <div>
            <p className="font-bold">{followerCount}</p>
            <span className="text-xs text-white/50">Followers</span>
          </div>
          <div>
            <p className="font-bold">
              {reels.reduce((sum, r) => sum + (r.likes || 0), 0)}
            </p>
            <span className="text-xs text-white/50">Likes</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mt-4 w-full max-w-xs">
          {isOwnProfile ? (
            <>
              <button
                onClick={() => setEditOpen(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition"
              >
                <FaUserEdit />
                Edit Profile
              </button>
              <button
                onClick={() => navigate("/create-reel")}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm font-semibold transition"
              >
                + Reel
              </button>
            </>
          ) : (
            <>
              {/* Follow button — only for clients */}
              {role === "client" && (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${
                    isFollowing
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {followLoading ? "..." : isFollowing ? "Following ✓" : "Follow"}
                </button>
              )}

              {/* Rate button — only for clients */}
              {role === "client" && (
                <button
                  onClick={() => setRatingOpen(true)}
                  className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 py-2 rounded-xl text-sm font-semibold transition border border-yellow-600/30"
                >
                  ⭐ {myRating > 0 ? "Edit Rating" : "Rate"}
                </button>
              )}

              {/* Message button */}
              <button
                onClick={() => navigate(`/inbox?user=${profileId}`)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm font-semibold transition"
              >
                💬 Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-around border-y border-white/10 py-3 text-sm">
        <button
          onClick={() => setActiveTab("reels")}
          className={activeTab === "reels" ? "font-semibold text-white" : "text-white/40"}
        >
          Reels
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={activeTab === "products" ? "font-semibold text-white" : "text-white/40"}
        >
          Products
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {activeTab === "reels" && (
          <div className="grid grid-cols-3 gap-2">
            {reels.length === 0 ? (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500 text-sm">No reels yet</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate("/create-reel")}
                    className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    Create Reel
                  </button>
                )}
              </div>
            ) : (
              reels.map(r => (
                <div key={r.id} className="relative aspect-square bg-white/10 rounded-xl overflow-hidden">
                  <video src={r.video_url} className="w-full h-full object-cover" muted />
                  {isOwnProfile && (
                    <button
                      onClick={() => deleteReel(r.id, r.video_url)}
                      className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-red-400"
                    >
                      <FaTrash size={10} />
                    </button>
                  )}
                  <div className="absolute bottom-1 left-1 text-xs text-white/70">
                    ❤️ {r.likes || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid grid-cols-2 gap-3">
            {products.length === 0 ? (
              <div className="col-span-2 text-center py-10">
                <p className="text-gray-500 text-sm">No products yet</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate("/workstation")}
                    className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    Add Product
                  </button>
                )}
              </div>
            ) : (
              products.map(p => (
                <div
                  key={p.id}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <div className="w-full h-32 bg-white/10 flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-green-400 text-xs font-bold">
                      ₦{Number(p.price).toLocaleString()}
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProduct(p.id, p.image_url); }}
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <FaTrash size={10} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-sm text-white">
            <h2 className="font-bold text-lg mb-4">Edit Profile</h2>
            <input
              type="text"
              name="full_name"
              value={formData.full_name || ""}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-3 mb-3 rounded-xl bg-white/10 text-white outline-none text-sm"
            />
            <input
              type="text"
              name="country"
              value={formData.country || ""}
              onChange={handleChange}
              placeholder="Country"
              className="w-full p-3 mb-3 rounded-xl bg-white/10 text-white outline-none text-sm"
            />
            <textarea
              name="bio"
              value={formData.bio || ""}
              onChange={handleChange}
              placeholder="Bio (optional)"
              rows={2}
              className="w-full p-3 mb-3 rounded-xl bg-white/10 text-white outline-none text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-sm font-semibold transition"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-sm text-white">
            <h2 className="font-bold text-lg mb-2">Rate {profile.full_name}</h2>
            <p className="text-gray-400 text-sm mb-4">
              How was your experience with this worker?
            </p>

            {/* Star selector */}
            <div className="flex justify-center mb-4">
              {renderStars(myRating, true, 32)}
            </div>

            <p className="text-center text-sm text-gray-400 mb-4">
              {myRating === 1 && "Poor"}
              {myRating === 2 && "Fair"}
              {myRating === 3 && "Good"}
              {myRating === 4 && "Very Good"}
              {myRating === 5 && "Excellent!"}
              {myRating === 0 && "Tap a star to rate"}
            </p>

            <textarea
              value={myReview}
              onChange={(e) => setMyReview(e.target.value)}
              placeholder="Write a review (optional)..."
              rows={3}
              className="w-full p-3 mb-4 rounded-xl bg-white/10 text-white outline-none text-sm"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRatingOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={ratingSubmitting || myRating === 0}
                className="flex-1 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-sm font-semibold transition"
              >
                {ratingSubmitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}