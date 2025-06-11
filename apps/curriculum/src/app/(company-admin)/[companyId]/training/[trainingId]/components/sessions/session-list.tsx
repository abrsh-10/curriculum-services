"use client"

import { Session } from "@/lib/hooks/useSession"
import { SessionCard } from "./session-card"

interface SessionListProps {
  sessions: Session[]
  cohortId?: string // Optional for cohort sessions
  onEdit?: (sessionId: string) => void // Optional edit handler for modal
}

export function SessionList({ sessions, cohortId, onEdit }: SessionListProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard 
              key={session.id} 
              session={session} 
              cohortId={cohortId}
              onEdit={onEdit}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-[#fbfbfb] rounded-lg border-[0.1px]">
            <p className="text-gray-500 text-sm">
              No matching sessions found
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 