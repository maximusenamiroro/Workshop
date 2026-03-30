import { useNavigate } from "react-router-dom";

export default function WorkerCard({ worker }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#101623] hover:bg-[#141B2D] transition-all duration-200 p-4 rounded-xl flex items-center justify-between mb-3 shadow-sm">

      {/* Left Section */}
      <div className="flex items-center gap-3">

        {/* Profile Image */}
        <div className="relative">

          <img
            src={worker.image}
            alt={worker.name}
            className="w-12 h-12 rounded-full object-cover"
          />

          {/* Live Indicator */}
          {worker.live && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#101623] rounded-full animate-pulse"></span>
          )}

        </div>

        {/* Worker Info */}
        <div>

          <h3 className="text-white font-semibold">
            {worker.name}
          </h3>

          <p className="text-gray-400 text-sm">
            {worker.role}
          </p>

          {/* Live and Distance */}
          <div className="flex items-center gap-2 text-xs mt-1">

            {worker.live ? (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live
              </span>
            ) : (
              <span className="text-gray-500">
                Offline
              </span>
            )}

            <span className="text-gray-500">
              • {worker.distance}
            </span>

          </div>

        </div>
      </div>

      {/* Hire Button */}
      <button
        onClick={() => navigate(`/hire/${worker.id}`)}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition"
      >
        Hire
      </button>

    </div>
  );
}
