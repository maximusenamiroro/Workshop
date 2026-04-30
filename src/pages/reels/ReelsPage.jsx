import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "../../lib/supabaseClient";

const LazyReelCard = React.lazy(() => import("./ReelCard"));

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
    <div className="h-full w-full bg-black flex">

      {/* Desktop — centered column with side padding */}
      <div
        className="
           w-full md:w-[420px] md:mx-auto
    h-full overflow-y-scroll
    snap-y snap-mandatory scroll-smooth
    relative
        "
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
              <LazyReelCard reel={reel} onReelUpdate={fetchReels} />
            </Suspense>
          </div>
        ))}
      </div>

      {/* Desktop side fill — dark background */}
      <div className="hidden md:block flex-1 bg-zinc-950" />
    </div>
  );
}