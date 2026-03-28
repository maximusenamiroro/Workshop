import { useState } from "react";

export default function CreateReel() {
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState("product");

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    const reelData = {
      video,
      caption,
      type,
      userId: "user-id-here", // 🔥 replace with supabase auth later
      createdAt: new Date(),
    };

    console.log("UPLOAD TO SUPABASE:", reelData);

    // 👉 later:
    // supabase.from("reels").insert([reelData])
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">

      <h1 className="text-xl font-bold mb-4">Create Reel</h1>

      {/* VIDEO PREVIEW */}
      {video && (
        <video src={video} className="w-full h-64 object-cover rounded-xl mb-4" controls />
      )}

      {/* UPLOAD */}
      <input type="file" accept="video/*" onChange={handleUpload} />

      {/* CAPTION */}
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write caption..."
        className="w-full mt-3 p-2 rounded bg-gray-800"
      />

      {/* TYPE */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full mt-3 p-2 rounded bg-gray-800"
      >
        <option value="product">Product</option>
        <option value="service">Service</option>
      </select>

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        className="w-full mt-4 bg-blue-600 py-2 rounded-xl"
      >
        Upload Reel
      </button>
    </div>
  );
}