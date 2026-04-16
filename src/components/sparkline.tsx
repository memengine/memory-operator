type SparklineProps = {
  points: number[];
  className?: string;
};

export function Sparkline({ points, className }: SparklineProps) {
  const safePoints = points.length > 1 ? points : [0, ...(points.length ? points : [0])];
  const max = Math.max(...safePoints, 1);
  const min = Math.min(...safePoints, 0);
  const range = Math.max(max - min, 1);

  const path = safePoints
    .map((point, index) => {
      const x = (index / (safePoints.length - 1)) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className ?? "h-10 w-24"}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-sky-300"
      />
    </svg>
  );
}
