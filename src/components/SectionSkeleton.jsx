import SkeletonBlock from "./SkeletonBlock";

export default function SectionSkeleton({
  eyebrowWidth = "w-24",
  titleWidth = "w-48",
  lines = 0,
  lineWidths = [],
  className = "",
  children,
}) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <SkeletonBlock className={`h-4 ${eyebrowWidth} rounded-full`} />
      <SkeletonBlock className={`h-8 ${titleWidth} rounded-full`} />
      {lines > 0 ? (
        <div className="space-y-2">
          {Array.from({ length: lines }, (_, index) => (
            <SkeletonBlock
              key={index}
              className={`h-3 ${lineWidths[index] || "w-full"} rounded-full`}
            />
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}
