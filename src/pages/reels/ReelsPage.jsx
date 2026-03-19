import React, { useState, useRef } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Home, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Reusable nav button
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center relative transition-all
        ${active ? "bg-white text-black px-5 py-3 rounded-2xl scale-110 shadow-md" : "text-gray-400 px-3 py-2"}`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
      {active && <div className="absolute -bottom-2 w-6 h-1 bg-white rounded-full" />}
    </button>
  );
}

// Mock reels data
const mockReels = [
  { id: 1, video: "/videos/video1.mp4", username: "alice", description: "Check this out!", type: "product" },
  { id: 2, video: "/videos/video2.mp4", username: "bob", description: "Amazing stuff", type: "service" },
  // Add more reels as needed
];

export default function ReelsPage() {
  const [activePage, setActivePage] = useState("reels");
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 text-white items-center py-4 space-y-6">
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

      {/* Reels container */}
      <div className="flex-1 w-full overflow-y-scroll snap-y snap-mandatory relative md:pb-0">
        {mockReels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} />
        ))}
      </div>

      {/* Bottom nav - mobile */}
      {/* Bottom nav - mobile */}
<div className="fixed bottom-0 left-0 w-full md:hidden bg-black/80 backdrop-blur-md flex justify-around items-center h-[15vh] px-6 z-30">
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
  );
}

// ReelCard component
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
    <div className="snap-start w-full flex justify-center items-center relative">
      {/* Video */}
    <video
  ref={videoRef}
  src={reel.video}
  autoPlay
  loop
  muted={muted}
  onClick={toggleMute}
  className="object-cover rounded-xl w-full h-[85vh] md:h-screen md:w-[40%]" 
/>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />

      {/* Content overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full md:w-[40%] flex justify-between items-end px-4">
        {/* Left */}
        <div className="flex flex-col justify-end">
          <h2
            onClick={() => navigate(`/seller/${reel.username}`)}
            className="font-bold text-lg cursor-pointer"
          >
            @{reel.username}
          </h2>
          <p className="text-sm text-gray-300">{reel.description}</p>
          <button className="mt-2 px-5 py-2 bg-white text-black rounded-full font-semibold w-fit">
            {reel.type === "product" ? "Order" : "Book"}
          </button>
        </div>

        {/* Right */}
        <div className="flex flex-col items-center gap-4">
          <button onClick={toggleLike} className="flex flex-col items-center">
            <Heart size={28} className={liked ? "text-red-500 fill-red-500" : ""} />
            <span className="text-xs">{likes}</span>
          </button>

          <button onClick={() => setShowComments(true)} className="flex flex-col items-center">
            <MessageCircle size={28} />
            <span className="text-xs">{comments.length}</span>
          </button>

          <button className="flex flex-col items-center">
            <Share2 size={28} />
            <span className="text-xs">Share</span>
          </button>

          <button onClick={toggleMute}>{muted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
        </div>
      </div>

      {/* Comments modal */}
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