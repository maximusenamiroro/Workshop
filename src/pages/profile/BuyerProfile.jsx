import { useState } from "react";
import {
  FaBookmark,
  FaShoppingBag,
  FaBox,
  FaEllipsisV,
  FaUserEdit,
  FaChevronDown,
  FaPlus
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function BuyerProfile() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");

  const [user, setUser] = useState({
    username: "Buyer Name",
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

  return (
    <div className="min-h-screen bg-black text-white pb-20">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4">
        <h1 className="font-bold text-lg">Profile</h1>

        <div className="relative">
          <FaEllipsisV
            onClick={() => setMenuOpen(!menuOpen)}
            className="cursor-pointer text-green-800"
          />

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black shadow-lg rounded-lg p-2 text-sm">
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

      {/* PROFILE */}
      <div className="flex flex-col items-center mt-4">

        <div className="relative">
          <img
            src={profileImage || "https://via.placeholder.com/150"}
            alt="Profile Picture"
            className="w-28 h-28 rounded-full object-cover border-4 border-gray-700"
          />

          <label className="absolute bottom-0 right-0 bg-green-800 p-2 rounded-full cursor-pointer text-white">
            <FaPlus />
            <input type="file" className="hidden" onChange={changeProfile} />
          </label>
        </div>

        <div className="flex items-center gap-2 mt-3 cursor-pointer">
          <h2 className="font-bold text-lg">{user.username}</h2>
          <FaChevronDown className="text-green-800" />
        </div>

        <p className="text-gray-400 text-sm">{user.phone}</p>
        <p className="text-gray-500 text-sm">{user.country}</p>

        <button
          className="mt-4 bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setEditOpen(true)}
        >
          <FaUserEdit />
          Edit Profile
        </button>
      </div>

      {/* TABS */}
      <div className="flex justify-around mt-6 border-t border-gray-700 pt-3">
        <Tab icon={<FaBookmark />} active={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
        <Tab icon={<FaShoppingBag />} active={activeTab === "purchased"} onClick={() => setActiveTab("purchased")} />
        <Tab icon={<FaBox />} active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
      </div>

      <div className="p-4 text-center text-gray-400">
        {activeTab === "saved" && "Saved products"}
        {activeTab === "purchased" && "Purchased products"}
        {activeTab === "orders" && "Orders"}
      </div>

      {/* EDIT PROFILE MODAL */}
      {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-80 text-white">
            <h2 className="font-bold text-lg mb-4">Edit Profile</h2>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            />
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 rounded bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-4 py-2 rounded bg-green-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tab({ icon, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer text-xl ${active ? "text-green-800" : "text-gray-500"}`}
    >
      {icon}
    </div>
  );
}
