function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--background-alt)] ${className}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-4">
      <SkeletonBlock className="h-5 w-24" />
      <SkeletonBlock className="mt-3 h-4 w-3/4" />
      <div className="mt-5 flex items-center justify-between">
        <SkeletonBlock className="h-6 w-16 rounded-full" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
      <SkeletonBlock className="mt-5 h-3 w-full" />
      <SkeletonBlock className="mt-2 h-3 w-32" />
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SkeletonBlock className="h-9 w-40" />
          <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-32" />
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-3 sm:flex-row sm:items-center">
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-10 w-full sm:w-48" />
        <SkeletonBlock className="h-10 w-full sm:w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}

export function CourseDetailLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <SkeletonBlock className="h-5 w-48" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <SkeletonBlock className="h-10 w-32" />
          <SkeletonBlock className="mt-3 h-5 w-80 max-w-full" />
        </div>
        <div className="space-y-4 lg:items-end">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <SkeletonBlock className="h-10 w-28" />
            <SkeletonBlock className="h-10 w-28" />
            <SkeletonBlock className="h-10 w-28" />
          </div>
          <SkeletonBlock className="h-20 w-full lg:w-[360px]" />
        </div>
      </div>
      <SkeletonBlock className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}

export function SectionDetailLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SkeletonBlock className="h-5 w-64" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SkeletonBlock className="h-10 w-72 max-w-full" />
            <SkeletonBlock className="mt-3 h-4 w-56" />
          </div>
          <SkeletonBlock className="h-10 w-44" />
        </div>
        <SkeletonBlock className="h-16 w-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <div className="space-y-8">
          {Array.from({ length: 4 }, (_, groupIndex) => (
            <section key={groupIndex} className="space-y-3">
              <SkeletonBlock className="h-6 w-36" />
              <div className="grid gap-4 lg:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </section>
          ))}
        </div>
        <SkeletonBlock className="h-72 w-full" />
      </div>
    </div>
  );
}
