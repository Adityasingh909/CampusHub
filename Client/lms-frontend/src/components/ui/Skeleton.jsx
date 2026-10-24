import { cn } from "../../lib/cn";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200/80 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <Skeleton className="h-full w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col justify-between gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-3.5 w-10 rounded-md" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="pt-2 flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AssignmentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4 flex-1">
        <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <Skeleton className="h-5 w-2/3 rounded-md" />
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-3.5 w-20 rounded-md" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-line">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full max-w-[120px] rounded-md" />
        </td>
      ))}
    </tr>
  );
}

export function DetailHeroSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-navy-deep via-navy to-navy-hover p-6 sm:p-8 text-white shadow-card">
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full bg-white/20" />
          <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
        </div>
        <Skeleton className="h-8 sm:h-10 w-3/4 rounded-xl bg-white/20" />
        <Skeleton className="h-4 w-full rounded-md bg-white/10" />
        <Skeleton className="h-4 w-2/3 rounded-md bg-white/10" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <Skeleton className="h-3.5 w-32 rounded-md mb-2" />
        <Skeleton className="h-8 w-64 rounded-xl mb-1" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      <div className="rounded-2xl border border-line bg-white shadow-card p-6 sm:p-8 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
          <Skeleton className="w-24 h-24 rounded-2xl" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-xl mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AnnouncementCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <Skeleton className="h-6 w-1/2 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-14 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-4 w-full rounded-md mt-2" />
      <Skeleton className="h-4 w-4/5 rounded-md" />
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <Skeleton className="h-3.5 w-24 rounded-md" />
      </div>
    </div>
  );
}
