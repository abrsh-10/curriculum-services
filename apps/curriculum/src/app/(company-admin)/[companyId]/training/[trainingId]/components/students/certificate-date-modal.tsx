"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Award, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate.toISOString())
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-green-100">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            Generate Certificates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Student count info */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
            <div className="p-2 rounded-full bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Select Issue Date
              </label>
            </div>
            
            {/* Calendar */}
            <div className="flex justify-center p-3 border rounded-lg bg-gray-50">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date > new Date()} // Disable future dates
                className="rounded-md border-0"
              />
            </div>

            {/* Selected date display */}
            {selectedDate && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <span className="text-sm text-gray-600">Selected Date:</span>
                <span className="text-sm font-semibold text-green-700">
                  {format(selectedDate, "MMMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0 border-t pt-4 mt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || isGenerating}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
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

