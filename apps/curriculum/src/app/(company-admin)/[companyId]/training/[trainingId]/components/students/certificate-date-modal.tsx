"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Award, Users } from "lucide-react"

interface CertificateDateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (date: string) => void
  studentCount: number
  isGenerating: boolean
}

export function CertificateDateModal({
  isOpen,
  onClose,
  onConfirm,
  studentCount,
  isGenerating
}: CertificateDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Reset date to today when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date())
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (selectedDate && !isGenerating) {
      // Format date as YYYY-MM-DD using local date (not ISO to avoid timezone issues)
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      
      onConfirm(formattedDate)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100">
              <Award className="h-4 w-4 text-green-600" />
            </div>
            Generate Certificates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Student count info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="p-1.5 rounded-full bg-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {studentCount} {studentCount === 1 ? 'Student' : 'Students'} Selected
              </p>
              <p className="text-xs text-blue-600">
                Certificates will be generated for all selected students
              </p>
            </div>
          </div>

          {/* Date selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Issue Date
            </label>
            <div className="rounded-md border border-gray-200 p-2 bg-white">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Generate {studentCount} Certificate{studentCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
