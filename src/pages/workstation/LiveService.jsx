import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import WorkerCard from "../../components/WorkerCard";

export default function LiveService() {
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load worker profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setProfileLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("workers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading worker profile:", error);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  const goLive = async () => {
    if (!profile || !description.trim() || !price) {
      alert("Please fill in both description and price");
      return;
    }

    try {
      setLoading(true);

      const liveData = {
        worker_id: profile.id,
        name: profile.name,
        category: profile.category,
        location: profile.location,
        type: profile.type,
        hand_skill: profile.hand_skill,
        description: description.trim(),
        price: Number(price),
        live: true,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("live_workers")
        .upsert([liveData], { onConflict: "worker_id" });

      if (error) throw error;

      setIsLive(true);
      alert("✅ You are now Live! Clients can see you.");
    } catch (err) {
      console.error(err);
      alert("Failed to go live. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="bg-[#0B0F19] min-h-screen p-4 text-white flex items-center justify-center">
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#0B0F19] min-h-screen p-4 text-white flex items-center justify-center">
        <p>No worker profile found. Please complete your profile first.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] min-h-screen p-4 text-white">

      <h1 className="text-xl font-semibold mb-6">Go Live</h1>

      {/* Profile Info */}
      <div className="bg-[#121826] p-5 rounded-xl mb-6">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Category:</strong> {profile.category}</p>
        <p><strong>Location:</strong> {profile.location}</p>
        <p className="text-green-400 mt-3">
          {profile.type === "product" 
            ? "Product Seller" 
            : profile.hand_skill 
            ? "Skilled Worker" 
            : "General Worker"}
        </p>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">
          {profile.type === "product" ? "Product Name / Description" : "Service Description"}
        </label>
        <input
          type="text"
          placeholder={profile.type === "product" ? "e.g. iPhone Repair" : "Describe your service..."}
          className="w-full p-4 rounded-xl bg-[#121826] border border-gray-700 focus:border-green-500 outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Price */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm mb-2">
          {profile.type === "product" ? "Product Price (₦)" : "Service Price (₦)"}
        </label>
        <input
          type="number"
          placeholder="Enter amount"
          className="w-full p-4 rounded-xl bg-[#121826] border border-gray-700 focus:border-green-500 outline-none"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      {/* Go Live Button */}
      <button
        onClick={goLive}
        disabled={loading || !description.trim() || !price}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-700 disabled:cursor-not-allowed p-4 rounded-xl font-semibold text-lg transition"
      >
        {loading ? "Going Live..." : "Go Live Now"}
      </button>

      {/* Live Indicator */}
      {isLive && (
        <div className="mt-8 p-4 bg-green-900/30 border border-green-500 rounded-xl">
          <p className="text-green-400 text-center font-medium mb-3">
            ● You are currently Live
          </p>
          <WorkerCard
            worker={{
              name: profile.name,
              role: profile.category,
              location: profile.location,
              live: true,
            }}
          />
        </div>
      )}
    </div>
  );
}