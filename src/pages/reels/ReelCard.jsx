import React, { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function ReelCard({ reel, onReelUpdate }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes || 0);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!user) return;
    checkIfLiked();
    checkIfSaved();
    fetchComments();
  }, [reel.id, user]);

  // Auto play when visible
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.muted = muted;
            video.play().catch(() => {});
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.75 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [muted]);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("reel_likes")
      .select("id")
      .eq("reel_id", reel.id)
      .eq("user_id", user.id)
      .maybeSingle();
    setLiked(!!data);
  };

  const checkIfSaved = async () => {
    const { data } = await supabase
      .from("saved_reels")
      .select("id")
      .eq("reel_id", reel.id)
      .eq("user_id", user.id)
      .maybeSingle();
    setSaved(!!data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("reel_comments")
      .select("id, comment, profiles(full_name)")
      .eq("reel_id", reel.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const toggleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        await supabase.from("reel_likes").delete()
          .eq("reel_id", reel.id).eq("user_id", user.id);
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase.from("reel_likes").insert({ reel_id: reel.id, user_id: user.id });
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
      onReelUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && !liked) {
      toggleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTapRef.current = now;
  };

  const toggleSave = async () => {
    if (!user) return;
    try {
      if (saved) {
        await supabase.from("saved_reels").delete()
          .eq("reel_id", reel.id).eq("user_id", user.id);
        setSaved(false);
      } else {
        await supabase.from("saved_reels").insert({ user_id: user.id, reel_id: reel.id });
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !muted;
      videoRef.current.muted = newMuted;
      setMuted(newMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from("reel_comments").insert({
      reel_id: reel.id,
      user_id: user.id,
      comment: newComment.trim(),
    });
    setNewComment("");
    fetchComments();
  };

  const goToProfile = () => navigate(`/seller-profile/${reel.user_id}`);
  const username = reel.profiles?.full_name || "Unknown";
  const isOwnReel = user?.id === reel.user_id;
  const showActionButton = !isOwnReel && role === "client";

  return (
 <div
  ref={containerRef}
  className="h-full w-full relative bg-black overflow-hidden"
  onClick={handleDoubleTap}
>
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        muted={muted}
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Double Tap Heart */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Heart size={90} className="text-red-500 fill-red-500 animate-ping" />
        </div>
      )}

      {/* Bottom Content */}
      <div className="absolute bottom-20 left-4 right-16 z-10">
        {showActionButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(reel.type === "product" ? "/shop" : "/hire-worker");
            }}
            className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-full text-white font-semibold mb-3"
          >
            {reel.type === "product" ? "🛍️ Order Now" : "📅 Book Now"}
          </button>
        )}

        <div
          className="flex items-center gap-3 mb-3 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); goToProfile(); }}
        >
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white">
            {reel.profiles?.avatar_url ? (
              <img src={reel.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white font-bold">
                {username[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-bold">@{username}</p>
            <p className="text-gray-300 text-xs">View profile →</p>
          </div>
        </div>

        <p className="text-white text-sm line-clamp-2">{reel.description}</p>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-28 z-10 flex flex-col items-center gap-6">
        {/* Like */}
        <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} className="flex flex-col items-center">
          <div className="w-12 h-12 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
            <Heart size={28} className={liked ? "text-red-500 fill-red-500" : "text-white"} />
          </div>
          <span className="text-white text-xs mt-1">{likesCount}</span>
        </button>

        {/* Comment */}
        <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center">
          <div className="w-12 h-12 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
            <MessageCircle size={28} className="text-white" />
          </div>
          <span className="text-white text-xs mt-1">{comments.length}</span>
        </button>

        {/* Save */}
        {role === "client" && (
          <button onClick={(e) => { e.stopPropagation(); toggleSave(); }} className="flex flex-col items-center">
            <div className="w-12 h-12 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
              <Bookmark size={28} className={saved ? "text-yellow-400 fill-yellow-400" : "text-white"} />
            </div>
            <span className="text-white text-xs mt-1">Save</span>
          </button>
        )}

        {/* Mute */}
        <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="flex flex-col items-center">
          <div className="w-12 h-12 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
            {muted ? <VolumeX size={28} className="text-white" /> : <Volume2 size={28} className="text-white" />}
          </div>
          <span className="text-white text-xs mt-1">{muted ? "Muted" : "Sound"}</span>
        </button>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="absolute inset-0 z-50 bg-black/70" onClick={() => setShowComments(false)}>
          <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-zinc-900 rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
            <h3 className="text-white text-lg font-bold mb-4">Comments ({comments.length})</h3>

            <div className="h-[calc(100%-140px)] overflow-y-auto space-y-4 mb-4">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm">
                      {c.profiles?.full_name?.[0]}
                    </div>
                    <div>
                      <p className="text-green-400 text-sm font-medium">{c.profiles?.full_name}</p>
                      <p className="text-white text-sm">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add comment..."
                className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-full outline-none"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-green-500 px-6 rounded-full text-white font-semibold disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}