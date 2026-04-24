import { DashboardPageSkeleton } from "@/components/ui/Skeleton";

/**
 * Shown while any dashboard `page.tsx` is loading (client navigation or first paint
 * of a slow RSC). Matches the app shell so the transition feels smooth.
 */
export default function DashboardLoading() {
  return <DashboardPageSkeleton />;
}
