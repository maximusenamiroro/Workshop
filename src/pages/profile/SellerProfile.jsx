import { useState } from "react";
import {
  FaUserFriends,
  FaStar,
  FaPlusCircle,
  FaHome,
  FaInbox,
  FaUser,
  FaEllipsisV,
  FaChevronDown,
  FaUserPlus,
  FaEnvelope
} from "react-icons/fa";
import { TbPlanet } from "react-icons/tb";

export default function SellerProfile() {

  const [products, setProducts] = useState([]);
  const [showAccounts, setShowAccounts] = useState(false);

  const handleUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);

      const newProduct = {
        id: Date.now(),
        image: imageUrl
      };

      setProducts([newProduct, ...products]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* Top Bar */}
      <div className="bg-green-900 text-white p-4 relative flex items-center justify-center">

        {/* Username Dropdown */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowAccounts(!showAccounts)}
        >
          <h2 className="font-bold text-lg">@username</h2>
          <FaChevronDown />
        </div>

        {/* 3 Dot Menu */}
        <div className="absolute right-4">
          <FaEllipsisV />
        </div>

        {/* Account Switch */}
        {showAccounts && (
          <div className="absolute top-14 bg-white text-black shadow-lg rounded-lg w-40">
            <p className="p-2 hover:bg-gray-100 cursor-pointer">@account1</p>
            <p className="p-2 hover:bg-gray-100 cursor-pointer">@account2</p>
            <p className="p-2 hover:bg-gray-100 cursor-pointer">Add Account</p>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-white p-6 text-center shadow">

        {/* Profile Image */}
        <div className="flex justify-center">
          <img
            src="https://via.placeholder.com/100"
            alt="profile"
            className="w-24 h-24 rounded-full border-4 border-green-800"
          />
        </div>

        {/* Username */}
        <h3 className="mt-3 font-semibold text-lg">@username</h3>

        {/* Message and Follow Icon */}
        <div className="flex justify-center gap-6 mt-4">

          <button className="bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <FaEnvelope />
            Message
          </button>

          <button className="bg-gray-200 p-3 rounded-lg">
            <FaUserPlus className="text-green-800" />
          </button>

        </div>

        {/* Icons Section */}
        <div className="flex justify-around mt-6 text-center">

          {/* Followers */}
          <div>
            <FaUserFriends className="text-green-800 text-xl mx-auto" />
            <p className="font-bold">1.2k</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>

          {/* Post Product */}
          <div>
            <label className="cursor-pointer">
              <FaPlusCircle className="text-green-800 text-2xl mx-auto" />
              <p className="text-xs text-gray-500">Post</p>
              <input
                type="file"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Rating */}
          <div>
            <FaStar className="text-yellow-500 text-xl mx-auto" />
            <p className="font-bold">4.8</p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>

        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 flex-1">

        {products.length === 0 ? (
          <p className="text-gray-500 text-center col-span-2">
            No products uploaded yet
          </p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow">
              <img
                src={product.image}
                alt="product"
                className="w-full h-40 object-cover rounded-xl"
              />
            </div>
          ))
        )}

      </div>

      {/* Bottom Navigation */}
      <div className="bg-green-900 text-white p-3 flex justify-around text-center">

        <div className="flex flex-col items-center cursor-pointer">
          <FaHome />
          <span className="text-xs">Home</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer">
          <FaInbox />
          <span className="text-xs">Inbox</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer">
          <TbPlanet />
          <span className="text-xs">Workstation</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer">
          <FaUser />
          <span className="text-xs">Profile</span>
        </div>

      </div>

    </div>
  );
}
