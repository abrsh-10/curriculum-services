"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { TrainingAssessment } from "@/lib/hooks/useTrainingAssessment"

interface CatFormModalProps {
  isOpen: boolean
  onClose: () => void
  isEditing: boolean
  assessment: TrainingAssessment | null
  isSubmitting: boolean
  onSubmit: (data: { name: string; description: string; fileLink: string; trainingAssessmentType: 'PRE' | 'POST' }) => Promise<void>
}

export function AssessmentFormModal({
  isOpen,
  onClose,
  isEditing,
  assessment,
  isSubmitting,
  onSubmit
}: CatFormModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [fileLink, setFileLink] = useState("")
  const [trainingAssessmentType, setTrainingAssessmentType] = useState<'PRE' | 'POST'>('PRE')
  const [errors, setErrors] = useState<{
    name?: string
    description?: string
    fileLink?: string
    trainingAssessmentType?: string
  }>({})

  // Populate form when editing an existing assessment
  useEffect(() => {
    if (isEditing && assessment) {
      setName(assessment.name || "")
      setDescription(assessment.description || "")
      setFileLink(assessment.fileLink || "")
      setTrainingAssessmentType(assessment.trainingAssessmentType || 'PRE')
    } else {
      // Reset form for new assessment
      setName("")
      setDescription("")
      setFileLink("")
      setTrainingAssessmentType('PRE')
    }
  }, [isEditing, assessment])

  const validateForm = () => {
    const newErrors: {
      name?: string
      description?: string
      fileLink?: string
      trainingAssessmentType?: string
    } = {}

    if (!name.trim()) {
      newErrors.name = "Assessment name is required"
    }

    if (!description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!fileLink.trim()) {
      newErrors.fileLink = "File link is required"
    } else if (!isValidUrl(fileLink)) {
      newErrors.fileLink = "Please enter a valid URL"
    }

    if (!trainingAssessmentType) {
      newErrors.trainingAssessmentType = "Assessment type is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      // Add https:// protocol if missing
      const urlToTest = url.match(/^https?:\/\//) ? url : `https://${url}`
      new URL(urlToTest)
      return true
    } catch (error) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      await onSubmit({
        name,
        description,
        fileLink,
        trainingAssessmentType
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Assessment" : "Add New Assessment"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Assessment Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter assessment name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter assessment description"
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainingAssessmentType">
              Assessment Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={trainingAssessmentType}
              onValueChange={(value: 'PRE' | 'POST') => setTrainingAssessmentType(value)}
            >
              <SelectTrigger className={errors.trainingAssessmentType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select assessment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRE">Pre-Training Assessment</SelectItem>
                <SelectItem value="POST">Post-Training Assessment</SelectItem>
              </SelectContent>
            </Select>
            {errors.trainingAssessmentType && (
              <p className="text-red-500 text-xs mt-1">{errors.trainingAssessmentType}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fileLink">
              File Link <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fileLink"
              value={fileLink}
              onChange={(e) => setFileLink(e.target.value)}
              placeholder="Enter URL to assessment file"
              className={errors.fileLink ? "border-red-500" : ""}
            />
            {errors.fileLink && (
              <p className="text-red-500 text-xs mt-1">{errors.fileLink}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Assessment" : "Create Assessment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 