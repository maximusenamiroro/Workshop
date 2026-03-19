import React, { useState, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Home,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ---------------- NAV ITEM ----------------
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all
        ${
          active
            ? "bg-white text-black px-5 py-2 rounded-2xl scale-105 shadow-md"
            : "text-gray-400 px-3 py-2"
        }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

// ---------------- MOCK DATA ----------------
const mockReels = [
  {
    id: 1,
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    username: "seller_product_1",
    description: "Cool sneakers for sale 🔥",
    type: "product",
  },
  {
    id: 2,
    video: "https://www.w3schools.com/html/movie.mp4",
    username: "designer_pro",
    description: "I design logos and branding",
    type: "service",
  },
];

// ---------------- MAIN PAGE ----------------
export default function ReelsPage() {
  const [activePage, setActivePage] = useState("reels");
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">
      
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-4 space-y-6">
        <NavItem
          icon={<Home size={28} />}
          label="Home"
          active={activePage === "reels"}
          onClick={() => setActivePage("reels")}
        />
        <NavItem
          icon={<User size={28} />}
          label="Profile"
          active={activePage === "profile"}
          onClick={() => navigate("/buyer-profile")}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col w-full">

        {/* ✅ REELS (85% mobile height) */}
        <div className="h-[85vh] md:h-full overflow-y-scroll snap-y snap-mandatory">
          {mockReels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>

        {/* ✅ MOBILE NAVBAR (15%) */}
        <div className="h-[15vh] md:hidden bg-black/90 backdrop-blur-md flex justify-around items-center">
          <NavItem
            icon={<Home size={28} />}
            label="Home"
            active={activePage === "reels"}
            onClick={() => setActivePage("reels")}
          />
          <NavItem
            icon={<User size={28} />}
            label="Profile"
            active={activePage === "profile"}
            onClick={() => navigate("/buyer-profile")}
          />
        </div>

      </div>
    </div>
  );
}

// ---------------- REEL CARD ----------------
function ReelCard({ reel }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(120);
  const [comments, setComments] = useState(["🔥 Nice", "Price?"]);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);

  const videoRef = useRef(null);
  const navigate = useNavigate();

  const toggleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const toggleMute = () => {
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <div className="h-[85vh] md:h-screen snap-start w-full flex justify-center items-center relative">
      
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={reel.video}
        autoPlay
        loop
        muted={muted}
        onClick={toggleMute}
        className="object-cover w-full h-full md:w-[40%] rounded-xl"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />

      {/* CONTENT */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full md:w-[40%] flex justify-between items-end px-4">
        
        {/* LEFT */}
        <div>
          <h2
            onClick={() => navigate(`/seller/${reel.username}`)}
            className="font-bold text-lg cursor-pointer"
          >
            @{reel.username}
          </h2>

          <p className="text-sm text-gray-300">{reel.description}</p>

          <button className="mt-2 px-5 py-2 bg-white text-black rounded-full font-semibold">
            {reel.type === "product" ? "Order" : "Book"}
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col items-center gap-4">
          <button onClick={toggleLike}>
            <Heart
              size={28}
              className={liked ? "text-red-500 fill-red-500" : ""}
            />
            <span className="text-xs">{likes}</span>
          </button>

          <button onClick={() => setShowComments(true)}>
            <MessageCircle size={28} />
            <span className="text-xs">{comments.length}</span>
          </button>

          <button>
            <Share2 size={28} />
          </button>

          <button onClick={toggleMute}>
            {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-white text-black rounded-t-2xl p-4 z-50">
          <div className="flex justify-between mb-2">
            <h3 className="font-bold">Comments</h3>
            <button onClick={() => setShowComments(false)}>Close</button>
          </div>

          <div className="overflow-y-auto h-[70%] space-y-2">
            {comments.map((c, i) => (
              <p key={i} className="text-sm border-b pb-1">
                {c}
              </p>
            ))}
          </div>

          <input
            type="text"
            placeholder="Add comment..."
            className="mt-2 w-full border px-3 py-2 rounded-full text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                setComments([...comments, e.target.value]);
                e.target.value = "";
              }
            }}
          />
        </div>
      )}
    </div>
  );
}