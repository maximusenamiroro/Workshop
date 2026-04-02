import { useState } from "react";
import {
  FaUser,
  FaStore,
  FaShoppingCart,
  FaBell,
  FaLock,
  FaQuestionCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b font-semibold text-black">
      {icon}
      {title}
    </div>
    {children}
  </div>
);

const Row = ({ label, onClick, isLink = false }) => (
  <div
    onClick={onClick}
    className={`flex justify-between items-center px-5 py-4 border-b last:border-none 
      hover:bg-gray-50 cursor-pointer transition-colors ${
        isLink ? "text-black" : ""
      }`}
  >
    <span className="text-black">{label}</span>
    {isLink && <span className="text-gray-400">›</span>}
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <div className="flex justify-between items-center px-5 py-4 border-b last:border-none">
    <span className="text-black">{label}</span>

    <button
      onClick={onChange}
      className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
        value ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
          value ? "translate-x-5" : ""
        }`}
      />
    </button>
  </div>
);

export default function SellerSettings() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    promotions: false,
    email: true,
  });

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 text-2xl text-black"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-black">Settings</h1>
      </div>

      {/* Account Section */}
      <Section title="Account" icon={<FaUser className="text-black" />}>
        <Row label="Edit Profile" isLink onClick={() => navigate("/seller/edit-profile")} />
        <Row label="Change Password" isLink onClick={() => navigate("/seller/change-password")} />
        <Row label="Phone Number" isLink onClick={() => navigate("/seller/phone")} />
        <Row label="Email Address" isLink onClick={() => navigate("/seller/email")} />
        <Row label="Two-Factor Authentication" isLink onClick={() => navigate("/seller/2fa")} />
      </Section>

      {/* Workshop / Store Section */}
      <Section title="Workshop / Store Settings" icon={<FaStore className="text-black" />}>
        <Row label="Workshop Name" isLink onClick={() => navigate("/seller/workshop-name")} />
        <Row label="Workshop Description" isLink onClick={() => navigate("/seller/workshop-description")} />
        <Row label="Workshop Location" isLink onClick={() => navigate("/seller/location")} />
        <Row label="Business Hours" isLink onClick={() => navigate("/seller/business-hours")} />
        <Row label="Workshop Logo" isLink onClick={() => navigate("/seller/logo")} />
      </Section>

      {/* Orders & Sales Section */}
      <Section title="Orders & Sales" icon={<FaShoppingCart className="text-black" />}>
        <Row label="Order History" isLink onClick={() => navigate("/seller/orders")} />
        <Row label="Sales Analytics" isLink onClick={() => navigate("/seller/analytics")} />
        <Row label="Shipping Settings" isLink onClick={() => navigate("/seller/shipping")} />
        <Row label="Payment Methods" isLink onClick={() => navigate("/seller/payments")} />
      </Section>

      {/* Notifications Section */}
      <Section title="Notifications" icon={<FaBell className="text-black" />}>
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
          label="Promotion Notifications"
          value={notifications.promotions}
          onChange={() => toggleNotification("promotions")}
        />
        <Toggle
          label="Email Alerts"
          value={notifications.email}
          onChange={() => toggleNotification("email")}
        />
      </Section>

      {/* Privacy & Security */}
      <Section title="Privacy & Security" icon={<FaLock className="text-black" />}>
        <Row label="Change Password" isLink onClick={() => navigate("/seller/change-password")} />
        <Row label="Login Activity" isLink onClick={() => navigate("/seller/login-activity")} />
        <Row label="Blocked Users" isLink onClick={() => navigate("/seller/blocked-users")} />
        <Row label="Data & Privacy" isLink onClick={() => navigate("/seller/privacy")} />
      </Section>

      {/* Help & Support */}
      <Section title="Help & Support" icon={<FaQuestionCircle className="text-black" />}>
        <Row label="Help Center" isLink onClick={() => navigate("/seller/help")} />
        <Row label="Report a Problem" isLink onClick={() => navigate("/seller/report")} />
        <Row label="Contact Support" isLink onClick={() => navigate("/seller/contact")} />
      </Section>

      {/* Logout */}
      <div
        onClick={() => {
          // Add your logout logic here later
          alert("Logged out successfully");
          navigate("/login");
        }}
        className="bg-white rounded-xl shadow p-5 flex items-center gap-3 text-red-600 font-medium cursor-pointer hover:bg-red-50 transition-colors mt-4"
      >
        <FaSignOutAlt />
        Log Out
      </div>
    </div>
  );
}