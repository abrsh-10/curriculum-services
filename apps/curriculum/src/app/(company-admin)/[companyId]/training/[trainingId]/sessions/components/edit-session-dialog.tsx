import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SessionForm } from "./session-form"

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
        
        {sessionId && (
          <SessionForm
            trainingId={trainingId}
            companyId={companyId}
            cohortId={cohortId}
            sessionId={sessionId}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 