import { useEffect, useState } from "react";

export default function PostViews() {

  const [posts, setPosts] = useState([]);
  const [views, setViews] = useState(0);

  useEffect(() => {

    const storedPosts =
      JSON.parse(localStorage.getItem("workstationPosts")) || [];

    setPosts(storedPosts);

    const totalViews = storedPosts.reduce(
      (acc, post) => acc + (post.views || 0),
      0
    );

    setViews(totalViews);

  }, []);

  return (
    <div className="bg-[#121826] p-4 rounded-lg text-white">

      <h3 className="font-semibold mb-2">
        Post Views
      </h3>

      <p className="text-sm text-gray-400">
        {posts.length} Posts Uploaded
      </p>

      <p className="text-lg mt-2">
        {views} Total Views
      </p>

      <div className="mt-3 h-2 bg-gray-700 rounded">
        <div
          className="h-2 bg-green-500 rounded"
          style={{
            width: `${Math.min(views, 100)}%`
          }}
        />
      </div>

    </div>
  );
}
