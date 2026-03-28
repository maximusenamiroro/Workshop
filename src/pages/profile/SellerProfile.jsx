import { useState } from "react";
import {
  FaUserFriends,
  FaStar,
  FaPlusCircle,
  FaChevronDown,
  FaUserPlus,
  FaEnvelope
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserReels from "../reels/UserReels";


export default function SellerProfile() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [showAccounts, setShowAccounts] = useState(false);

  // 🔥 CHAT CONTROL
  const hasConversation = false; // later from Supabase

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newProduct = {
      id: Date.now(),
      image: URL.createObjectURL(file),
    };

    setProducts([newProduct, ...products]);
  };

  // 🔥 START CHAT (BUYER INITIATES)
  const startConversation = () => {
    navigate("/inbox", {
      state: {
        sellerId: "seller123",
        sellerName: "@username",
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <div className="bg-black text-white p-4 flex justify-center relative">

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowAccounts(!showAccounts)}
        >
          <h2 className="font-bold text-lg">@username</h2>
          <FaChevronDown />
        </div>

        {showAccounts && (
          <div className="absolute top-14 bg-white text-black shadow-lg rounded-lg w-40">
            <p className="p-2 hover:bg-gray-100">@account1</p>
            <p className="p-2 hover:bg-gray-100">@account2</p>
          </div>
        )}
      </div>

      {/* PROFILE */}
      <div className="bg-white p-6 text-center shadow">

        <img
          src="https://via.placeholder.com/100"
          className="w-24 h-24 rounded-full border-4 border-blue-600 mx-auto"
        />

        <h3 className="mt-3 font-semibold text-lg">@username</h3>

        {/* 🔥 MESSAGE BUTTON */}
        <div className="flex justify-center gap-4 mt-4">

          {!hasConversation ? (
            <button
              onClick={startConversation}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaEnvelope />
              Message
            </button>
          ) : (
            <button
              onClick={() => navigate("/inbox")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Open Chat
            </button>
          )}

          <button className="bg-gray-200 p-3 rounded-lg">
            <FaUserPlus className="text-blue-600" />
          </button>

        </div>

        {/* STATS */}
        <div className="flex justify-around mt-6 text-center">

          <div>
            <FaUserFriends className="text-blue-600 text-xl mx-auto" />
            <p className="font-bold">1.2k</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>

          <div>
            <label className="cursor-pointer">
              <FaPlusCircle className="text-blue-600 text-2xl mx-auto" />
              <p className="text-xs text-gray-500">Post</p>
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
          </div>

          <div>
            <FaStar className="text-yellow-500 text-xl mx-auto" />
            <p className="font-bold">4.8</p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>

        </div>
      </div>

      {/* PRODUCTS */}
     <UserReels userId={"seller-id"} />
    </div>
  );
}