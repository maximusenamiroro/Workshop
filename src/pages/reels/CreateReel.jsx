import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

export default function CreateReel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, ToastUI } = useToast();
  

  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("service");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file");
      return;
    }

    // Warn if file is large
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 50) {
      setError(`File is ${sizeMB.toFixed(1)}MB — please use a video under 50MB for faster upload`);
      return;
    }

    setError("");
    setVideo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!video) return setError("Please upload a video");
    if (!description.trim()) return setError("Please add a description");

    setUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      // Get fresh auth user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const fileExt = video.name.split(".").pop().toLowerCase();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;

      setUploadProgress(10);

      // Upload video to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("reels")
        .upload(fileName, video, {
          cacheControl: "3600",
          upsert: false,
          contentType: video.type,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(uploadError.message || "Upload failed");
      }

      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("reels")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) throw new Error("Failed to get video URL");

      setUploadProgress(90);

      // Insert reel record
      const { error: insertError } = await supabase.from("reels").insert({
        user_id: currentUser.id,
        video_url: urlData.publicUrl,
        description: description.trim(),
        type,
        likes: 0,
      });

      if (insertError) throw new Error(insertError.message || "Failed to save reel");

      setUploadProgress(100);

     showToast("✅ Reel posted successfully!");
      navigate("/seller-profile");
    } catch (err) {
      console.error("Upload error:", err.message);
      setError(err.message || "Failed to post reel. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleUpload(fakeEvent);
    }
  };

  const sizeMB = video ? (video.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="h-full overflow-y-auto bg-black text-white p-4 pb-24 flex flex-col gap-4">
    <ToastUI/>
      {/* HEADER */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white p-2 active:scale-90 transition-transform"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">Create Reel</h1>
      </div>

      {/* VIDEO PREVIEW / DROP ZONE */}
      <div
        className="flex justify-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div
          onClick={() => !preview && inputRef.current?.click()}
          className={`w-full max-w-sm aspect-[9/16] bg-white/5 border-2 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200 ${
            preview
              ? "border-green-500/50"
              : "border-dashed border-white/20 cursor-pointer hover:border-green-500/50 hover:bg-white/10"
          }`}
        >
          {preview ? (
            <video
              src={preview}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <div className="flex flex-col items-center text-white/40 gap-3 p-6 text-center">
              <span className="text-6xl">🎥</span>
              <p className="text-sm font-medium">Tap to select video</p>
              <p className="text-xs">or drag and drop here</p>
              <p className="text-xs text-white/20">Max 50MB • MP4, MOV, WebM</p>
            </div>
          )}
        </div>
      </div>

      {/* FILE INFO */}
      {video && (
        <div className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium truncate max-w-[200px]">{video.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sizeMB} MB</p>
          </div>
          <button
            onClick={() => {
              setVideo(null);
              setPreview(null);
              setError("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-red-400 text-xs bg-red-400/10 px-3 py-1 rounded-lg hover:bg-red-400/20 transition"
          >
            Remove
          </button>
        </div>
      )}

      {/* FILE INPUT */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleUpload}
        className="hidden"
      />

      {/* Choose button if no video */}
      {!video && (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-semibold cursor-pointer transition active:scale-[0.98]"
        >
          📹 Choose Video
        </button>
      )}

      {/* TYPE SELECTOR */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Reel Type</p>
        <div className="flex gap-3">
          <button
            onClick={() => setType("service")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition active:scale-[0.96] ${
              type === "service"
                ? "bg-green-600 text-white"
                : "bg-white/10 text-gray-400"
            }`}
          >
            🛠️ Service
          </button>
          <button
            onClick={() => setType("product")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition active:scale-[0.96] ${
              type === "product"
                ? "bg-green-600 text-white"
                : "bg-white/10 text-gray-400"
            }`}
          >
            📦 Product
          </button>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Description</p>
        <textarea
          placeholder="Describe your service or product..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full bg-white/10 p-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none resize-none border border-white/10 focus:border-green-500/50 transition"
        />
        <p className="text-xs text-gray-600 text-right mt-1">
          {description.length}/300
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* UPLOAD PROGRESS */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              {uploadProgress < 80
                ? "Uploading video..."
                : uploadProgress < 90
                  ? "Processing..."
                  : "Saving reel..."}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        disabled={uploading || !video || !description.trim()}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 py-4 rounded-2xl font-semibold transition active:scale-[0.97] text-base"
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading... {uploadProgress}%
          </span>
        ) : (
          "🚀 Post Reel"
        )}
      </button>

      {/* Tips */}
      <div className="bg-white/5 rounded-xl p-4 space-y-1">
        <p className="text-xs text-gray-400 font-semibold mb-2">💡 Tips for faster upload:</p>
        <p className="text-xs text-gray-500">• Keep videos under 30MB for best speed</p>
        <p className="text-xs text-gray-500">• Use MP4 format (most compatible)</p>
        <p className="text-xs text-gray-500">• Vertical videos (9:16) look best</p>
        <p className="text-xs text-gray-500">• Keep it under 60 seconds</p>
      </div>
    </div>
  );
}