import SkeletonBlock from "./SkeletonBlock";
import SectionSkeleton from "./SectionSkeleton";

export default function ExperienceSkeleton() {
  return (
    <div className="mt-10 grid min-w-0 gap-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="min-w-0 space-y-10">
        <div className="space-y-4">
          <SkeletonBlock className="h-4 w-24 rounded-full" />
          <SkeletonBlock className="h-10 w-4/5 rounded-full" />
          <SkeletonBlock className="h-4 w-full rounded-full" />
          <SkeletonBlock className="h-4 w-5/6 rounded-full" />
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBlock className="h-10 w-36 rounded-full" />
            <SkeletonBlock className="h-10 w-28 rounded-full" />
          </div>
        </div>

        <div className="border-b border-white/60 pb-10">
          <SectionSkeleton>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <SkeletonBlock
                  key={index}
                  className="h-16 rounded-xl border border-white/60"
                />
              ))}
            </div>
          </SectionSkeleton>
        </div>

        <div className="border-b border-white/60 pb-10">
          <SectionSkeleton
            eyebrowWidth="w-28"
            titleWidth="w-40"
            lines={3}
          />
        </div>

        <div className="border-b border-white/60 pb-10">
          <SectionSkeleton
            eyebrowWidth="w-24"
            titleWidth="w-36"
            lines={3}
            lineWidths={["w-5/6", "w-4/5", "w-2/3"]}
          />
        </div>

        <div className="border-b border-white/60 pb-10">
          <SectionSkeleton eyebrowWidth="w-20" titleWidth="w-44">
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonBlock key={index} className="h-28 rounded-2xl" />
              ))}
            </div>
          </SectionSkeleton>
        </div>

        <div className="pb-2">
          <SectionSkeleton>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonBlock key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          </SectionSkeleton>
        </div>
      </div>

      <aside className="h-fit min-w-0 lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-soft backdrop-blur">
          <SkeletonBlock className="aspect-[16/10] min-h-[360px] w-full" />
          <div className="space-y-3 p-5">
            <SkeletonBlock className="h-4 w-20 rounded-full" />
            <SkeletonBlock className="h-6 w-3/4 rounded-full" />
            <SkeletonBlock className="h-3 w-full rounded-full" />
          </div>
        </div>
      </aside>
    </div>
  );
}
