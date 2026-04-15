import React, { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();

    // Realtime subscription for likes & comments
    const channel = supabase
      .channel("reels_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reels" }, fetchReels)
      .on("postgres_changes", { event: "*", schema: "public", table: "reel_likes" }, fetchReels)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from("reels")
        .select(`
          id,
          video_url,
          description,
          type,
          likes,
          created_at,
          user_id,
          profiles (full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReels(data || []);
    } catch (err) {
      console.error("Failed to fetch reels:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white">
        Loading reels...
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-gray-400">No reels yet.</p>
        <p className="text-sm text-gray-600">Workers can create reels to showcase their services.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-scroll snap-y snap-mandatory">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} onReelUpdate={fetchReels} />
      ))}
    </div>
  );
}

function ReelCard({ reel, onReelUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes || 0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!user) return;
    checkIfLiked();
    fetchComments();
  }, [reel.id, user]);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("reel_likes")
      .select("id")
      .eq("reel_id", reel.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setLiked(!!data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("reel_comments")
      .select("id, comment, profiles(full_name)")
      .eq("reel_id", reel.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  // ==================== FIXED LIKE FUNCTION ====================
  const toggleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        // Unlike
        await supabase
          .from("reel_likes")
          .delete()
          .eq("reel_id", reel.id)
          .eq("user_id", user.id);

        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from("reel_likes")
          .insert({ reel_id: reel.id, user_id: user.id });

        if (error && error.code !== "23505") throw error; // ignore duplicate

        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }

      // Refresh to get accurate count from database
      onReelUpdate();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    const { error } = await supabase
      .from("reel_comments")
      .insert({
        reel_id: reel.id,
        user_id: user.id,
        comment: newComment.trim(),
      });
    if (!error) {
      setNewComment("");
      fetchComments();
    }
  };

  const username = reel.profiles?.full_name || "Unknown";

  return (
    <div className="h-full snap-start w-full flex justify-center items-center relative bg-black">
      {/* VIDEO - Click to go to Worker Profile */}
      <video
        ref={videoRef}
        src={reel.video_url}
        autoPlay
        loop
        muted={muted}
        className="object-cover w-full h-full md:w-[40%] rounded-xl cursor-pointer"
        onClick={() => navigate(`/seller/${reel.user_id}`)}   // ← Click video to view profile
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 md:w-[40%] mx-auto" />

      {/* CONTENT */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full md:w-[40%] flex justify-between items-end px-4">
        <div>
          {/* Clickable Username + Avatar */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/seller/${reel.user_id}`)}
          >
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border-2 border-white">
              {reel.profiles?.avatar_url ? (
                <img src={reel.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">
                  {username[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">@{username}</h2>
              <p className="text-xs text-gray-400">Tap to view profile</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 mt-3">{reel.description}</p>

          <button
            onClick={() => navigate(reel.type === "product" ? "/productorder" : "/hire-worker")}
            className="mt-3 px-5 py-2 bg-white text-black rounded-full font-semibold text-sm"
          >
            {reel.type === "product" ? "Order Now" : "Book Now"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-5 text-white">
          <button onClick={toggleLike} className="flex flex-col items-center">
            <Heart
              size={32}
              className={`transition ${liked ? "text-red-500 fill-red-500" : ""}`}
            />
            <span className="text-xs mt-1">{likesCount}</span>
          </button>

          <button onClick={() => setShowComments(true)} className="flex flex-col items-center">
            <MessageCircle size={32} />
            <span className="text-xs mt-1">{comments.length}</span>
          </button>

          <button onClick={() => navigator.share?.({ url: window.location.href })}>
            <Share2 size={28} />
          </button>

          <button onClick={toggleMute}>
            {muted ? <VolumeX size={28} /> : <Volume2 size={28} />}
          </button>
        </div>
      </div>

      {/* COMMENTS PANEL - Same as before */}
      {showComments && (
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-white text-black rounded-t-2xl p-4 z-50">
          {/* ... your existing comments panel code (unchanged) ... */}
          <div className="flex justify-between mb-2">
            <h3 className="font-bold">Comments</h3>
            <button onClick={() => setShowComments(false)} className="text-gray-500">Close</button>
          </div>
          <div className="overflow-y-auto h-[65%] space-y-2 mb-4">
            {comments.length === 0 && <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>}
            {comments.map((c) => (
              <p key={c.id} className="text-sm border-b pb-1">
                <span className="font-semibold">{c.profiles?.full_name || "User"}: </span>
                {c.comment}
              </p>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              className="flex-1 border px-3 py-2 rounded-full text-sm outline-none"
            />
            <button
              onClick={handleAddComment}
              className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}