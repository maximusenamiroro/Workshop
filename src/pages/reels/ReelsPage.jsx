import React, { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();
    const channel = supabase
      .channel("reels_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reels" }, fetchReels)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from("reels")
        .select(`id, video_url, description, type, likes, created_at, user_id, profiles(full_name, avatar_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReels(data || []);
    } catch (err) {
      console.error("Failed to fetch reels:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (reels.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
      <p className="text-5xl">🎬</p>
      <p className="text-gray-400">No reels yet</p>
      <p className="text-sm text-gray-600">Workers can create reels to showcase their services.</p>
    </div>
  );

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} onReelUpdate={fetchReels} />
      ))}
    </div>
  );
}

function ReelCard({ reel, onReelUpdate }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes || 0);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(false); // Sound ON by default
  const [newComment, setNewComment] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

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
            video.muted = false; // Try to play with sound
            video.play().catch(() => {
              // Browser blocked autoplay with sound — fallback to muted
              video.muted = true;
              setMuted(true);
              video.play().catch(() => {});
            });
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.7 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLikesCount(reel.likes || 0);
  }, [reel.likes]);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("reel_likes").select("id")
      .eq("reel_id", reel.id).eq("user_id", user.id).maybeSingle();
    setLiked(!!data);
  };

  const checkIfSaved = async () => {
    const { data } = await supabase
      .from("saved_reels").select("id")
      .eq("reel_id", reel.id).eq("user_id", user.id).maybeSingle();
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
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase.from("reel_likes")
          .insert({ reel_id: reel.id, user_id: user.id });
        if (error && error.code !== "23505") throw error;
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
      onReelUpdate();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // Double tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) {
        toggleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
      }
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
        await supabase.from("saved_reels")
          .insert({ user_id: user.id, reel_id: reel.id });
        setSaved(true);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    const { error } = await supabase.from("reel_comments").insert({
      reel_id: reel.id,
      user_id: user.id,
      comment: newComment.trim(),
    });
    if (!error) {
      setNewComment("");
      fetchComments();
    }
  };

  const goToProfile = () => navigate(`/seller-profile/${reel.user_id}`);
  const username = reel.profiles?.full_name || "Unknown";
  const isOwnReel = user?.id === reel.user_id;
  const showActionButton = !isOwnReel && role === "client";
  
  return (
    <div
      ref={containerRef}
      className="h-[calc(100dvh-80px)] md:h-[100dvh] snap-start w-full relative bg-black overflow-hidden flex items-center justify-center"
      onClick={handleDoubleTap}
    >
      {/* VIDEO — full screen */}
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        muted={muted}
        playsInline
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
      className="absolute inset-0 w-full h-full object-contain bg-black"
      />

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Double tap heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart
            size={80}
            className="text-red-500 fill-red-500 animate-ping opacity-90"
          />
        </div>
      )}

      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[22px] border-l-white ml-1" />
          </div>
        </div>
      )}

      {/* BOTTOM LEFT — Profile + Description + Action */}
      <div className="absolute bottom-20 left-4 right-16 z-10">


{/* Action button */}
        {showActionButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(reel.type === "product" ? "/shop" : "/hire-worker");
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 mb-2.5 rounded-full font-semibold text-sm transition"
          >
            {reel.type === "product" ? "🛍️ Order Now" : "📅 Book Now"}
          </button>
        )}


        {/* Profile */}
        <div
          className="flex items-center gap-2 cursor-pointer mb-3"
          onClick={(e) => { e.stopPropagation(); goToProfile(); }}
        >
          <div className="w-11 h-11 rounded-full bg-gray-600 overflow-hidden border-2 border-white flex-shrink-0">
            {reel.profiles?.avatar_url ? (
              <img src={reel.profiles.avatar_url} alt={username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {username[0]}
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-white text-sm">@{username}</p>
            <p className="text-gray-300 text-xs">View profile →</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-white text-sm leading-relaxed line-clamp-2 mb-3 drop-shadow">
          {reel.description}
        </p>

        
      </div>

      {/* RIGHT SIDE — Action buttons like TikTok */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-5">

        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart
              size={24}
              className={`transition-all ${liked ? "text-red-500 fill-red-500 scale-110" : "text-white"}`}
            />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">{likesCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <MessageCircle size={24} className="text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">{comments.length}</span>
        </button>

        {/* Save — clients only */}
        {role === "client" && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleSave(); }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Bookmark
                size={24}
                className={`transition-all ${saved ? "text-yellow-400 fill-yellow-400" : "text-white"}`}
              />
            </div>
            <span className="text-white text-xs font-medium drop-shadow">{saved ? "Saved" : "Save"}</span>
          </button>
        )}

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); navigator.share?.({ url: window.location.href }); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Share2 size={24} className="text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">Share</span>
        </button>

        {/* Mute/Unmute */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-11 h-11 backdrop-blur-sm rounded-full flex items-center justify-center transition ${muted ? "bg-red-500/40" : "bg-black/30"}`}>
            {muted
              ? <VolumeX size={24} className="text-white" />
              : <Volume2 size={24} className="text-white" />
            }
          </div>
          <span className="text-white text-xs font-medium drop-shadow">{muted ? "Muted" : "Sound"}</span>
        </button>
      </div>

      {/* COMMENTS PANEL */}
      {showComments && (
        <div
          className="absolute inset-0 z-50"
          onClick={() => setShowComments(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 h-[65%] bg-zinc-900 rounded-t-3xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">
                Comments {comments.length > 0 && <span className="text-gray-400 text-sm font-normal">({comments.length})</span>}
              </h3>
              <button onClick={() => setShowComments(false)} className="text-gray-400 text-sm">
                Close
              </button>
            </div>

            <div className="overflow-y-auto h-[55%] space-y-3 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {c.profiles?.full_name?.[0] || "U"}
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2">
                      <p className="text-xs text-green-400 font-semibold mb-0.5">
                        {c.profiles?.full_name || "User"}
                      </p>
                      <p className="text-sm text-white">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                className="flex-1 bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-2.5 rounded-full text-sm outline-none focus:border-green-500 transition"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-700 text-white px-4 py-2.5 rounded-full text-sm font-semibold transition active:scale-95"
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