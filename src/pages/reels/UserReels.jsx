import { useEffect, useState } from "react";

export default function UserReels({ userId }) {
  const [reels, setReels] = useState([]);

  useEffect(() => {
    // 🔥 later replace with supabase
    const mock = [
      {
        id: 1,
        video: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
      {
        id: 2,
        video: "https://www.w3schools.com/html/movie.mp4",
      },
    ];

    setReels(mock);
  }, [userId]);

  return (
    <div className="grid grid-cols-3 gap-1 mt-4">

      {reels.map((reel) => (
        <video
          key={reel.id}
          src={reel.video}
          className="w-full h-32 object-cover"
        />
      ))}

    </div>
  );
}