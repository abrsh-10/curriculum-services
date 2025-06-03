"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateContent } from "@/lib/hooks/useContent"
import { useModulesByTrainingId } from "@/lib/hooks/useModule"
import { useGetLessons } from "@/lib/hooks/useLesson"
import { useTrainingAssessments } from "@/lib/hooks/useCat"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { Loader2, Info, AlertTriangle, BookOpen, FileType, Mail, ClipboardCheck, FolderOpen } from "lucide-react"

interface ContentRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

type ContentTargetType = 'module' | 'assessment' | ''

interface ContentFormData {
  name: string
  description: string
  contentFileType: 'PDF' | 'VIDEO' | 'LINK'
  targetType: ContentTargetType
  moduleId: string
  lessonId?: string
  assessmentId?: string
  email: string
}

export function ContentRequestModal({ 
  isOpen, 
  onClose,
}: ContentRequestModalProps) {
  const params = useParams()
  const [formData, setFormData] = useState<ContentFormData>({
    name: "",
    description: "",
    contentFileType: "PDF",
    targetType: "",
    moduleId: "",
    email: ""
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContentFormData, string>>>({})
  
  // Reset form data when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
        contentFileType: "PDF",
        targetType: "",
        moduleId: "",
        email: "",
        lessonId: undefined,
        assessmentId: undefined
      })
      setErrors({})
    }
  }, [isOpen])

  // Fetch module details to get current module info
  const { data: moduleDetails, isLoading: isModuleLoading } = useModulesByTrainingId(params.trainingId as string)
  
  // Fetch lessons for the current module
  const { data: lessonData, isLoading: isLessonsLoading } = useGetLessons(formData.moduleId)
  
  // Fetch assessments for the training
  const { data: assessmentData, isLoading: isAssessmentsLoading } = useTrainingAssessments(params.trainingId as string, 1, 100)
  
  const { mutateAsync: createContent, isPending: isCreating } = useCreateContent()

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ContentFormData, string>> = {}
    
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.contentFileType) newErrors.contentFileType = "File type is required"
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address"
    }
    
    // Target type selection is required
    if (!formData.targetType) {
      newErrors.targetType = "Please select what you want to create content for"
    }
    
    // Module-based content validation
    if (formData.targetType === 'module') {
      if (!formData.moduleId) {
        newErrors.moduleId = "Please select a module"
      }
      // For module-based content, lesson is optional
    }
    
    // Assessment-based content validation
    if (formData.targetType === 'assessment') {
      if (!formData.assessmentId) {
        newErrors.assessmentId = "Please select an assessment"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const payload: {
        singleContentRequestDTO: Array<{
          name: string
          description: string
          contentFileType: 'PDF' | 'VIDEO' | 'LINK'
        }>
        email: string
        moduleId?: string
        lessonId?: string
        assessmentId?: string
      } = {
        singleContentRequestDTO: [{
          name: formData.name,
          description: formData.description,
          contentFileType: formData.contentFileType
        }],
        email: formData.email,
      }

      if (formData.targetType === 'module') {
        payload.moduleId = formData.moduleId
        if (formData.lessonId) {
          payload.lessonId = formData.lessonId
        }
      } else if (formData.targetType === 'assessment') {
        payload.assessmentId = formData.assessmentId
        // For assessment-based content, we still need a moduleId - use the first available module
        if (hasModules && moduleDetails?.modules?.[0]) {
          payload.moduleId = moduleDetails.modules[0].id
        }
      }

      await createContent(payload)
      onClose()
    } catch (error) {
      console.log("Content request error:", error)
    }
  }

  // Check if we have lessons and assessments
  const hasLessons = lessonData && lessonData.length > 0
  const hasAssessments = assessmentData?.assessments && assessmentData.assessments.length > 0
  const hasModules = moduleDetails?.modules && moduleDetails.modules.length > 0
  
  // Get the current module name
  const selectedModule = moduleDetails?.modules?.find(m => m.id === formData.moduleId)
  const moduleName = selectedModule?.name || "Selected Module"

  // Determine if submit should be disabled
  const isSubmitDisabled = Boolean(
    isCreating || 
    !formData.targetType || 
    (formData.targetType === 'module' && (!hasModules || isModuleLoading)) ||
    (formData.targetType === 'assessment' && (!hasAssessments || isAssessmentsLoading)) ||
    (formData.targetType === 'module' && formData.moduleId && isLessonsLoading)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="py-4 px-5 border-b bg-gray-50">
          <DialogTitle className="text-lg flex items-center gap-2">
            <FileType className="h-5 w-5 text-blue-500" />
            Request Content
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4">
          <div className="grid gap-4">
            {/* Target Type Selection */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                <span>What do you want to create content for?</span> <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.targetType}
                onValueChange={(value: ContentTargetType) => {
                  setFormData((prev) => ({ 
                    ...prev, 
                    targetType: value,
                    moduleId: "",
                    lessonId: undefined,
                    assessmentId: undefined
                  }))
                  if (errors.targetType) setErrors((prev) => ({ ...prev, targetType: "" }))
                }}
              >
                <SelectTrigger className={cn("h-12", errors.targetType && "border-red-500")}>
                  <SelectValue placeholder="Select content target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="module">Module & Lessons</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
              {errors.targetType && (
                <span className="text-xs text-red-500 mt-1 block">{errors.targetType}</span>
              )}
            </div>

            {/* Show context information only after target type is selected */}
            {formData.targetType && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-700">
                    {formData.targetType === 'module' ? (
                      <>Creating content for a <span className="font-medium">module and its lessons</span>. You can optionally select a specific lesson.</>
                    ) : (
                      <>Creating content for an <span className="font-medium">assessment</span>. This content will be associated with the selected assessment.</>
                    )}
                  </p>
                </div>
              </div>
            )}
          
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                  <span>Content Name</span> <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter content name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
                  }}
                  className={cn("h-12", errors.name && "border-red-500")}
                  disabled={isSubmitDisabled || !Boolean(formData.targetType)}
                />
                {errors.name && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.name}</span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                  <span>Content Type</span> <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.contentFileType}
                  onValueChange={(value: 'PDF' | 'VIDEO' | 'LINK') => {
                    setFormData((prev) => ({ ...prev, contentFileType: value }))
                    if (errors.contentFileType) setErrors((prev) => ({ ...prev, contentFileType: "" }))
                  }}
                  disabled={isSubmitDisabled || !Boolean(formData.targetType)}
                >
                  <SelectTrigger className={cn("h-12", errors.contentFileType && "border-red-500")}>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="LINK">Link</SelectItem>
                  </SelectContent>
                </Select>
                {errors.contentFileType && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.contentFileType}</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                <span>Description</span> <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Provide a detailed description of the content you need"
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                  if (errors.description) setErrors((prev) => ({ ...prev, description: "" }))
                }}
                className={cn("min-h-[80px]", errors.description && "border-red-500")}
                disabled={isSubmitDisabled || !Boolean(formData.targetType)}
              />
              {errors.description && (
                <span className="text-xs text-red-500 mt-1 block">{errors.description}</span>
              )}
            </div>

            {/* Module-based content fields */}
            {formData.targetType === 'module' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span>Module</span> <span className="text-red-500">*</span>
                  </label>
                  {isModuleLoading ? (
                    <div className="flex items-center gap-2 p-1.5 border rounded-md h-12">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading modules...</span>
                    </div>
                  ) : (
                    <Select
                      value={formData.moduleId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, moduleId: value, lessonId: undefined }))
                        if (errors.moduleId) setErrors((prev) => ({ ...prev, moduleId: "" }))
                      }}
                      disabled={!hasModules}
                    >
                      <SelectTrigger className={cn("h-12", errors.moduleId && "border-red-500")}>
                        <SelectValue placeholder={hasModules ? "Select a module" : "No modules available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {moduleDetails?.modules?.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.moduleId && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.moduleId}</span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span>Lesson</span> <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  {isLessonsLoading && formData.moduleId ? (
                    <div className="flex items-center gap-2 p-1.5 border rounded-md h-12">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading lessons...</span>
                    </div>
                  ) : (
                    <Select
                      value={formData.lessonId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, lessonId: value }))
                        if (errors.lessonId) setErrors((prev) => ({ ...prev, lessonId: "" }))
                      }}
                      disabled={!formData.moduleId || !hasLessons}
                    >
                      <SelectTrigger className={cn("h-12", errors.lessonId && "border-red-500")}>
                        <SelectValue placeholder={
                          !formData.moduleId ? "Select a module first" :
                          hasLessons ? "Select a lesson (optional)" : "No lessons available"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {lessonData?.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.lessonId && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.lessonId}</span>
                  )}
                </div>
              </div>
            )}

            {/* Assessment-based content fields */}
            {formData.targetType === 'assessment' && (
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                  <ClipboardCheck className="h-4 w-4 text-gray-500" />
                  <span>Assessment</span> <span className="text-red-500">*</span>
                </label>
                {isAssessmentsLoading ? (
                  <div className="flex items-center gap-2 p-1.5 border rounded-md h-12">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading assessments...</span>
                  </div>
                ) : (
                  <Select
                    value={formData.assessmentId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, assessmentId: value }))
                      if (errors.assessmentId) setErrors((prev) => ({ ...prev, assessmentId: "" }))
                    }}
                    disabled={!hasAssessments}
                  >
                    <SelectTrigger className={cn("h-12", errors.assessmentId && "border-red-500")}>
                      <SelectValue placeholder={hasAssessments ? "Select an assessment" : "No assessments available"} />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentData?.assessments?.map((assessment) => (
                        <SelectItem key={assessment.id} value={assessment.id}>
                          {assessment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.assessmentId && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.assessmentId}</span>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>Content Developer Email</span> <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="developer@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                }}
                className={cn("h-12", errors.email && "border-red-500")}
                disabled={isSubmitDisabled || !Boolean(formData.targetType)}
              />
              {errors.email && (
                <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="py-4 px-5">
          <Button variant="outline" onClick={onClose} size="default" className="mr-2">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled}
            size="default"
            className={cn(
              "text-white",
              isSubmitDisabled 
                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : !formData.targetType ? (
              'Select Content Target'
            ) : formData.targetType === 'module' && !hasModules ? (
              'No Modules Available'
            ) : formData.targetType === 'assessment' && !hasAssessments ? (
              'No Assessments Available'
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 