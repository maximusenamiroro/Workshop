import WorkerCard from "./WorkerCard";

export default function CategoryGroup({
  title,
  workers,
  liveOnly,
}) {
  if (!workers || workers.length === 0) return null;

  return (
    <div className="mb-6">

      <h2 className="text-white font-semibold mb-3">
        {title}
      </h2>

      <div className="space-y-3">
        {workers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            liveOnly={liveOnly}
          />
        ))}
      </div>

    </div>
  );
}
