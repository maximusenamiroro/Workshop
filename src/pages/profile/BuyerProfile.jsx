import { useState, useEffect } from "react";
import {
  FaBookmark, FaShoppingBag, FaBox,
  FaEllipsisV, FaUserEdit, FaPlus
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function BuyerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [profile, setProfile] = useState({
    full_name: "",
    country: "",
    avatar_url: "",
    bio: "",
  });

  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchOrders();
    fetchBookings();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, country, avatar_url, bio")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData(data);
      if (data.avatar_url) setProfileImage(data.avatar_url);
    } catch (err) {
      console.error("Fetch profile error:", err.message);
    } finally {
      setLoading(false);
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
      .select("id, job_description, status, created_at, location")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setBookings(data || []);
  };

  const changeProfile = async (e) => {
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

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfileImage(urlData.publicUrl);
      alert("✅ Profile picture updated!");
    } catch (err) {
      console.error("Avatar upload error:", err.message);
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
      console.error("Save profile error:", err.message);
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted": case "delivered": return "text-green-400";
      case "rejected": return "text-red-400";
      default: return "text-yellow-400";
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4">
        <h1 className="font-bold text-lg">Profile</h1>
        <div className="relative">
          <FaEllipsisV
            onClick={() => setMenuOpen(!menuOpen)}
            className="cursor-pointer text-gray-400"
          />
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-[#1a1a1a] border border-white/10 text-white shadow-lg rounded-xl p-2 text-sm z-50 w-36">
              <p
                className="p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                onClick={() => { setMenuOpen(false); navigate("/settings"); }}
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
      </div>

      {/* PROFILE */}
      <div className="flex flex-col items-center mt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-600 bg-white/10 flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-white">
                {profile.full_name?.[0] || "U"}
              </span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full cursor-pointer text-white">
            <FaPlus size={12} />
            <input type="file" accept="image/*" className="hidden" onChange={changeProfile} />
          </label>
        </div>

        <h2 className="font-bold text-lg mt-3">{profile.full_name || "Your Name"}</h2>
        <p className="text-gray-500 text-sm">{profile.country || ""}</p>
        {profile.bio && (
          <p className="text-gray-400 text-sm mt-1 text-center px-8">{profile.bio}</p>
        )}

        <button
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition"
          onClick={() => setEditOpen(true)}
        >
          <FaUserEdit />
          Edit Profile
        </button>
      </div>

      {/* TABS */}
      <div className="flex justify-around mt-6 border-t border-gray-800 pt-3">
        <Tab icon={<FaBox />} label="Orders" active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
        <Tab icon={<FaShoppingBag />} label="Bookings" active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} />
        <Tab icon={<FaBookmark />} label="Saved" active={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
      </div>

      {/* TAB CONTENT */}
      <div className="p-4">
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No orders yet</p>
                <button
                  onClick={() => navigate("/shop")}
                  className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{o.product_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${getStatusColor(o.status)}`}>
                      {o.status || "pending"}
                    </p>
                    <p className="text-xs text-gray-400">
                      ₦{Number(o.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No bookings yet</p>
                <button
                  onClick={() => navigate("/hire-worker")}
                  className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  Hire a Worker
                </button>
              </div>
            ) : (
              bookings.map(b => (
                <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{b.job_description || "Job Request"}</p>
                    <p className="text-xs text-gray-500">📍 {b.location}</p>
                    <p className="text-xs text-gray-500">{formatDate(b.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    b.status === "accepted" ? "bg-green-500/20 text-green-400" :
                    b.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {b.status || "pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <p className="text-gray-500 text-sm text-center py-8">Saved items coming soon</p>
        )}
      </div>

      {/* EDIT MODAL */}
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
    </div>
  );
}

function Tab({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer flex flex-col items-center gap-1 ${
        active ? "text-green-400" : "text-gray-500"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}