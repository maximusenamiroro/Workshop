import { useState } from "react";
import {
  FaUser, FaBell, FaStore, FaShoppingCart,
  FaLock, FaQuestionCircle, FaSignOutAlt,
  FaGlobe, FaUserPlus, FaChevronRight
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function SellerSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    promotions: false,
    bookings: true,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Please fill in both fields");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      alert("✅ Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const Toggle = ({ label, value, onChange }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={onChange}
        className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
          value ? "bg-green-500" : "bg-gray-600"
        }`}
      >
        <div className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
          value ? "translate-x-5" : ""
        }`} />
      </button>
    </div>
  );

  const Row = ({ icon, label, onClick, danger }) => (
    <div
      onClick={onClick}
      className={`flex justify-between items-center py-4 border-b border-white/5 cursor-pointer hover:bg-white/5 px-1 rounded-lg transition ${
        danger ? "text-red-400" : "text-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <FaChevronRight className="text-gray-600 text-xs" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20">

      {/* HEADER */}
      <div className="px-5 py-6 border-b border-zinc-800 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400">←</button>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto space-y-6">

        {/* ACCOUNT */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <FaUser /> Account
          </h3>
          <Row
            icon={<FaLock />}
            label="Change Password"
            onClick={() => setShowPasswordModal(true)}
          />
          <Row
            icon={<FaUser />}
            label="Edit Profile"
            onClick={() => navigate("/seller-profile")}
          />
          <div className="py-3 border-b border-white/5">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm text-gray-300 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* STORE SETTINGS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <FaStore /> Workstation Settings
          </h3>
          <Row
            icon={<FaStore />}
            label="Manage Products"
            onClick={() => navigate("/workstation")}
          />
          <Row
            icon={<FaShoppingCart />}
            label="View Bookings"
            onClick={() => navigate("/Bookings")}
          />
        </div>

        {/* NOTIFICATIONS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <FaBell /> Notifications
          </h3>
          <Toggle
            label="Booking Notifications"
            value={notifications.bookings}
            onChange={() => toggleNotification("bookings")}
          />
          <Toggle
            label="Order Notifications"
            value={notifications.orders}
            onChange={() => toggleNotification("orders")}
          />
          <Toggle
            label="Message Notifications"
            value={notifications.messages}
            onChange={() => toggleNotification("messages")}
          />
          <Toggle
            label="Promotions"
            value={notifications.promotions}
            onChange={() => toggleNotification("promotions")}
          />
        </div>

        {/* HELP */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <FaQuestionCircle /> Help & Support
          </h3>
          <Row icon={<FaQuestionCircle />} label="Help Center" onClick={() => {}} />
          <Row icon={<FaGlobe />} label="Report a Problem" onClick={() => {}} />
        </div>

        {/* INVITE */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <FaUserPlus /> Invite
          </h3>
          <Row
            icon={<FaUserPlus />}
            label="Invite a Friend"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "Workshop",
                  text: "Join Workshop — connect with workers and clients!",
                  url: window.location.origin,
                });
              } else {
                navigator.clipboard.writeText(window.location.origin);
                alert("Link copied to clipboard!");
              }
            }}
          />
        </div>

        {/* LOGOUT */}
        <div
          onClick={handleLogout}
          className="bg-white/5 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 font-medium cursor-pointer hover:bg-red-500/10 transition"
        >
          <FaSignOutAlt />
          Log Out
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-sm text-white">
            <h2 className="font-bold text-lg mb-4">Change Password</h2>
            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full p-3 mb-3 rounded-xl bg-white/10 text-white outline-none text-sm"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full p-3 mb-3 rounded-xl bg-white/10 text-white outline-none text-sm"
            />
            {passwordError && (
              <p className="text-red-400 text-xs mb-3">{passwordError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordError(""); }}
                className="flex-1 py-2 rounded-xl bg-white/10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-sm font-semibold transition"
              >
                {passwordLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}