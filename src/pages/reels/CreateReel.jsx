import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function CreateReel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("service");
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!video) return alert("Please upload a video");
    if (!description.trim()) return alert("Please add a description");

    setUploading(true);
    try {
      // 1. Upload video to Supabase Storage
      const fileExt = video.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(fileName, video);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from("reels")
        .getPublicUrl(fileName);

      // 3. Insert reel record
      const { error: insertError } = await supabase.from("reels").insert({
        user_id: user.id,
        video_url: urlData.publicUrl,
        description: description.trim(),
        type,
        likes: 0,
      });

      if (insertError) throw insertError;

      alert("✅ Reel posted successfully!");
      navigate("/seller-profile");
    } catch (err) {
      console.error("Upload error:", err.message);
      alert("Failed to post reel: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold">Create Reel</h1>
      </div>

      {/* VIDEO PREVIEW */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm aspect-[9/16] bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
          {preview ? (
            <video
              src={preview}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
            />
          ) : (
            <div className="flex flex-col items-center text-white/40 gap-2">
              <span className="text-5xl">🎥</span>
              <p className="text-sm">Upload a video</p>
            </div>
          )}
        </div>
      </div>

      {/* FILE INPUT */}
      <label className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-center text-sm font-semibold cursor-pointer transition">
        {video ? `📹 ${video.name}` : "Choose Video"}
        <input
          type="file"
          accept="video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      {/* TYPE SELECTOR */}
      <div className="flex gap-3">
        <button
          onClick={() => setType("service")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
            type === "service" ? "bg-green-600" : "bg-white/10"
          }`}
        >
          Service
        </button>
        <button
          onClick={() => setType("product")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
            type === "product" ? "bg-green-600" : "bg-white/10"
          }`}
        >
          Product
        </button>
      </div>

      {/* DESCRIPTION */}
      <textarea
        placeholder="Describe your service or product..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="bg-white/10 p-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none resize-none"
      />

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-xl font-semibold transition"
      >
        {uploading ? "Posting..." : "Post Reel"}
      </button>
    </div>
  );
}