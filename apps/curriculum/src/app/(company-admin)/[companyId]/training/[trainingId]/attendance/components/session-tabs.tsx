"use client"

import { memo, useCallback } from "react"
import { Session } from "@/lib/hooks/useSession"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDateToDisplay } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useRouter, useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"

interface SessionTabsProps {
  sessions: Session[]
  activeSessionId: string
  setActiveSessionId: (id: string) => void
  trainingId: string
}

function SessionTabsComponent({ 
  sessions, 
  activeSessionId, 
  setActiveSessionId,
  trainingId
}: SessionTabsProps) {
  const router = useRouter()
  const params = useParams()
  const { isTrainer, isLoading } = useUserRole()
  
  // Find active session
  const activeSession = sessions.find(session => session.id === activeSessionId) || sessions[0]
  
  // Define callbacks before any early returns
  const handleTabClick = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [setActiveSessionId])

  const handleSessionDetailsClick = useCallback(() => {
    // Sessions only exist within cohorts
    const cohortId = activeSession?.cohort?.id
    
    if (!cohortId) {
      console.error('Session must belong to a cohort to view details')
      return
    }
    
    // Route to cohort-based session detail page
    router.push(`/${params.companyId}/training/${trainingId}/cohorts/${cohortId}/sessions/${activeSession.id}`)
  }, [activeSession?.cohort?.id, activeSession?.id, params.companyId, router, trainingId])

  // Don't render details section if role is loading or no active session exists
  if (isLoading || !activeSession) {
     return null; // Or a loading indicator if preferred
  }

  return (
    <>
      {/* Session Tabs */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-[#EAECF0]">
        {/* Scrollable container */}
        <div className="overflow-x-auto pb-2 -mb-2">
          <div className="bg-[#FBFBFB] flex p-2 rounded-md gap-1 whitespace-nowrap w-min">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleTabClick(session.id)}
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
      
      {/* Session Details */}
      <div className="bg-[#FBFBFB] p-5 mb-8 rounded-lg border border-[#EAECF0]">
        <div className="flex flex-wrap justify-between items-center gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <h3 className="text-[#525252] font-bold text-sm">{activeSession.name || 'Session Name N/A'}</h3>
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
                {new Date(activeSession.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                {new Date(activeSession.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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

          {/* Conditionally render the button based on the trainer role */}
          {!isTrainer && (
            <Button
              variant="outline"
              className="text-xs border-[#99948E] text-[#99948E] h-8"
              onClick={handleSessionDetailsClick}
            >
              Session Details
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const SessionTabs = memo(SessionTabsComponent) 