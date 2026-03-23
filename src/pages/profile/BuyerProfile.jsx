import { useState } from "react";
import {
  FaBookmark,
  FaShoppingBag,
  FaBox,
  FaHome,
  FaInbox,
  FaUser,
  FaEllipsisV,
  FaUserEdit,
  FaEnvelope,
  FaChevronDown,
  FaPlus
} from "react-icons/fa";
import { TbPlanet } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

export default function WorkspaceProfile() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");

  const [user, setUser] = useState({
    username: "Seller Name",
    phone: "123-456-7890",
    country: "Nigeria",
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

  /* Navigation */
  const navItems = [
    { icon: <FaHome size={24} />, path: "/" },
    { icon: <FaInbox size={24} />, path: "/inbox" },
    { icon: <TbPlanet size={24} />, path: "/workspace" },
    { icon: <FaUser size={24} />, path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-20 flex">

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-20 md:h-screen md:fixed md:left-0 md:top-0 md:bg-white md:border-r md:shadow-md md:items-center md:py-4">
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

      {/* Main Content */}
      <div className="flex-1 md:ml-20">

        {/* Header */}
        <div className="flex justify-between items-center p-4">
          <h1 className="font-bold text-lg">Workspace Profile</h1>

          <div className="relative">
            <FaEllipsisV
              onClick={() => setMenuOpen(!menuOpen)}
              className="cursor-pointer"
            />

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg p-2 text-sm">
                <p className="p-2 hover:bg-gray-100 cursor-pointer">About</p>
                <p
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  Settings
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center mt-4">

          {/* Profile Image */}
          <div className="relative">

            <img
              src={profileImage || "https://via.placeholder.com/150"}
              className="w-28 h-28 rounded-full object-cover border-4 border-gray-200"
              alt="profile"
            />

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

        </div>

        {/* Edit Modal */}
        {editOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white w-[90%] max-w-sm p-5 rounded-xl">

              <h2 className="font-bold mb-3">Edit Profile</h2>

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
                className="w-full bg-green-600 text-white py-2 rounded"
              >
                Save
              </button>

            </div>

          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-around mt-6 border-t pt-3">

          <Tab
            icon={<FaBookmark />}
            active={activeTab === "saved"}
            onClick={() => setActiveTab("saved")}
          />

          <Tab
            icon={<FaShoppingBag />}
            active={activeTab === "purchased"}
            onClick={() => setActiveTab("purchased")}
          />

          <Tab
            icon={<FaBox />}
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />

        </div>

        {/* Content */}
        <div className="p-4 text-center text-gray-600">
          {activeTab === "saved" && "Saved products"}
          {activeTab === "purchased" && "Purchased products"}
          {activeTab === "orders" && "Orders"}
        </div>

      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 md:hidden shadow-md">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="text-gray-600"
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
        active ? "text-black" : "text-gray-400"
      }`}
    >
      {icon}
    </div>
  );
}
