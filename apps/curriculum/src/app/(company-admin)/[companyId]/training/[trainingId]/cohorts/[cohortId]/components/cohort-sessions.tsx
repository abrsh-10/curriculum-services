"use client"

import { useState, lazy, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Loader2, X, UserPlus } from "lucide-react"
import { useCohortSessions } from "@/lib/hooks/useSession"
import { Input } from "@/components/ui/input"
import { SessionList } from "../../../components/sessions/session-list"
import { SessionForm } from "../../../sessions/components/session-form"
import { 
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent
} from "@/components/ui/dialog"
import Image from "next/image"
import { AssignTrainerModal } from "./assign-trainer-modal"

// Lazy load the EditSessionDialog since it's only needed when editing
const EditSessionDialog = lazy(() => 
  import("../../../components/sessions/edit-session-dialog").then(module => ({ default: module.EditSessionDialog }))
)

interface CohortSessionsProps {
  cohortId: string
  trainingId: string
}

export function CohortSessions({ cohortId, trainingId }: CohortSessionsProps) {
  const params = useParams()
  const companyId = params.companyId as string
  const { isProjectManager, isTrainingAdmin } = useUserRole()
  
  const { data, isLoading, error, refetch } = useCohortSessions({
    cohortId,
    pageSize: 20,
    page: 1
  })
  
  const sessions = data?.sessions || []

  const [searchTerm, setSearchTerm] = useState("")
  const [editSessionId, setEditSessionId] = useState<string | null>(null)
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false)
  const [isAssignTrainerModalOpen, setIsAssignTrainerModalOpen] = useState(false)

  const handleAddSession = () => {
    setIsAddSessionModalOpen(true)
  }

  const handleEditSession = (sessionId: string) => {
    setEditSessionId(sessionId)
  }

  const handleCloseEditDialog = () => {
    setEditSessionId(null)
  }

  const handleEditSuccess = () => {
    refetch() // Refresh the sessions list
  }

  const handleAddSessionSuccess = () => {
    setIsAddSessionModalOpen(false)
    refetch() // Refresh the sessions list
  }

  const handleAddSessionCancel = () => {
    setIsAddSessionModalOpen(false)
  }

  const handleAssignTrainer = () => {
    setIsAssignTrainerModalOpen(true)
  }

  const handleAssignTrainerSuccess = () => {
    refetch() // Refresh the sessions list
  }

  const filteredSessions = sessions.filter(session => 
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Sessions</h2>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative md:w-[300px]">
              <Image
                src="/search.svg"
                alt="Search"
                width={19}
                height={19}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 z-10"
              />
              <Input
                type="text"
                placeholder="Search sessions..."
                className="pl-10 h-10 text-sm bg-white border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button 
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-[#344054] h-10 whitespace-nowrap disabled:opacity-50"
              disabled={isLoading}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            {(isProjectManager || isTrainingAdmin) && sessions.length > 0 && (
              <Button
                variant="outline"
                className="border-[#0B75FF] text-[#0B75FF] hover:bg-[#0B75FF]/10 flex items-center gap-2 h-10"
                onClick={handleAssignTrainer}
                disabled={isLoading}
              >
                <UserPlus className="h-4 w-4" />
                <span>Assign Trainer</span>
              </Button>
            )}
            {(isProjectManager || isTrainingAdmin) && (
              <Button
                className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
                onClick={handleAddSession}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                <span>Add Session</span>
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
            <h3 className="text-lg font-medium mb-2">Error Loading Sessions</h3>
            <p className="text-gray-500 text-sm">
              There was a problem loading the sessions. Please try again later.
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Loading Sessions</h3>
            <p className="text-gray-500 text-sm">
              Please wait while we fetch the sessions...
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
            <h3 className="text-lg font-medium mb-2">No Sessions Added Yet</h3>
            <p className="text-gray-500 text-sm">
              Add training sessions to this cohort to get started.
            </p>
            {(isProjectManager || isTrainingAdmin) && (
              <Button 
                className="mt-4 bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 mx-auto"
                onClick={handleAddSession}
              >
                <Plus className="h-4 w-4" />
                <span>Add Session</span>
              </Button>
            )}
          </div>
        ) : (
          <SessionList sessions={filteredSessions} cohortId={cohortId} onEdit={handleEditSession} />
        )}

        {/* Edit Session Dialog - Only render when needed */}
        {editSessionId && (
          <Suspense fallback={null}>
            <EditSessionDialog
              trainingId={trainingId}
              companyId={companyId}
              sessionId={editSessionId}
              cohortId={cohortId}
              isOpen={!!editSessionId}
              onClose={handleCloseEditDialog}
              onSuccess={handleEditSuccess}
            />
          </Suspense>
        )}
      </div>

      {/* Add Session Modal */}
      <Dialog open={isAddSessionModalOpen} onOpenChange={setIsAddSessionModalOpen}>
        <DialogContent 
          className="sm:max-w-[600px] max-h-[90vh] p-0"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-xl font-semibold">New Cohort Session</DialogTitle>
            </div>
          </DialogHeader>
          <SessionForm 
            trainingId={trainingId}
            companyId={companyId}
            cohortId={cohortId}
            onSuccess={handleAddSessionSuccess}
            onCancel={handleAddSessionCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Trainer Modal */}
      <AssignTrainerModal
        isOpen={isAssignTrainerModalOpen}
        onClose={() => setIsAssignTrainerModalOpen(false)}
        sessions={filteredSessions}
        onSuccess={handleAssignTrainerSuccess}
      />
    </>
  )
} 