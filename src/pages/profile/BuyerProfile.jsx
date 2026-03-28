import { useState } from "react";
import {
  FaBookmark,
  FaShoppingBag,
  FaBox,
  FaEllipsisV,
  FaUserEdit,
  FaEnvelope,
  FaChevronDown,
  FaPlus
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function BuyerProfile() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
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
    <div className="min-h-screen bg-gray-100 pb-20">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4">
        <h1 className="font-bold text-lg">Profile</h1>

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

      {/* PROFILE */}
      <div className="flex flex-col items-center mt-4">

        <div className="relative">
          <img
            src={profileImage || "https://via.placeholder.com/150"}
            className="w-28 h-28 rounded-full object-cover border-4 border-gray-200"
          />

          <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer text-white">
            <FaPlus />
            <input type="file" className="hidden" onChange={changeProfile} />
          </label>
        </div>

        <div
          className="flex items-center gap-2 mt-3 cursor-pointer"
          onClick={() => setAccountOpen(!accountOpen)}
        >
          <h2 className="font-bold text-lg">{user.username}</h2>
          <FaChevronDown />
        </div>

        <p className="text-gray-500 text-sm">{user.phone}</p>
        <p className="text-gray-400 text-sm">{user.country}</p>

        {/* EDIT ONLY (NO MESSAGE HERE) */}
        <button
          className="mt-4 bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setEditOpen(true)}
        >
          <FaUserEdit />
          Edit Profile
        </button>
      </div>

      {/* TABS */}
      <div className="flex justify-around mt-6 border-t pt-3">
        <Tab icon={<FaBookmark />} active={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
        <Tab icon={<FaShoppingBag />} active={activeTab === "purchased"} onClick={() => setActiveTab("purchased")} />
        <Tab icon={<FaBox />} active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
      </div>

      <div className="p-4 text-center text-gray-600">
        {activeTab === "saved" && "Saved products"}
        {activeTab === "purchased" && "Purchased products"}
        {activeTab === "orders" && "Orders"}
      </div>
    </div>
  );
}

function Tab({ icon, active, onClick }) {
  return (
    <div onClick={onClick} className={`cursor-pointer text-xl ${active ? "text-black" : "text-gray-400"}`}>
      {icon}
    </div>
  );
}