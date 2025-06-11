import { useState, useEffect, memo } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { VenueWizard } from "./venue-wizard"
import { Venue, VenueResponse } from "@/lib/hooks/useVenue"

interface VenueDialogProps {
  companyId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
  venue?: Venue | null
  venueDetails?: VenueResponse
  isLoadingDetails?: boolean
  onClose?: () => void
  open?: boolean
}

export const AddVenueDialog = memo(function AddVenueDialog({ 
  companyId, 
  trigger, 
  onSuccess, 
  venue, 
  venueDetails,
  isLoadingDetails,
  onClose,
  open: externalOpen
}: VenueDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isEditMode = !!venue
  
  // Use external open state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (externalOpen !== undefined) {
      // When externally controlled, always call onClose to let parent handle state
      if (!newOpen && onClose) {
        onClose()
      }
    } else {
      // When internally controlled, manage our own state
      setInternalOpen(newOpen)
    }
  }

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    } else {
      router.refresh()
    }
  }

  const handleCancel = () => {
    handleOpenChange(false)
  }

  // When externally controlled and no trigger, render without DialogTrigger
  if (externalOpen !== undefined && !trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-xl font-semibold">
                {isEditMode ? 'Edit Venue' : 'Add New Venue'}
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCancel}
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                type="button"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
            {isEditMode && isLoadingDetails ? (
              <div className="flex items-center justify-center py-20">
                <Loading />
              </div>
            ) : (
              <VenueWizard 
                companyId={companyId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                venue={venue}
                venueDetails={venueDetails}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Standard mode with trigger
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Venue</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? 'Edit Venue' : 'Add New Venue'}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
              type="button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {isEditMode && isLoadingDetails ? (
            <div className="flex items-center justify-center py-20">
              <Loading />
            </div>
          ) : (
            <VenueWizard 
              companyId={companyId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              venue={venue}
              venueDetails={venueDetails}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}) 