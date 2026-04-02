import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function PostViews() {
  const [posts, setPosts] = useState([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPostStats = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("posts")                          // ← Your posts table
        .select("id, views")
        .eq("worker_id", user.id);              // Only this worker's posts

      if (error) throw error;

      setPosts(data || []);

      // Calculate total views
      const total = (data || []).reduce((acc, post) => acc + (post.views || 0), 0);
      setTotalViews(total);

    } catch (err) {
      console.error("Error loading post stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#121826] p-4 rounded-lg text-white">
        <p className="text-gray-400">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] p-4 rounded-lg text-white">

      <h3 className="font-semibold mb-2">
        Post Views
      </h3>

      <p className="text-sm text-gray-400">
        {posts.length} Posts Uploaded
      </p>

      <p className="text-lg mt-2 font-medium">
        {totalViews.toLocaleString()} Total Views
      </p>

      <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-2 bg-green-500 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min((totalViews / 1000) * 100, 100)}%`   // Scale sensibly (adjust as needed)
          }}
        />
      </div>

      {posts.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Average views per post: {posts.length > 0 ? Math.round(totalViews / posts.length) : 0}
        </p>
      )}
    </div>
  );
}