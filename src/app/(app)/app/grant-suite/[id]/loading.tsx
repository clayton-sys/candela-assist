import LogicModelGridSkeleton from "@/components/grant-suite/LogicModelGridSkeleton";

export default function Loading() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Header skeleton */}
      <div className="flex-shrink-0 bg-midnight border-b border-gold/20">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="w-[22px] h-[22px] rounded bg-stone/10 animate-pulse" />
          <div className="h-3 w-20 bg-stone/10 rounded animate-pulse" />
          <span className="text-stone/20 hidden sm:block">|</span>
          <div className="flex-1">
            <div className="h-5 w-48 bg-stone/10 rounded animate-pulse mb-1" />
            <div className="h-3 w-32 bg-stone/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="h-[3px] bg-gold flex-shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 bg-stone p-6">
        <div className="max-w-7xl mx-auto">
          <LogicModelGridSkeleton />
        </div>
      </div>
    </div>
  );
}
