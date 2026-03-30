import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateReel() {
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!video) return alert("Upload a video");

    const newReel = {
      id: Date.now(),
      video: preview, // ⚠️ temp (Supabase later)
      description,
      userId: "seller123",
    };

    const existing = JSON.parse(localStorage.getItem("reels")) || [];
    localStorage.setItem("reels", JSON.stringify([newReel, ...existing]));

    navigate("/profile/seller123");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col gap-4">

      <h1 className="text-lg font-bold">Create Reel</h1>

      {/* PREVIEW */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm aspect-[9/16] bg-black rounded-xl overflow-hidden">

          {preview ? (
            <video
              src={preview}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/40">
              Upload Video
            </div>
          )}

        </div>
      </div>

      <input type="file" accept="video/*" onChange={handleUpload} />

      <textarea
        placeholder="Caption..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-white/10 p-3 rounded-lg"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 py-3 rounded-lg"
      >
        Post Reel
      </button>

    </div>
  );
}