import { useState } from "react";
import { useParams } from "react-router-dom";
import UserReels from "../reels/UserReels";
import SellerProducts from "./SellerProducts";

export default function SellerProfile() {
  const { username } = useParams();

  const [tab, setTab] = useState("reels");

  const seller = {
    id: "seller123",
    username: username,
    avatar: "https://via.placeholder.com/100",
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <div className="text-center py-4 border-b border-white/10">
        <h2>@{seller.username}</h2>
      </div>

      {/* PROFILE */}
      <div className="flex flex-col items-center py-6">
        <img
          src={seller.avatar}
          className="w-24 h-24 rounded-full"
        />

        <h3 className="mt-2">@{seller.username}</h3>
      </div>

      {/* TABS */}
      <div className="flex justify-around border-y border-white/10 py-3">
        <button onClick={() => setTab("reels")}>Reels</button>
        <button onClick={() => setTab("products")}>Products</button>
      </div>

      {/* CONTENT */}
      {tab === "reels" ? (
        <UserReels userId={seller.id} isOwner={true} />
      ) : (
        <SellerProducts />
      )}

    </div>
  );
}