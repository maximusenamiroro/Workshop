import { useState, useEffect } from "react";
import WorkerCard from "../../components/WorkerCard";

export default function LiveService() {

  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("workstationProfile");

    if (stored) {
      setProfile(JSON.parse(stored));
    }
  }, []);

  const goLive = () => {

    if (!profile) return;

    const liveData = {
      id: Date.now(),
      name: profile.name,
      category: profile.category,
      location: profile.location,
      type: profile.type,
      handSkill: profile.handSkill,
      description,
      price,
      live: true
    };

    const existing =
      JSON.parse(localStorage.getItem("workspaceLiveWorkers")) || [];

    existing.push(liveData);

    localStorage.setItem(
      "workspaceLiveWorkers",
      JSON.stringify(existing)
    );

    setIsLive(true);

    alert("You are now live in Workspace!");
  };

  if (!profile) {
    return (
      <div className="text-white p-4">
        No profile found. Register first.
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] min-h-screen p-4 text-white">

      <h1 className="text-xl font-semibold mb-4">
        Live Service
      </h1>

      {/* Profile Info */}
      <div className="bg-[#121826] p-4 rounded-lg mb-4">

        <p>Name: {profile.name}</p>
        <p>Category: {profile.category}</p>
        <p>Location: {profile.location}</p>

        <p className="text-green-400 mt-2">
          {profile.type === "product"
            ? "Product Seller"
            : profile.handSkill
            ? "Hand Skill Worker"
            : "Available for Hire"}
        </p>

      </div>

      {/* Description */}
      <input
        type="text"
        placeholder={
          profile.type === "product"
            ? "Product name"
            : "Service description"
        }
        className="w-full p-3 rounded bg-[#121826] mb-3"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Price */}
      <input
        type="number"
        placeholder={
          profile.type === "product"
            ? "Product price"
            : "Service price"
        }
        className="w-full p-3 rounded bg-[#121826] mb-4"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      {/* Go Live Button */}
      <button
        onClick={goLive}
        className="w-full bg-green-500 p-3 rounded-lg font-semibold"
      >
        Go Live
      </button>

      {/* Live Indicator */}
      {isLive && (
        <div className="mt-4">

          <p className="text-green-400 mb-2">
            You are Live
          </p>

          <WorkerCard
            worker={{
              name: profile.name,
              role: profile.category,
              location: profile.location,
              live: true
            }}
          />

        </div>
      )}
    </div>
  );
}
