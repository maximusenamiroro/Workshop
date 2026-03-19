import { useState } from "react";
import {
  FaBookmark,
  FaShoppingBag,
  FaBox,
  FaHome,
  FaInbox,
  FaUser,
  FaEllipsisV,
  FaCamera,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// 🔥 SAME NAV STYLE AS REELS
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center relative transition-all
        ${
          active
            ? "bg-white text-black px-4 py-2 rounded-2xl scale-110 shadow-md"
            : "text-gray-400 px-3 py-2"
        }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>

      {/* Bubble underline */}
      {active && (
        <div className="absolute -bottom-1 w-6 h-1 bg-white rounded-full" />
      )}
    </button>
  );
}

export default function BuyerProfile() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("profile");
  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");

  const [user, setUser] = useState({
    username: "Buyer Name",
    email: "buyer@example.com",
    country: "Country",
  });

  const [formData, setFormData] = useState(user);

  const changeProfile = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const saveProfile = () => {
    setUser(formData);
    setEditOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">
      
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-4 space-y-6">
        <NavItem
          icon={<FaHome size={26} />}
          label="Home"
          active={activePage === "home"}
          onClick={() => {
            setActivePage("home");
            navigate("/");
          }}
        />
        <NavItem
          icon={<FaUser size={26} />}
          label="Profile"
          active={activePage === "profile"}
          onClick={() => setActivePage("profile")}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col w-full">

        {/* ✅ MAIN CONTENT (85%) */}
        <div className="h-[85vh] md:h-full overflow-y-auto">

          {/* Header */}
          <div className="flex justify-between items-center p-4">
            <h1 className="font-bold text-lg">Profile</h1>

            <div className="relative">
              <FaEllipsisV
                onClick={() => setMenuOpen(!menuOpen)}
                className="cursor-pointer"
              />
              {menuOpen && (
                <div className="absolute right-0 mt-2 bg-gray-900 shadow-lg rounded-lg p-2 text-sm">
                  <p className="p-2 hover:bg-gray-800 cursor-pointer">About</p>
                  <p className="p-2 hover:bg-gray-800 cursor-pointer">
                    Settings
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Profile */}
          <div className="flex flex-col items-center mt-4">
            <div className="relative">
              <img
                src={profileImage || "https://via.placeholder.com/150"}
                className="w-28 h-28 rounded-full object-cover border-4 border-gray-700"
              />
              <label className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full cursor-pointer text-white">
                <FaCamera />
                <input
                  type="file"
                  className="hidden"
                  onChange={changeProfile}
                />
              </label>
            </div>

            <h2 className="mt-3 font-bold text-lg">{user.username}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <p className="text-gray-500 text-sm">{user.country}</p>

            <button
              onClick={() => setEditOpen(true)}
              className="mt-3 px-5 py-2 bg-white text-black rounded-full text-sm font-semibold"
            >
              Edit Profile
            </button>
          </div>

          {/* Edit Modal */}
          {editOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-gray-900 w-[90%] max-w-sm p-5 rounded-xl">
                <h2 className="font-bold mb-3">Edit Profile</h2>

                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full bg-gray-800 p-2 rounded mb-2"
                />

                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full bg-gray-800 p-2 rounded mb-2"
                />

                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-full bg-gray-800 p-2 rounded mb-3"
                />

                <button
                  onClick={saveProfile}
                  className="w-full bg-white text-black py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex justify-around mt-6 border-t border-gray-800 pt-3">
            <Tab icon={<FaBookmark />} active={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
            <Tab icon={<FaShoppingBag />} active={activeTab === "purchased"} onClick={() => setActiveTab("purchased")} />
            <Tab icon={<FaBox />} active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
          </div>

          {/* Content */}
          <div className="p-4 text-center text-gray-400">
            {activeTab === "saved" && "Saved products"}
            {activeTab === "purchased" && "Purchased products"}
            {activeTab === "orders" && "Orders"}
          </div>
        </div>

        {/* ✅ MOBILE NAVBAR (REELS STYLE) */}
        <div className="h-[15vh] md:hidden bg-black/80 backdrop-blur-md flex justify-around items-center">
          <NavItem
            icon={<FaHome size={26} />}
            label="Home"
            active={activePage === "home"}
            onClick={() => {
              setActivePage("home");
              navigate("/");
            }}
          />
          <NavItem
            icon={<FaUser size={26} />}
            label="Profile"
            active={activePage === "profile"}
            onClick={() => setActivePage("profile")}
          />
        </div>
      </div>
    </div>
  );
}

// Tabs
function Tab({ icon, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer text-xl ${
        active ? "text-white" : "text-gray-500"
      }`}
    >
      {icon}
    </div>
  );
}