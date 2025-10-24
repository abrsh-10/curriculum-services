"use client"

import { memo, useCallback } from "react"
import { Session } from "@/lib/hooks/useSession"
import { Cohort } from "@/lib/hooks/useCohorts"
import { Calendar } from "lucide-react"
import { formatDateToDisplay, formatTimeToDisplay } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useRouter, useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"

interface CohortSessionTabsProps {
  cohorts: Cohort[]
  sessions: Session[]
  activeCohortId: string
  activeSessionId: string
  setActiveCohortId: (id: string) => void
  setActiveSessionId: (id: string) => void
  trainingId: string
}

function CohortSessionTabsComponent({ 
  cohorts,
  sessions, 
  activeCohortId,
  activeSessionId, 
  setActiveCohortId,
  setActiveSessionId,
  trainingId
}: CohortSessionTabsProps) {
  const router = useRouter()
  const params = useParams()
  const { isTrainer, isLoading } = useUserRole()
  
  // Find active session
  const activeSession = sessions.find(session => session.id === activeSessionId)
  
  // Define callbacks before any early returns
  const handleCohortTabClick = useCallback((cohortId: string) => {
    setActiveCohortId(cohortId)
  }, [setActiveCohortId])

  const handleSessionTabClick = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [setActiveSessionId])

  const handleSessionDetailsClick = useCallback(() => {
    if (!activeSession || !activeCohortId) {
      console.error('Session must belong to a cohort to view details')
      return
    }
    
    // Route to cohort-based session detail page
    router.push(`/${params.companyId}/training/${trainingId}/cohorts/${activeCohortId}/sessions/${activeSession.id}`)
  }, [activeSession?.id, activeCohortId, params.companyId, router, trainingId])

  // Don't render details section if role is loading
  if (isLoading) {
     return null;
  }

  return (
    <>
      {/* Cohort Tabs */}
      <div className="mb-4 bg-white p-4 rounded-lg border border-[#EAECF0]">
        <h3 className="text-sm font-medium mb-3 text-[#292827]">Cohorts</h3>
        <div className="overflow-x-auto pb-2 -mb-2">
          <div className="bg-[#FBFBFB] flex p-2 rounded-md gap-1 whitespace-nowrap w-min">
            {cohorts.map((cohort) => (
              <button
                key={cohort.id}
                onClick={() => handleCohortTabClick(cohort.id)}
                className={cn(
                  "py-2 px-3 rounded-md text-sm font-normal transition-colors duration-200 min-w-[120px] text-center",
                  cohort.id === activeCohortId
                    ? "bg-[#0B75FF] text-white font-semibold"
                    : "text-[#555557] hover:bg-gray-100"
                )}
              >
                {cohort.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Tabs */}
      {sessions.length > 0 && (
        <div className="mb-6 bg-white p-4 rounded-lg border border-[#EAECF0]">
          <h3 className="text-sm font-medium mb-3 text-[#292827]">Sessions</h3>
          <div className="overflow-x-auto pb-2 -mb-2">
            <div className="bg-[#FBFBFB] flex p-2 rounded-md gap-1 whitespace-nowrap w-min">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionTabClick(session.id)}
                  className={cn(
                    "py-2 px-3 rounded-md text-sm font-normal transition-colors duration-200 min-w-[110px] text-center",
                    session.id === activeSessionId
                      ? "bg-[#0B75FF] text-white font-semibold"
                      : "text-[#555557] hover:bg-gray-100"
                  )}
                >
                  {session.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Active Session Details */}
      {activeSession && (
        <div className="bg-[#FBFBFB] p-5 mb-8 rounded-lg border border-[#EAECF0]">
          <div className="flex flex-wrap justify-between items-center gap-x-10 gap-y-4">
            <div className="flex flex-col gap-1 min-w-[150px]">
              <h3 className="text-[#525252] font-bold text-sm">{activeSession.name || 'Session Name N/A'}</h3>
              {activeSession.cohort && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#667085]">Cohort:</span>
                  <span className="text-xs font-medium text-[#0B75FF]">{activeSession.cohort.name}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[#525252] font-bold text-xs">Date</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#565555]" />
                <span className="text-[#555252] font-light text-sm">
                  {formatDateToDisplay(activeSession.startDate)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[#525252] font-bold text-xs">Time</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#555252] font-light text-sm">
                  {formatTimeToDisplay(activeSession.startDate)} - 
                  {formatTimeToDisplay(activeSession.endDate)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[#525252] font-bold text-xs">Location</span>
              <span className="text-[#555252] font-light text-sm">
                {activeSession.trainingVenue ? 
                  `${activeSession.trainingVenue.location}, ${activeSession.trainingVenue.city?.name || ''}` : 
                  'Location N/A'}
              </span>
            </div>

            {/* {!isTrainer && (
              <Button
                variant="outline"
                className="text-xs border-[#99948E] text-[#99948E] h-8"
                onClick={handleSessionDetailsClick}
              >
                Session Details
              </Button>
            )} */}
          </div>
        </div>
      )}
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const CohortSessionTabs = memo(CohortSessionTabsComponent) 