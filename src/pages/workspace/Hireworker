import { useParams, useNavigate } from "react-router-dom";
import workers from "../data/dummyWorkers";
import { useState } from "react";

export default function HireWorker() {
  const { id } = useParams();
  const navigate = useNavigate();

  const worker = workers.find(w => w.id == id);

  const [job, setJob] = useState("");
  const [location, setLocation] = useState("");

  const handleHire = () => {
    if (!job || !location) {
      alert("Please fill job and location");
      return;
    }

    alert("Hire request sent successfully");

    navigate("/booking");
  };

  return (
    <div>

      <h1 className="text-2xl font-bold mb-6">
        Hire Worker
      </h1>

      <div className="bg-[#101623] p-6 rounded-xl">

        {/* Worker Info */}
        <div className="flex items-center gap-4 mb-6">

          <img
            src={worker.image}
            className="w-16 h-16 rounded-full"
          />

          <div>
            <h2 className="font-bold">
              {worker.name}
            </h2>

            <p className="text-gray-400">
              {worker.role}
            </p>

            <p className="text-green-400">
              🟢 Live
            </p>
          </div>

        </div>

        {/* Job */}
        <div className="mb-4">

          <label className="text-gray-400 text-sm">
            What do you want this worker to do?
          </label>

          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Describe the job..."
            className="w-full p-3 mt-2 bg-[#141B2D] rounded"
          />

        </div>

        {/* Location */}
        <div className="mb-6">

          <label className="text-gray-400 text-sm">
            Location
          </label>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
            className="w-full p-3 mt-2 bg-[#141B2D] rounded"
          />

        </div>

        {/* Button */}
        <button
          onClick={handleHire}
          className="w-full bg-blue-600 p-3 rounded-lg"
        >
          Hire Now
        </button>

      </div>
    </div>
  );
}
