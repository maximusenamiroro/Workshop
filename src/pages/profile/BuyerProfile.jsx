<<<<<<< Updated upstream
import { useState } from "react";
=======
import { useState, useRef, useEffect } from "react";
>>>>>>> Stashed changes
import {
  FaBookmark,
  FaShoppingBag,
  FaBox,
  FaHome,
  FaInbox,
  FaUser,
  FaEllipsisV,
<<<<<<< Updated upstream
  FaUserEdit,
  FaEnvelope,
  FaChevronDown,
  FaPlus
} from "react-icons/fa";
=======
  FaCamera,
  FaUserEdit,
  FaCog,
  FaInfoCircle,
} from "react-icons/fa";

import {
  MessageCircle,
  Home,
  User,
} from "lucide-react";

>>>>>>> Stashed changes
import { TbPlanet } from "react-icons/tb";
import { useNavigate, Link } from "react-router-dom";

export default function WorkspaceProfile() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");

  const menuRef = useRef();

  const [user, setUser] = useState({
    username: "Seller Name",
    phone: "123-456-7890",
    country: "Nigeria",
  });

  const [formData, setFormData] = useState(user);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

<<<<<<< Updated upstream
  /* Navigation */
=======
>>>>>>> Stashed changes
  const navItems = [
    { icon: <Home size={24} />, path: "/reels" },
    { icon: <MessageCircle size={24} />, path: "/inbox" },
    { icon: <TbPlanet size={24} />, path: "/workspace" },
    { icon: <User size={24} />, path: "/buyer-profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-20 h-screen fixed left-0 top-0 bg-white border-r shadow-md items-center py-4">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="text-gray-600 my-4 hover:text-black"
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 md:ml-20 pb-20">

        {/* HEADER */}
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold text-gray-800">
            Workspace Profile
          </h1>

          {/* MENU */}
          <div className="relative" ref={menuRef}>
            <FaEllipsisV
              onClick={() => setMenuOpen(!menuOpen)}
              className="cursor-pointer text-gray-700"
            />

            {menuOpen && (
<<<<<<< Updated upstream
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg p-2 text-sm">
                <p className="p-2 hover:bg-gray-100 cursor-pointer">About</p>
                <p
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  Settings
                </p>
=======
              <div className="absolute right-0 mt-3 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fadeIn">

                <Link
                  to="/about"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition"
                >
                  <FaInfoCircle className="text-green-700" />
                  About
                </Link>

                <div className="h-[1px] bg-gray-200" />

                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition"
                >
                  <FaCog className="text-green-700" />
                  Settings
                </Link>

>>>>>>> Stashed changes
              </div>
            )}
          </div>
        </div>

<<<<<<< Updated upstream
        {/* Profile Section */}
        <div className="flex flex-col items-center mt-4">

          {/* Profile Image */}
=======
        {/* PROFILE */}
        <div className="flex flex-col items-center mt-6">
>>>>>>> Stashed changes
          <div className="relative">

            <img
              src={profileImage || "https://via.placeholder.com/150"}
              className="w-28 h-28 rounded-full object-cover border-4 border-gray-200"
              alt="profile"
            />

<<<<<<< Updated upstream
            {/* Upload Icon */}
            <label className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full cursor-pointer text-white">
              <FaPlus />
              <input
                type="file"
                className="hidden"
                onChange={changeProfile}
              />
            </label>

          </div>

          {/* Username Dropdown */}
          <div
            className="flex items-center gap-2 mt-3 cursor-pointer"
            onClick={() => setAccountOpen(!accountOpen)}
          >
            <h2 className="font-bold text-lg">{user.username}</h2>
            <FaChevronDown />
          </div>

          {accountOpen && (
            <div className="bg-white shadow-md rounded-lg mt-2 w-40 text-center">
              <p className="p-2 hover:bg-gray-100 cursor-pointer">@account1</p>
              <p className="p-2 hover:bg-gray-100 cursor-pointer">@account2</p>
              <p className="p-2 hover:bg-gray-100 cursor-pointer">Add Account</p>
            </div>
          )}

          <p className="text-gray-500 text-sm">{user.phone}</p>
          <p className="text-gray-400 text-sm">{user.country}</p>

          {/* Message and Edit Buttons */}
          <div className="flex gap-4 mt-4">

            <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FaEnvelope />
              Message
            </button>

            <button
              className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2"
              onClick={() => setEditOpen(true)}
            >
              <FaUserEdit />
              Edit Profile
            </button>

          </div>

=======
            <div className="absolute bottom-0 right-0 flex gap-2">
              <label className="bg-green-700 p-2 rounded-full cursor-pointer text-white">
                <FaCamera />
                <input type="file" className="hidden" onChange={changeProfile} />
              </label>

              <button
                onClick={() => setEditOpen(true)}
                className="bg-black text-white p-2 rounded-full"
              >
                <FaUserEdit />
              </button>
            </div>
          </div>

          <h2 className="mt-3 font-bold text-lg text-gray-800">
            {user.username}
          </h2>
          <p className="text-gray-500 text-sm">{user.phone}</p>
          <p className="text-gray-400 text-sm">{user.country}</p>
>>>>>>> Stashed changes
        </div>

        {/* EDIT MODAL */}
        {editOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-[90%] max-w-sm p-5 rounded-xl shadow-lg">
              <h2 className="font-bold mb-3 text-gray-800">
                Edit Profile
              </h2>

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full border p-2 rounded mb-2"
              />

              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full border p-2 rounded mb-2"
              />

              <input
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                className="w-full border p-2 rounded mb-3"
              />

              <button
                onClick={saveProfile}
                className="w-full bg-green-700 text-white py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex justify-around mt-6 border-t pt-3">
          <Tab icon={<FaBookmark />} active={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
          <Tab icon={<FaShoppingBag />} active={activeTab === "purchased"} onClick={() => setActiveTab("purchased")} />
          <Tab icon={<FaBox />} active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
        </div>

        {/* CONTENT */}
        <div className="p-4 text-center text-gray-600">
          {activeTab === "saved" && "Saved products"}
          {activeTab === "purchased" && "Purchased products"}
          {activeTab === "orders" && "Orders"}
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 md:hidden shadow-md">
=======
      {/* MOBILE NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 md:hidden shadow-md">
>>>>>>> Stashed changes
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="text-gray-600 hover:text-green-700"
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Tab Component */
function Tab({ icon, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer text-xl ${
        active ? "text-green-700" : "text-gray-400"
      }`}
    >
      {icon}
    </div>
  );
}