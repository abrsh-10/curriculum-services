import { lazy, Suspense } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Lazy load the SessionForm since it's only needed when dialog is open
const SessionForm = lazy(() => 
  import("../../sessions/components/session-form").then(module => ({ default: module.SessionForm }))
)

// Loading fallback for the form
const FormLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
  </div>
)

interface EditSessionDialogProps {
  trainingId: string
  companyId: string
  sessionId: string | null
  cohortId?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditSessionDialog({
  trainingId,
  companyId,
  sessionId,
  cohortId,
  isOpen,
  onClose,
  onSuccess
}: EditSessionDialogProps) {
  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 rounded-lg">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Edit Session
          </DialogTitle>
        </DialogHeader>
        
        {sessionId && isOpen && (
          <Suspense fallback={<FormLoadingFallback />}>
            <SessionForm
              trainingId={trainingId}
              companyId={companyId}
              cohortId={cohortId}
              sessionId={sessionId}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  )
} 