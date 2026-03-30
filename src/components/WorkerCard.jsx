export default function WorkerCard({ worker }) {
  return (
    <div className="bg-[#121826] p-4 rounded-lg text-white flex justify-between items-center">

      <div>
        <h3 className="font-semibold">
          {worker.name}
        </h3>

        <p className="text-sm text-gray-400">
          {worker.category}
        </p>

        <p className="text-xs text-gray-500">
          {worker.location}
        </p>

        {worker.description && (
          <p className="text-xs text-gray-400 mt-1">
            {worker.description}
          </p>
        )}

        {worker.price && (
          <p className="text-green-400 mt-1">
            ₦{worker.price}
          </p>
        )}
      </div>

      {/* Live Badge */}
      {worker.live && (
        <span className="bg-green-500 text-xs px-2 py-1 rounded">
          LIVE
        </span>
      )}
    </div>
  );
}
