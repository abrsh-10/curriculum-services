"use client"

import { useState, lazy, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCohort } from "@/lib/hooks/useCohorts"
import { CohortSessions } from "./components/cohort-sessions"
import { useUserRole } from "@/lib/hooks/useUserRole"

// Lazy load components that are not immediately visible
const CohortStudents = lazy(() => 
  import("./components/cohort-students").then(module => ({ default: module.CohortStudents }))
)

const CohortSubCohorts = lazy(() => 
  import("./components/cohort-sub-cohorts").then(module => ({ default: module.CohortSubCohorts }))
)

// Tab loading fallback
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

export default function CohortDetailPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const trainingId = params.trainingId as string
  const cohortId = params.cohortId as string
  const [activeTab, setActiveTab] = useState("sessions")
  const { isProjectManager, isTrainingAdmin, isTrainerAdmin, isTrainer } = useUserRole()

  // Fetch the specific cohort details using the dedicated useCohort hook
  const { data: cohort, isLoading, error } = useCohort(cohortId)

  const handleBack = () => {
    router.push(`/${companyId}/training/${trainingId}?tab=cohorts`)
  }

  if (isLoading) {
    return <Loading />
  }

  if (error || !cohort) {
    return (
      <div className="px-[7%] py-10">
        <div className="flex items-center gap-2 mb-8">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            className="p-0 hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5 text-blue-500" />
          </Button>
          <h1 className="text-xl font-semibold">Cohort Details</h1>
        </div>

        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border border-[#EAECF0]">
          <h3 className="text-lg font-medium mb-2">Error Loading Cohort</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the cohort details. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-[7%] py-10">
      <div className="flex items-center gap-2 mb-8">
        <Button 
          onClick={handleBack}
          variant="ghost" 
          className="p-0 hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5 text-blue-500" />
        </Button>
        <h1 className="text-xl font-semibold">Cohort Details</h1>
      </div>

      <div className="bg-[#FBFBFB] p-5 mb-8 rounded-lg border border-[#EAECF0]">
        <div className="flex flex-wrap justify-between items-center gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <h3 className="text-[#525252] font-bold text-lg">{cohort.name}</h3>
            {cohort.description && (
              <p className="text-[#667085] text-sm">{cohort.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#525252] font-bold text-xs">Training</span>
            <span className="text-[#555252] font-light text-sm">
              {cohort.trainingTitle}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#525252] font-bold text-xs">Parent Cohort</span>
            <span className="text-[#555252] font-light text-sm">
              {cohort.parentCohortName || "Main Cohort"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#525252] font-bold text-xs">Tags</span>
            <div className="flex flex-wrap gap-1">
              {cohort.tags && cohort.tags.length > 0 ? (
                cohort.tags.map((tag, index) => (
                  <span key={index} className="bg-[#ECF4FF] text-[#0B75FF] px-2 py-0.5 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[#667085] text-xs italic">No tags</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="w-full mb-8" onValueChange={setActiveTab}>
        <TabsList className="bg-transparent px-0 mb-6">
          <TabsTrigger value="sessions">
            Sessions
          </TabsTrigger>
          <TabsTrigger value="students">
            Students
          </TabsTrigger>
          <TabsTrigger value="sub-cohorts">
            Sub-Cohorts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="pt-0">
          <CohortSessions cohortId={cohortId} trainingId={trainingId} />
        </TabsContent>

        <TabsContent value="students" className="pt-0">
          <Suspense fallback={<TabLoadingFallback />}>
            <CohortStudents cohortId={cohortId} trainingId={trainingId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="sub-cohorts" className="pt-0">
          <Suspense fallback={<TabLoadingFallback />}>
            <CohortSubCohorts cohortId={cohortId} trainingId={trainingId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
} 