import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { FaArrowLeft, FaBookmark } from "react-icons/fa";

export default function SavedReels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedReels, setSavedReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchSavedReels();
  }, [user]);

  const fetchSavedReels = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_reels")
        .select(`
          id, created_at,
          reels(
            id, video_url, description, type,
            likes, user_id,
            profiles(full_name, avatar_url)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedReels((data || []).map(s => s.reels).filter(Boolean));
    } catch (err) {
      console.error("fetchSavedReels error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const unsaveReel = async (reelId) => {
    await supabase
      .from("saved_reels")
      .delete()
      .eq("user_id", user.id)
      .eq("reel_id", reelId);
    fetchSavedReels();
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={() => navigate(-1)}>
          <FaArrowLeft className="text-gray-400" />
        </button>
        <h1 className="font-bold text-lg">Saved Reels</h1>
        <FaBookmark className="text-yellow-400 ml-auto" />
      </div>

      {savedReels.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
          <FaBookmark size={40} className="text-yellow-400/30" />
          <p>No saved reels yet</p>
          <p className="text-sm">Tap the bookmark icon on any reel to save it</p>
          <button
            onClick={() => navigate("/reels")}
            className="mt-4 bg-green-600 px-6 py-2 rounded-xl text-white text-sm font-semibold"
          >
            Browse Reels
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-2">
          {savedReels.map((reel) => (
            <SavedReelThumbnail
              key={reel.id}
              reel={reel}
              onUnsave={() => unsaveReel(reel.id)}
              onNavigate={() => navigate(`/seller-profile/${reel.user_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedReelThumbnail({ reel, onUnsave, onNavigate }) {
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative aspect-square bg-white/10 rounded-xl overflow-hidden">
      <video
        src={reel.video_url}
        className="w-full h-full object-cover cursor-pointer"
        muted
        onClick={() => navigate(`/reel/${reel.id}`)}
      />

      {/* Worker name */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2 cursor-pointer"
        onClick={onNavigate}
      >
        <p className="text-xs text-white truncate">
          @{reel.profiles?.full_name || "Worker"}
        </p>
      </div>

      {/* Unsave button */}
      <button
        onClick={onUnsave}
        className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full"
      >
        <FaBookmark size={10} className="text-yellow-400 fill-yellow-400" />
      </button>
    </div>
  );
}