import SkeletonBlock from "./SkeletonBlock";

function SpotlightSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-soft backdrop-blur">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SkeletonBlock className="min-h-[260px] w-full" />
        <div className="space-y-5 p-6">
          <SkeletonBlock className="h-4 w-24 rounded-full" />
          <SkeletonBlock className="h-8 w-3/4 rounded-full" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-full rounded-full" />
            <SkeletonBlock className="h-3 w-5/6 rounded-full" />
            <SkeletonBlock className="h-3 w-2/3 rounded-full" />
          </div>
          <div className="grid gap-4 text-xs sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonBlock className="h-2 w-16 rounded-full" />
                <SkeletonBlock className="h-4 w-20 rounded-full" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBlock className="h-10 w-28 rounded-full" />
            <SkeletonBlock className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExperienceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-soft backdrop-blur">
      <SkeletonBlock className="h-44 w-full" />
      <div className="space-y-4 p-5">
        <SkeletonBlock className="h-5 w-1/2 rounded-full" />
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-full rounded-full" />
          <SkeletonBlock className="h-3 w-5/6 rounded-full" />
        </div>
        <div className="grid gap-3 text-xs sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBlock className="h-2 w-16 rounded-full" />
              <SkeletonBlock className="h-4 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-24 rounded-full" />
          <SkeletonBlock className="h-10 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-10" data-testid="dashboard-skeleton">
      <SpotlightSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <ExperienceCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
