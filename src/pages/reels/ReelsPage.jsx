import React, { useState, useRef, useEffect, useCallback } from "react";
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
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reels"
      }, fetchReels)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from("reels")
        .select(`
          id, video_url, description, type,
          likes, created_at, user_id,
          profiles(full_name, avatar_url)
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

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-black text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (reels.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center bg-black text-white gap-4">
      <p className="text-gray-400">No reels yet.</p>
      <p className="text-sm text-gray-600">Workers can create reels to showcase their services.</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-scroll snap-y snap-mandatory">
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
  const [muted, setMuted] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkIfLiked();
    checkIfSaved();
    fetchComments();
  }, [reel.id, user]);

  // Auto play when visible using IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
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

  // Sync likes count when reel prop updates
  useEffect(() => {
    setLikesCount(reel.likes || 0);
  }, [reel.likes]);

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
        await supabase
          .from("reel_likes")
          .delete()
          .eq("reel_id", reel.id)
          .eq("user_id", user.id);
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from("reel_likes")
          .insert({ reel_id: reel.id, user_id: user.id });
        if (error && error.code !== "23505") throw error;
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
      // Refresh to sync DB count
      onReelUpdate();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const toggleSave = async () => {
    if (!user) return;
    try {
      if (saved) {
        await supabase
          .from("saved_reels")
          .delete()
          .eq("reel_id", reel.id)
          .eq("user_id", user.id);
        setSaved(false);
      } else {
        await supabase
          .from("saved_reels")
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

  const goToProfile = () => navigate(`/seller-profile/${reel.user_id}`);
  const username = reel.profiles?.full_name || "Unknown";

  // Worker sees their own reel — no order/book button
  const isOwnReel = user?.id === reel.user_id;
  const showActionButton = !isOwnReel && role === "client";

  return (
    <div
      ref={containerRef}
      className="h-full snap-start w-full flex justify-center items-center relative bg-black"
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        className="object-cover w-full h-full md:w-[40%] rounded-xl cursor-pointer"
      />

      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[20px] border-l-white ml-1" />
          </div>
        </div>
      )}

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 md:w-[40%] mx-auto pointer-events-none" />

      {/* BOTTOM CONTENT */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full md:w-[40%] flex justify-between items-end px-4">

        {/* LEFT — Profile + Description + Action */}
        <div className="flex-1 mr-4">

          {/* Profile — click to go to seller profile */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={goToProfile}
          >
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border-2 border-white flex items-center justify-center">
              {reel.profiles?.avatar_url ? (
                <img
                  src={reel.profiles.avatar_url}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {username[0]}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">@{username}</h2>
              <p className="text-xs text-gray-400">View profile</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 mt-2 line-clamp-2">
            {reel.description}
          </p>

          {/* Order/Book button — only for clients viewing other workers */}
          {showActionButton && (
            <button
              onClick={() =>
                navigate(reel.type === "product" ? "/shop" : "/hire-worker")
              }
              className="mt-3 px-5 py-2 bg-white text-black rounded-full font-semibold text-sm"
            >
              {reel.type === "product" ? "Order Now" : "Book Now"}
            </button>
          )}
        </div>

        {/* RIGHT — Action buttons */}
        <div className="flex flex-col items-center gap-5 text-white">

          {/* Like */}
          <button onClick={toggleLike} className="flex flex-col items-center">
            <Heart
              size={28}
              className={`transition ${liked ? "text-red-500 fill-red-500" : "text-white"}`}
            />
            <span className="text-xs mt-1">{likesCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center"
          >
            <MessageCircle size={28} />
            <span className="text-xs mt-1">{comments.length}</span>
          </button>

          {/* Save — clients only */}
          {role === "client" && (
            <button onClick={toggleSave} className="flex flex-col items-center">
              <Bookmark
                size={28}
                className={`transition ${saved ? "text-yellow-400 fill-yellow-400" : "text-white"}`}
              />
              <span className="text-xs mt-1">{saved ? "Saved" : "Save"}</span>
            </button>
          )}

          {/* Share */}
          <button
            onClick={() => navigator.share?.({ url: window.location.href })}
            className="flex flex-col items-center"
          >
            <Share2 size={28} />
          </button>

          {/* Mute */}
          <button onClick={toggleMute} className="flex flex-col items-center">
            {muted ? <VolumeX size={28} /> : <Volume2 size={28} />}
          </button>
        </div>
      </div>

      {/* COMMENTS PANEL */}
      {showComments && (
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-white text-black rounded-t-2xl p-4 z-50 md:w-[40%] md:left-1/2 md:-translate-x-1/2">
          <div className="flex justify-between mb-2">
            <h3 className="font-bold">Comments</h3>
            <button
              onClick={() => setShowComments(false)}
              className="text-gray-500"
            >
              Close
            </button>
          </div>

          <div className="overflow-y-auto h-[65%] space-y-2 mb-4">
            {comments.length === 0 && (
              <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
            )}
            {comments.map((c) => (
              <p key={c.id} className="text-sm border-b pb-1">
                <span className="font-semibold">
                  {c.profiles?.full_name || "User"}:{" "}
                </span>
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