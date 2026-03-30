import { useState } from "react";
import {
  FaUser,
  FaStore,
  FaShoppingCart,
  FaBell,
  FaLock,
  FaQuestionCircle,
  FaSignOutAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow mb-5 overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b font-semibold text-gray-700">
      {icon}
      {title}
    </div>
    {children}
  </div>
);

const Row = ({ label, onClick }) => (
  <div
    onClick={onClick}
    className="flex justify-between items-center px-4 py-3 border-b last:border-none hover:bg-gray-50 cursor-pointer"
  >
    <span>{label}</span>
    <span className="text-gray-400">›</span>
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <div className="flex justify-between items-center px-4 py-3 border-b last:border-none">
    <span>{label}</span>

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
    email: true
  });

  const toggleNotification = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">

      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-3 text-lg">
          ←
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Account */}
      <Section title="Account" icon={<FaUser />}>
        <Row label="Edit Profile" />
        <Row label="Change Password" />
        <Row label="Phone Number" />
        <Row label="Email Address" />
        <Row label="Two-Factor Authentication" />
      </Section>

      {/* Workshop */}
      <Section title="Workshop / Store Settings" icon={<FaStore />}>
        <Row label="Workshop Name" />
        <Row label="Workshop Description" />
        <Row label="Workshop Location" />
        <Row label="Business Hours" />
        <Row label="Workshop Logo" />
      </Section>

      {/* Orders */}
      <Section title="Orders & Sales" icon={<FaShoppingCart />}>
        <Row label="Order History" />
        <Row label="Sales Analytics" />
        <Row label="Shipping Settings" />
        <Row label="Payment Methods" />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={<FaBell />}>
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

      {/* Privacy */}
      <Section title="Privacy & Security" icon={<FaLock />}>
        <Row label="Change Password" />
        <Row label="Login Activity" />
        <Row label="Blocked Users" />
        <Row label="Data & Privacy" />
      </Section>

      {/* Help */}
      <Section title="Help & Support" icon={<FaQuestionCircle />}>
        <Row label="Help Center" />
        <Row label="Report a Problem" />
        <Row label="Contact Support" />
      </Section>

      {/* Logout */}
      <div className="bg-white rounded-xl shadow p-4 flex items-center text-red-500 cursor-pointer">
        <FaSignOutAlt className="mr-2" />
        Log Out
      </div>

    </div>
  );
}