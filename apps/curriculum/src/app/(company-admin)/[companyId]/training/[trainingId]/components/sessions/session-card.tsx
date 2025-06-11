"use client"

import { memo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Edit } from "lucide-react"
import { formatDateToDisplay, formatTimeToDisplay } from "@/lib/utils"
import { Session, SessionStatus } from "@/lib/hooks/useSession"
import { useUserRole } from "@/lib/hooks/useUserRole"

interface SessionCardProps {
  session: Session
  cohortId?: string // Optional for cohort sessions
  onEdit?: (sessionId: string) => void // Optional edit handler for modal
}

function SessionCardComponent({ session, cohortId, onEdit }: SessionCardProps) {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const trainingId = params.trainingId as string
  const { isProjectManager, isTrainingAdmin } = useUserRole()

  const handleViewDetails = () => {
    // Sessions only exist within cohorts, so we need cohortId
    const sessionCohortId = cohortId || session.cohort?.id
    
    if (!sessionCohortId) {
      console.error('Session must belong to a cohort. CohortId not found.')
      return
    }
    
    // Route to cohort-based session detail page
    router.push(`/${companyId}/training/${trainingId}/cohorts/${sessionCohortId}/sessions/${session.id}`)
  }

  const handleEdit = () => {
    if (onEdit) {
      // Use modal edit handler if provided
      onEdit(session.id)
    } else {
      // For backwards compatibility, but sessions should always use modal edit
      console.warn('Edit should use modal handler for sessions within cohorts')
    }
  }

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-[#ECF4FF] text-[#0B75FF]"
      case "IN_PROGRESS":
        return "bg-[#ECFDF3] text-[#037847]"
      case "COMPLETED":
        return "bg-[#EEEEF9] text-[#5925DC]"
      case "CANCELED":
        return "bg-[#FEF3F2] text-[#D92D20]"
      case "POSTPONED":
        return "bg-[#FFF6ED] text-[#F79009]"
      default:
        return "bg-[#ECF4FF] text-[#0B75FF]"
    }
  }

  return (
    <div className="bg-[#FBFBFB] p-5 rounded-lg border-[0.1px] border-gray-200">
      <div className="grid grid-cols-6 items-center gap-4">
        <div className="flex flex-col gap-1 col-span-1">
          <h3 className="text-[#525252] font-bold text-sm break-words">
            {session.name}
            {/* Show session type badges */}
            <div className="flex gap-1 mt-1">
              {session.first === true && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  First
                </span>
              )}
              {session.last === true && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  Last
                </span>
              )}
            </div>
          </h3>
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <span className="text-[#525252] font-bold text-xs">Date</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#565555]" />
            <span className="text-[#555252] font-light text-sm">
              {formatDateToDisplay(session.startDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <span className="text-[#525252] font-bold text-xs">Time</span>
          <span className="text-[#555252] font-light text-sm">
            {formatTimeToDisplay(session.startDate)} - {formatTimeToDisplay(session.endDate)}
          </span>
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <span className="text-[#525252] font-bold text-xs">Delivery Method</span>
          <span
            className={`text-sm font-semibold ${
              session.deliveryMethod === "ONLINE"
                ? "text-[#037847]"
                : session.deliveryMethod === "OFFLINE"
                ? "text-[#667085]"
                : "text-[#F79009]"
            }`}
          >
            {session.deliveryMethod === "ONLINE"
              ? "Online"
              : session.deliveryMethod === "OFFLINE"
              ? "Offline"
              : "Self-paced"}
          </span>
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <span className="text-[#525252] font-bold text-xs">Status</span>
          <div className="flex items-center">
            <div 
              className={`flex items-center gap-1.5 py-0.5 px-2 rounded-2xl ${getStatusColor(session.status)}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${session.status === "SCHEDULED" ? "bg-[#0B75FF]" : ""}`}></div>
              <span className="text-xs font-medium">
                {session.status.charAt(0) + session.status.slice(1).toLowerCase().replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 col-span-1">
          {(isProjectManager || isTrainingAdmin) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full border-[#667085] text-[#667085] text-xs font-medium"
              onClick={handleEdit}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-[#667085] text-[#667085] text-xs font-medium"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const SessionCard = memo(SessionCardComponent)