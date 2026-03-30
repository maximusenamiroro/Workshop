import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserReels({ userId, isOwner }) {
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("reels")) || [];

    const userReels = stored.filter((r) => r.userId === userId);
    setReels(userReels);
  }, [userId]);

  return (
    <div className="grid grid-cols-3 gap-[2px] p-[2px]">

      {/* 🔥 PLUS BUTTON */}
      {isOwner && (
        <div
          onClick={() => navigate("/create-reel")}
          className="aspect-[9/16] bg-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/20"
        >
          <span className="text-3xl">+</span>
          <p className="text-xs">Post</p>
        </div>
      )}

      {/* REELS */}
      {reels.map((reel) => (
        <div key={reel.id} className="aspect-[9/16]">
          <video
            src={reel.video}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

    </div>
  );
}