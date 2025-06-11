"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle } from "lucide-react"
import { 
  useTrainingAssessments,
  useSubmitAssessmentAnswer
} from "@/lib/hooks/useTrainingAssessment"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"


interface AssessmentModalProps {
  trainingId: string
  studentId: string
  studentName: string
  assessmentType: 'PRE' | 'POST'
  trigger: React.ReactNode
}

export default function AssessmentModal({
  trainingId,
  studentId,
  studentName,
  assessmentType,
  trigger
}: AssessmentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fileLink, setFileLink] = useState("")
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [comment, setComment] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Only fetch when modal is open
  const { data: assessmentData, isLoading: isLoadingAssessment } = useTrainingAssessments(
    trainingId, 
    { 
      type: assessmentType,
      traineeId: studentId
    },
    {
      enabled: isOpen
    }
  )

  // Submit assessment answer mutation
  const { mutateAsync: submitAnswer } = useSubmitAssessmentAnswer()

  // Reset state when modal opens/closes
  const resetModalState = useCallback(() => {
    setError(null)
    setSuccess(false)
    setFileLink("")
    setComment("")
    setSelectedAssessmentId("")
  }, [])

  // Modal open/close handler
  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetModalState()
    }
  }, [resetModalState])

  // Set initial values when assessment loads
  useEffect(() => {
    // When filtering by traineeId, the API returns a single assessment object, not an array
    const assessment = Array.isArray(assessmentData?.trainingAssessment) 
      ? assessmentData.trainingAssessment[0] 
      : assessmentData?.trainingAssessment
    
    if (assessment) {
      setSelectedAssessmentId(assessment.id)
      // Only set these if they exist (for edit mode)
      if (assessment.answerFileLink) {
        setFileLink(assessment.answerFileLink)
      }
      if (assessment.comment) {
        setComment(assessment.comment)
      }
    }
  }, [assessmentData])

  // Event handlers
  const handleFileLinkChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFileLink(e.target.value)
  }, [])

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAssessmentId) {
      setError("Assessment not found")
      return
    }
    
    if (!fileLink.trim()) {
      setError("Please enter a file link")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      await submitAnswer({
        assessmentId: selectedAssessmentId,
        answerData: {
          answerFileLink: fileLink.trim(),
          comment: comment.trim() || undefined,
          traineeId: studentId
        }
      })
      setSuccess(true)
      // Close modal after 1.5 seconds to show success message
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (err: unknown) {
      console.error('Assessment submission error:', err)
      const errorMessage = err instanceof Error ? err.message : "Failed to submit assessment answer"
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedAssessmentId, fileLink, comment, studentId, submitAnswer])

  // Debug logging
  useEffect(() => {
    console.log('Assessment Modal Debug:', {
      assessmentData,
      selectedAssessmentId,
      fileLink,
      comment,
      isSubmitting,
      error,
      success
    })
  }, [assessmentData, selectedAssessmentId, fileLink, comment, isSubmitting, error, success])

  // Memoized render content
  const renderContent = useMemo(() => {
    if (isLoadingAssessment) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading assessment details...</p>
        </div>
      )
    }

    if (!assessmentData) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-600">Failed to load assessment data.</p>
        </div>
      )
    }

    // When filtering by traineeId, the API returns a single assessment object, not an array
    const assessment = Array.isArray(assessmentData.trainingAssessment) 
      ? assessmentData.trainingAssessment[0] 
      : assessmentData.trainingAssessment
    
    if (!assessment) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-600">Assessment not available for this session.</p>
        </div>
      )
    }

    const isEditMode = !!assessment.answerFileLink

    return (
      <form onSubmit={handleSubmit} className="space-y-4 py-2 px-5">
        {/* Assessment Details - Read Only */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="assessmentName">Assessment Name</Label>
            <Input
              id="assessmentName"
              value={assessment.name}
              readOnly
              className="mt-1.5 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="assessmentFile">Assessment File</Label>
            <Input
              id="assessmentFile"
              value={assessment.fileLink || "No file available"}
              readOnly
              className="mt-1.5 bg-gray-50"
            />
          </div>
        </div>

        {/* Show existing answer in edit mode */}
        {isEditMode && (
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <h5 className="text-sm font-medium text-green-700">Current Answer</h5>
            <a 
              href={assessment.answerFileLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm mt-1 block"
            >
              View Current Answer
            </a>
          </div>
        )}

        {/* Answer Input Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="answerLink">
              {isEditMode ? "New Answer File Link" : "Answer File Link"}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="answerLink"
              value={fileLink}
              onChange={handleFileLinkChange}
              placeholder={isEditMode ? "Enter new answer link to update" : "Enter your answer file link"}
              className="mt-1.5"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={handleCommentChange}
              placeholder="Add a comment about your submission..."
              className="mt-1.5"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Error Messages Only */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={!fileLink.trim() || isSubmitting}
            className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
            ) : (
              isEditMode ? "Update Answer" : "Submit Answer"
            )}
          </Button>
        </div>
      </form>
    )
  }, [
    isLoadingAssessment,
    assessmentData,
    fileLink,
    comment,
    handleFileLinkChange,
    handleCommentChange,
    handleSubmit,
    isSubmitting,
    error,
    success
  ])

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {assessmentType === 'PRE' ? 'Pre-Assessment' : 'Post-Assessment'} - {studentName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {renderContent}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 