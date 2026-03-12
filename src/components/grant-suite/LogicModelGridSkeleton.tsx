export default function LogicModelGridSkeleton() {
  const columns = [
    { label: "Inputs", color: "bg-blue-50" },
    { label: "Activities", color: "bg-green-50" },
    { label: "Outputs", color: "bg-amber-50" },
    { label: "Short-term Outcomes", color: "bg-orange-50" },
    { label: "Long-term Outcomes", color: "bg-rose-50" },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {columns.map((col) => (
        <div key={col.label} className="flex flex-col gap-2">
          <div className="h-8 rounded-lg bg-midnight/5 animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`${col.color} rounded-xl p-4 animate-pulse`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-3 w-3/4 bg-midnight/10 rounded mb-2" />
              <div className="h-2 w-full bg-midnight/5 rounded mb-1" />
              <div className="h-2 w-2/3 bg-midnight/5 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
