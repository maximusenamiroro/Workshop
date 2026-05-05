import React, { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "../../lib/supabaseClient";

const LazyReelCard = React.lazy(() => import("./ReelCard"));

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    fetchReels();
    setupRealtime();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from("reels")
        .select(`
          id, video_url, description, type, created_at, user_id,
          profiles(full_name, avatar_url),
          reel_likes(id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Compute like count from reel_likes array — accurate and always fresh
      const reelsWithCounts = (data || []).map(r => ({
        ...r,
        likes: r.reel_likes?.length || 0,
      }));

      setReels(reelsWithCounts);
    } catch (err) {
      console.error("Failed to fetch reels:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    // Watch reel_likes inserts/deletes to update counts without refetching everything
    channelRef.current = supabase
      .channel("reels_likes_realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reel_likes",
      }, (payload) => {
        const { reel_id } = payload.new;
        setReels(prev =>
          prev.map(r => r.id === reel_id
            ? { ...r, likes: r.likes + 1 }
            : r
          )
        );
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "reel_likes",
      }, (payload) => {
        const { reel_id } = payload.old;
        setReels(prev =>
          prev.map(r => r.id === reel_id
            ? { ...r, likes: Math.max(0, r.likes - 1) }
            : r
          )
        );
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reels",
      }, () => {
        // New reel posted — refetch to get it
        fetchReels();
      })
      .subscribe();
  };

  // Called by ReelCard when it toggles a like locally
  // We update just that one reel's count in state — no full refetch
  const handleLikeUpdate = (reelId, delta) => {
    setReels(prev =>
      prev.map(r => r.id === reelId
        ? { ...r, likes: Math.max(0, r.likes + delta) }
        : r
      )
    );
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
    <div className="h-full w-full bg-black flex">
      <div
        className="w-full md:w-[420px] md:mx-auto h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth relative"
        style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {reels.map((reel) => (
          <div
            key={reel.id}
            className="h-full w-full flex-shrink-0 snap-start relative bg-black overflow-hidden"
          >
            <Suspense fallback={
              <div className="h-full w-full bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <LazyReelCard
                reel={reel}
                onLikeUpdate={handleLikeUpdate}
              />
            </Suspense>
          </div>
        ))}
      </div>
      <div className="hidden md:block flex-1 bg-zinc-950" />
    </div>
  );
}