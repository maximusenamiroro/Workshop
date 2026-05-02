import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Bookmark,
} from "lucide-react";
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
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [newComment, setNewComment] = useState("");
  const lastTapRef = useRef(0);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [workerProducts, setWorkerProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkIfLiked();
    checkIfSaved();
    fetchComments();
  }, [reel.id, user]);

  // Auto play with sound when visible
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.muted = false;
            video.play().catch(() => {
              // Browser blocked sound — play muted
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
      { threshold: 0.75 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from("reel_likes")
          .insert({ reel_id: reel.id, user_id: user.id });
        if (error && error.code !== "23505") throw error;
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
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const fetchWorkerProducts = async () => {
  setProductsLoading(true);
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, image_url, description, category")
      .eq("worker_id", reel.user_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setWorkerProducts(data || []);
  } catch (err) {
    console.error("fetchWorkerProducts error:", err.message);
  } finally {
    setProductsLoading(false);
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

 const handleOrderNow = (e) => {
  e.stopPropagation();
  setShowProductSheet(true);
  fetchWorkerProducts();
};

 const handleBookNow = (e) => {
  e.stopPropagation();
  navigate(`/hire-worker/${reel.user_id}`);
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
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />

      {/* Double tap heart */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Heart size={90} className="text-red-500 fill-red-500 animate-ping" />
        </div>
      )}

      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-white ml-1" />
          </div>
        </div>
      )}

      {/* BOTTOM CONTENT — pb-20 keeps above navbar */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 px-3 z-10 flex items-end gap-2">
        {/* LEFT — Profile + Description + Action */}
        <div className="flex-1 min-w-0 mr-2">
          {/* Profile */}
          <div
            className="flex items-center gap-2 cursor-pointer mb-2"
            onClick={(e) => {
              e.stopPropagation();
              goToProfile();
            }}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
              {reel.profiles?.avatar_url ? (
                <img
                  src={reel.profiles.avatar_url}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
                  {username[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm">@{username}</p>
              <p className="text-gray-300 text-xs">View profile →</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-white/90 text-xs leading-relaxed line-clamp-2 mb-3">
            {reel.description}
          </p>

          {/* Action buttons — only for clients viewing other workers */}
          {showActionButton && (
            <div className="flex mb-10 gap-2">
              {reel.type === "product" ? (
                // Product reel — show Order Now → goes to shop/worker profile
                <button
                  onClick={handleOrderNow}
                  className="bg-green-500 hover:bg-green-600 active:scale-95 text-white px-4 py-1.5 rounded-full font-semibold text-xs transition"
                >
                  🛍️ Order Now
                </button>
              ) : (
                // Service reel — show Book Now → goes to hire this worker
                <button
                  onClick={handleBookNow}
                  className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-4 py-1.5 rounded-full font-semibold text-xs transition"
                >
                  📅 Book Now
                </button>
              )}

              {/* Message worker */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/inbox?user=${reel.user_id}`);
                }}
                className="bg-white/20 hover:bg-white/30 active:scale-95 text-white px-4 py-1.5 rounded-full font-semibold text-xs transition backdrop-blur-sm"
              >
                💬 Message
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Action icons */}
        <div className="flex flex-col items-center gap-4 pb-5 flex-shrink-0">
          {/* Like */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
              <Heart
                size={19}
                className={`transition-all ${liked ? "text-red-500 fill-red-500 scale-110" : "text-white"}`}
              />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow">
              {likesCount}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(true);
            }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
              <MessageCircle size={19} className="text-white" />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow">
              {comments.length}
            </span>
          </button>

          {/* Save — clients only */}
          {role === "client" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSave();
              }}
              className="flex flex-col items-center gap-0.5"
            >
              <div className="w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
                <Bookmark
                  size={19}
                  className={`transition-all ${saved ? "text-yellow-400 fill-yellow-400" : "text-white"}`}
                />
              </div>
              <span className="text-white text-[11px] font-medium drop-shadow">
                {saved ? "Saved" : "Save"}
              </span>
            </button>
          )}

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.share?.({ url: window.location.href });
            }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
              <Share2 size={19} className="text-white" />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow">
              Share
            </span>
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="flex flex-col items-center gap-0.5"
          >
            <div
              className={`w-8 h-8 backdrop-blur rounded-full flex items-center justify-center transition ${muted ? "bg-red-500/50" : "bg-black/40"}`}
            >
              {muted ? (
                <VolumeX size={19} className="text-white" />
              ) : (
                <Volume2 size={19} className="text-white" />
              )}
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow">
              {muted ? "Muted" : "Sound"}
            </span>
          </button>
        </div>
      </div>

      {/* COMMENTS PANEL */}
      {showComments && (
        <div
          className="absolute inset-0 z-50 bg-black/60"
          onClick={() => setShowComments(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 h-[70%] bg-zinc-900 rounded-t-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-base font-bold">
                Comments
                {comments.length > 0 && (
                  <span className="text-gray-400 text-sm font-normal ml-1">
                    ({comments.length})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 text-sm"
              >
                Close
              </button>
            </div>

            <div className="h-[calc(100%-140px)] overflow-y-auto space-y-3 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="text-gray-400 text-sm">
                    No comments yet. Be the first!
                  </p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                      {c.profiles?.full_name?.[0] || "U"}
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2">
                      <p className="text-green-400 text-xs font-semibold mb-0.5">
                        {c.profiles?.full_name || "User"}
                      </p>
                      <p className="text-white text-sm">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-zinc-800 border border-white/10 text-white placeholder-gray-500 px-4 py-2.5 rounded-full text-sm outline-none focus:border-green-500 transition"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-green-500 disabled:bg-gray-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition active:scale-95"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

{/* PRODUCT SHEET — slides up when Order Now tapped */}
{showProductSheet && (
  <div
    className="absolute inset-0 z-50 bg-black/60 flex items-end"
    onClick={() => setShowProductSheet(false)}
  >
    <div
      className="w-full bg-zinc-900 rounded-t-3xl max-h-[75%] flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Handle */}
      <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700">
            {reel.profiles?.avatar_url ? (
              <img src={reel.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                {username[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">@{username}</p>
            <p className="text-xs text-green-400">Products</p>
          </div>
        </div>
        <button onClick={() => setShowProductSheet(false)} className="text-gray-400 p-2">✕</button>
      </div>

      {/* Products list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {productsLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workerProducts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-gray-400 text-sm">No products listed yet</p>
            <button
              onClick={() => { setShowProductSheet(false); navigate(`/seller-profile/${reel.user_id}`); }}
              className="mt-3 text-green-400 text-sm underline"
            >
              View Profile →
            </button>
          </div>
        ) : (
          workerProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => { setShowProductSheet(false); navigate(`/product/${product.id}`); }}
              className="flex gap-3 bg-zinc-800 rounded-2xl p-3 cursor-pointer hover:bg-zinc-700 active:scale-[0.98] transition-all"
            >
              {/* Product image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-700 flex-shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm line-clamp-1">{product.title}</p>
                {product.description && (
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{product.description}</p>
                )}
                <p className="text-green-400 font-bold text-sm mt-1">
                  {product.price ? `₦${Number(product.price).toLocaleString()}` : "Price on request"}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex items-center text-gray-500">
                <span className="text-lg">›</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => { setShowProductSheet(false); navigate(`/seller-profile/${reel.user_id}`); }}
          className="w-full bg-white/10 hover:bg-white/15 py-3 rounded-2xl text-sm font-semibold transition active:scale-95"
        >
          View Full Profile →
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
