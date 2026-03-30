import WorkerCard from "./WorkerCard";

export default function CategoryGroup({ title, workers, liveOnly }) {

  // filter workers
  const filteredWorkers = liveOnly
    ? workers.filter(worker => worker.live)
    : workers;

  if (filteredWorkers.length === 0) return null;

  return (
    <div className="mb-6">

      {/* Category Title */}
      <h2 className="text-white text-lg font-semibold mb-3">
        {title}
      </h2>

      {/* Workers */}
      <div>
        {filteredWorkers.map(worker => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>

    </div>
  );
}
