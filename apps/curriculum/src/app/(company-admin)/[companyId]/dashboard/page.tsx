"use client";

import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { Loading } from "@/components/ui/loading";

export default function CompanyAdminDashboard() {
  const { isCompanyAdmin, isLoading: isLoadingRole } = useUserRole();
  const { isLoading: isLoadingAnalytics } = useAnalytics();

  // Show loading while checking role or loading analytics data
  if (isLoadingRole || isLoadingAnalytics) {
    return <Loading />;
  }

  if (!isCompanyAdmin) {
    return (
      <div className="flex min-h-screen lg:px-16 md:px-14 px-4 ">
        <div className="flex flex-1 flex-col gap-4 md:pl-12 py-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/90" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>

          <div className=" flex-1 rounded-xl bg-muted md:min-h-min" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen lg:px-16 md:px-14 px-4">
      <div className="flex flex-1 flex-col gap-6 md:pl-12 py-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
