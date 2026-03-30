import { useState } from "react";
import { FaChevronDown, FaEnvelope, FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserReels from "../reels/UserReels";
import SellerProducts from "./SellerProducts";

export default function SellerProfile() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("reels");
  const [showAccounts, setShowAccounts] = useState(false);

  const seller = {
    id: "seller123",
    username: "designer_pro",
    avatar: "https://via.placeholder.com/100",
    bio: "Creative designer • Logos & branding",
    followers: 1200,
    rating: 4.8,
  };

  const startConversation = () => {
    navigate("/inbox", {
      state: {
        sellerId: seller.id,
        sellerName: seller.username,
      },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md flex justify-center py-4 border-b border-white/10">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowAccounts(!showAccounts)}
        >
          <h2 className="font-semibold">@{seller.username}</h2>
          <FaChevronDown />
        </div>

        {showAccounts && (
          <div className="absolute top-14 bg-[#1a1a1a] rounded-xl w-44">
            <p className="p-3 hover:bg-white/10">@account1</p>
            <p className="p-3 hover:bg-white/10">@account2</p>
          </div>
        )}
      </div>

      {/* PROFILE */}
      <div className="flex flex-col items-center px-4 py-6">
        <img
          src={seller.avatar}
          className="w-24 h-24 rounded-full border border-white/20"
        />

        <h3 className="mt-3 text-lg font-semibold">
          @{seller.username}
        </h3>

        <p className="text-white/60 text-sm mt-1 text-center">
          {seller.bio}
        </p>

        {/* ACTIONS */}
        <div className="flex gap-3 mt-4 w-full max-w-xs">
          <button
            onClick={startConversation}
            className="flex-1 bg-white text-black py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <FaEnvelope />
            Message
          </button>

          <button className="bg-white/10 px-4 rounded-lg">
            <FaUserPlus />
          </button>
        </div>

        {/* STATS */}
        <div className="flex gap-10 mt-6 text-center">
          <div>
            <p className="font-bold">24</p>
            <span className="text-xs text-white/50">Reels</span>
          </div>

          <div>
            <p className="font-bold">{seller.followers}</p>
            <span className="text-xs text-white/50">Followers</span>
          </div>

          <div>
            <p className="font-bold">{seller.rating}</p>
            <span className="text-xs text-white/50">Rating</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-around border-y border-white/10 py-3 text-sm">
        <button
          onClick={() => setActiveTab("reels")}
          className={activeTab === "reels" ? "font-semibold" : "text-white/40"}
        >
          Reels
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={activeTab === "products" ? "font-semibold" : "text-white/40"}
        >
          Products
        </button>
      </div>
      
      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "reels" ? (
          <UserReels userId={seller.id} isOwner={true} />
        ) : (
          <SellerProducts sellerId={seller.id} />
        )}
      </div>

    </div>
  );
}