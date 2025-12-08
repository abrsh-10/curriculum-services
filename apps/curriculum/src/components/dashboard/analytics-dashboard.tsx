import { StatsCard } from "./stats-card";
import { GenderDistributionChart } from "./gender-distribution-chart";
import { AgeDistributionChart } from "./age-distribution-chart";
import { TrainingCompletionChart } from "./training-completion-chart";
import { DeliveryMethodChart } from "./delivery-method-chart";
import { SessionStatusChart } from "./session-status-chart";
import { SessionMetricsChart } from "./session-metrics-chart";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { 
  getActiveTrainings,
  getCompletionPercentage, 
  getTotalCompletedTraineeCount, 
  getTotalTraineeCount,
  getGenderDistribution
} from "@/lib/utils/analytics-helpers";
import {
  getActiveSessionCount,
  getCompletedSessionCount,
  getTotalSessionCount,
  getTrainingsWithActiveSessions,
  getSessionCompletionPercentage
} from "@/lib/utils/session-analytics-helpers";
import { 
  Users, 
  Award, 
  Briefcase, 
  Blocks,
} from "lucide-react";
// import { useRouter, useParams } from "next/navigation";
// import { ChatButton } from "./chat-button";

export function AnalyticsDashboard() {
  const { data, error } = useAnalytics();
  // const router = useRouter();
  // const params = useParams();
  // const companyId = params?.companyId as string;
  
  // Handle navigation to chat page
  // const handleNavigateToChat = () => {
  //   router.push(`/${companyId}/analytics-chat`);
  // };
  
  // Handle error state
  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 my-4">
        <p className="font-medium">Failed to load analytics data</p>
        <p className="text-sm">
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </p>
      </div>
    );
  }
  
  // Trainee analytics
  const traineeCount = getTotalTraineeCount(data.traineeCountPerTraining);
  const completedCount = getTotalCompletedTraineeCount(
    data.traineeCountPerTraining
  );
  const completionPercentage = getCompletionPercentage(
    data.traineeCountPerTraining
  );
  const activeTrainings = getActiveTrainings(
    data.traineeCountPerTraining
  ).length;
  const genderDistribution = getGenderDistribution(
    data.traineeCountPerTraining
  );
  
  // Session analytics
  const totalSessions = getTotalSessionCount(data.sessionCountPerTraining);
  const activeSessions = getActiveSessionCount(data.sessionCountPerTraining);
  const completedSessions = getCompletedSessionCount(
    data.sessionCountPerTraining
  );
  
  // Session completion percentage for description
  const sessionCompletionPercentage = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0;
  
  // Session metrics data for the new pie chart with brand colors
  const sessionMetricsData = [
    { name: "Total", value: totalSessions, color: "#0A2342" },
    { name: "Active", value: activeSessions, color: "#1D4ED8" },
    { name: "Completed", value: completedSessions, color: "#B6FF5D" },
  ];
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        {/* Unified Analytics Dashboard */}
        <div>
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-md bg-emerald-100 mr-3">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Impact Analytics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatsCard 
              title="Total Trainees"
              value={traineeCount.toString()}
              icon={<Users className="h-6 w-6 text-white" />}
              className=""
            />
            <StatsCard 
              title="Completed Trainees"
              value={completedCount.toString()}
              description={`${completionPercentage}% completion rate`}
              icon={<Award className="h-6 w-6 text-white" />}
              className=""
            />
            <StatsCard 
              title="Active Trainings"
              value={activeTrainings.toString()}
              description={`With registered trainees`}
              icon={<Briefcase className="h-6 w-6 text-white" />}
              className=""
            />
            <StatsCard 
              title="Total Sessions"
              value={totalSessions.toString()}
              description={`${sessionCompletionPercentage}% completed`}
              icon={<Blocks className="h-6 w-6 text-white" />}
              className=""
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <TrainingCompletionChart
              data={data.traineeCountPerTraining}
              className=""
            />
            <GenderDistributionChart
              data={data.traineeCountPerTraining}
              className=""
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <SessionStatusChart
              data={data.sessionCountPerTraining}
              className=""
            />
            <DeliveryMethodChart
              data={data.sessionCountPerTraining}
              className=""
              title="Training Delivery Methods"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <AgeDistributionChart
              data={data.traineeCountPerTraining}
              className=""
            />
            <SessionMetricsChart
              data={sessionMetricsData}
              className=""
              title="Session Metrics"
            />
          </div>
        </div>
      </div>
      
      {/* Chat button disabled for now */}
      {/* <ChatButton onClick={handleNavigateToChat} /> */}
    </div>
  );
} 