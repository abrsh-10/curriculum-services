"use client"

import { useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAssessmentDetail, AssessmentSummary, useUpdateAssessment, /* useAddAssessmentSection, */ useAddAssessmentSectionsBulk, useUpdateAssessmentSection } from "@/lib/hooks/useAssessment"
import { AssessmentEditorProvider, useAssessmentEditor } from "./AssessmentEditorContext"
import { useUserRole } from "@/lib/hooks/useUserRole"
// Editors below handle entry/choice API calls directly; no direct usage here
// Keeping imports lean to avoid unused symbol warnings

// Import the new components
import { AssessmentSettings } from "./AssessmentSettings"
import { AssessmentNavigation } from "./AssessmentNavigation"
import { AssessmentQuestionPreview } from "./AssessmentQuestionPreview"
import { SingleAssessmentQuestionEditor } from "./SingleAssessmentQuestionEditor"
import { EditableAssessmentQuestionEditor } from "./EditableAssessmentQuestionEditor"
import { ReadOnlyQuestionView } from "./ReadOnlyQuestionView"

type QuestionType = "RADIO" | "CHECKBOX"

interface ChoiceForm {
  id?: string // For editing existing choices
  choice: string
  choiceImage: string
  choiceImageFile?: File
  isCorrect: boolean
}

interface AssessmentEntryForm {
  id?: string // For editing existing questions
  question: string
  questionImage: string
  questionImageFile?: File
  questionType: QuestionType
  choices: ChoiceForm[]
  weight: number
}

interface AssessmentSectionForm {
  id?: string // For editing existing sections
  title: string
  description: string
  assessmentEntries: AssessmentEntryForm[]
}

export interface CreateAssessmentData {
  name: string
  type: "PRE_POST"
  description: string
  duration: number
  maxAttempts: number
  contentDeveloperEmail: string
  timed: boolean
  sections: AssessmentSectionForm[]
}

interface CreateAssessmentFormProps {
  trainingId: string
  onCancel?: () => void
  onSubmit: (payload: CreateAssessmentData) => void
  isSubmitting?: boolean
  editingAssessment?: AssessmentSummary | null
}

const emptyChoice = (): ChoiceForm => ({ choice: "", choiceImage: "", choiceImageFile: undefined, isCorrect: false })
const emptyQuestion = (): AssessmentEntryForm => ({
  question: "",
  questionImage: "",
  questionImageFile: undefined,
  questionType: "RADIO",
  choices: [emptyChoice(), emptyChoice()],
  weight: 1,
})
const emptySection = (): AssessmentSectionForm => ({
  title: "",
  description: "",
  assessmentEntries: [emptyQuestion()],
})

function CreateAssessmentFormInner({ trainingId, onCancel, onSubmit, isSubmitting, editingAssessment }: CreateAssessmentFormProps) {
  const queryClient = useQueryClient()
  // Assessment basic info state
  const [assessmentName, setAssessmentName] = useState("")
  const [assessmentType, setAssessmentType] = useState<"PRE_POST" | "CAT">("PRE_POST")
  const [numberOfAttempts, setNumberOfAttempts] = useState<number>(2)
  const [timed, setTimed] = useState<boolean>(true)
  const [duration, setDuration] = useState<number>(2)
  const [durationType, setDurationType] = useState<"Minutes" | "Hours" | "Days">("Days")
  const [contentDeveloperEmail, setContentDeveloperEmail] = useState("")
  
  // Sections and questions state
  const [sections, setSections] = useState<AssessmentSectionForm[]>([emptySection()])
  
  // Use the context for navigation and editor state
  const {
    selectedSection,
    selectedQuestion,
    editorMode,
    questionState,
    setSelectedSection,
    setSelectedQuestion,
    setEditorMode,
    startEditingQuestion,
    startCreatingQuestion,
    stopEditingQuestion,
    navigateToNewQuestion,
    navigateToNewSection,
  } = useAssessmentEditor()
  const { isContentDeveloper } = useUserRole()

  // Fetch assessment details for editing
  const { data: assessmentDetailData, isLoading: isLoadingAssessment } = useAssessmentDetail(
    editingAssessment?.id || ""
  )

  // Edit hooks
  const updateAssessment = useUpdateAssessment()
  // Keep single-section hook for other flows, even if not used in bulk path
  // const addAssessmentSection = useAddAssessmentSection()
  const addAssessmentSectionsBulk = useAddAssessmentSectionsBulk()
  const updateAssessmentSection = useUpdateAssessmentSection()
  const sectionSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Helper function to convert minutes to appropriate duration and type
  const convertMinutesToDurationAndType = (minutes: number) => {
    if (minutes >= 1440) { // 24 hours or more
      return {
        duration: Math.round(minutes / 1440),
        durationType: "Days" as const
      }
    } else if (minutes >= 60) { // 1 hour or more
      return {
        duration: Math.round(minutes / 60),
        durationType: "Hours" as const
      }
    } else {
      return {
        duration: minutes,
        durationType: "Minutes" as const
      }
    }
  }

  // Populate form data when editing - only on initial load/data change
  useEffect(() => {
    if (!editingAssessment || !assessmentDetailData?.assessment) return

    const assessment = assessmentDetailData.assessment

    // Populate basic info
    setAssessmentName(assessment.name || "")
    setAssessmentType(assessment.type || "PRE_POST")
    setNumberOfAttempts(assessment.maxAttempts || 1)
    setTimed(assessment.timed || false)

    // Convert duration from minutes to appropriate format
    const { duration: convertedDuration, durationType: convertedDurationType } = convertMinutesToDurationAndType(assessment.duration || 0)
    setDuration(convertedDuration)
    setDurationType(convertedDurationType)

    setContentDeveloperEmail(assessment.contentDeveloper?.email || "")

    // Convert assessment sections to form format
    const formSections: AssessmentSectionForm[] = assessment.sections.map(section => ({
      id: section.id,
      title: section.title,
      description: section.description,
      assessmentEntries: section.questions.map(question => ({
        id: question.id,
        question: question.question,
        questionImage: question.questionImageUrl || "",
        questionImageFile: undefined,
        questionType: question.questionType,
        choices: question.choices.map(choice => ({
          id: choice.id,
          choice: choice.choiceText,
          choiceImage: choice.choiceImageUrl || "",
          choiceImageFile: undefined,
          isCorrect: choice.isCorrect
        })),
        weight: question.weight
      }))
    }))

    setSections(formSections.length > 0 ? formSections : [emptySection()])
    // Track only locally; not used elsewhere yet

    // Ensure selection indices are within bounds for the loaded data
    if (selectedSection >= formSections.length) {
      setSelectedSection(0)
    }
    const loadedQuestionsLen = formSections[selectedSection]?.assessmentEntries.length || 0
    if (selectedQuestion >= loadedQuestionsLen) {
      setSelectedQuestion(0)
    }
  }, [editingAssessment, assessmentDetailData])

  // Section management functions (adding section is disabled in edit mode; remains for create only)
  const addSection = () => {
    const newSectionIndex = sections.length
    const defaultTitle = `Section ${newSectionIndex + 1}`
    const newSection = { ...emptySection(), title: defaultTitle }
    setSections(prev => [...prev, newSection])
    navigateToNewSection(newSectionIndex)
    startCreatingQuestion()
  }

  const removeSection = (sectionIndex: number) => {
    setSections(prev => prev.filter((_, i) => i !== sectionIndex))
    if (selectedSection >= sectionIndex && selectedSection > 0) {
      setSelectedSection(selectedSection - 1)
    }
    if (sections.length <= 1) {
      setEditorMode('assessment')
    }
  }

  const updateSectionTitle = (sectionIndex: number, title: string) => {
    // capture current for PATCH before state change
    const current = sections[sectionIndex]
    const sectionId = current?.id
    const description = current?.description || ""
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex ? { ...section, title } : section
    ))
    // Debounced PATCH only if this is an existing section
    if (editingAssessment && sectionId) {
      const key = sectionId
      if (sectionSaveTimers.current[key]) {
        clearTimeout(sectionSaveTimers.current[key])
      }
      sectionSaveTimers.current[key] = setTimeout(() => {
        updateAssessmentSection.mutate({
          sectionId,
          data: { title, description, sectionOrder: sectionIndex + 1 }
        })
      }, 600)
    }
  }

  const updateSectionDescription = (sectionIndex: number, description: string) => {
    // capture current for PATCH before state change
    const current = sections[sectionIndex]
    const sectionId = current?.id
    const title = current?.title || `Section ${sectionIndex + 1}`
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex ? { ...section, description } : section
    ))
    // Debounced PATCH only if this is an existing section
    if (editingAssessment && sectionId) {
      const key = sectionId
      if (sectionSaveTimers.current[key]) {
        clearTimeout(sectionSaveTimers.current[key])
      }
      sectionSaveTimers.current[key] = setTimeout(() => {
        updateAssessmentSection.mutate({
          sectionId,
          data: { title, description, sectionOrder: sectionIndex + 1 }
        })
      }, 600)
    }
  }

  // Question management functions
  const addQuestion = (sectionIndex: number) => {
    const currentSection = sections[sectionIndex]
    const newQuestionIndex = currentSection.assessmentEntries.length
    
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { 
            ...section, 
            assessmentEntries: [...section.assessmentEntries, emptyQuestion()]
          }
        : section
    ))
    
    navigateToNewQuestion(sectionIndex, newQuestionIndex)
    // Switch editor to creation state for the new question
    startCreatingQuestion()
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const currentSection = sections[sectionIndex]
    const willHaveQuestions = currentSection.assessmentEntries.length > 1
    
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { 
            ...section, 
            assessmentEntries: section.assessmentEntries.filter((_, qI) => qI !== questionIndex)
          }
        : section
    ))
    
    // Navigate to a valid question or back to assessment mode
    if (willHaveQuestions) {
      const newQuestionIndex = questionIndex > 0 ? questionIndex - 1 : 0
      setSelectedQuestion(newQuestionIndex)
    } else if (sections.length > 0) {
      setEditorMode('assessment')
    }
  }

  const updateQuestion = (sectionIndex: number, questionIndex: number, updates: Partial<AssessmentEntryForm>) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { 
            ...section, 
            assessmentEntries: section.assessmentEntries.map((entry, qI) => 
              qI === questionIndex ? { ...entry, ...updates } : entry
            )
          }
        : section
    ))
  }

  // Choice management functions (kept for local-only creation flow but not directly referenced here)
  // These are intentionally not exported and may be used by child editors via props in the future

  // Navigation functions
  const selectAssessmentSettings = () => {
    setEditorMode('assessment')
  }

  const selectQuestion = (sectionIndex: number, questionIndex: number) => {
    setSelectedSection(sectionIndex)
    setSelectedQuestion(questionIndex)
    setEditorMode('question')
    stopEditingQuestion() // Reset to viewing mode when navigating
  }

  // Form validation
  const validateForm = () => {
    if (!assessmentName.trim()) {
      toast.error("Assessment name is required")
      return false
    }

    // Build sanitized sections: drop sections with no title and no valid questions
    const sanitizedSections = sections
      .map((section) => ({
        ...section,
        assessmentEntries: section.assessmentEntries.filter((q) => q.question.trim())
      }))
      .filter((section) => section.title.trim() || section.assessmentEntries.length > 0)

    // If no content sections remain, allow creating assessment with settings only
    if (sanitizedSections.length === 0) {
      return true
    }

    for (let sectionIndex = 0; sectionIndex < sanitizedSections.length; sectionIndex++) {
      const section = sanitizedSections[sectionIndex]
      
      if (!section.title.trim()) {
        toast.error(`Section ${sectionIndex + 1} title is required`)
        return false
      }

      if (section.assessmentEntries.length === 0) {
        toast.error(`Section "${section.title}" must have at least one question`)
        return false
      }

      for (let questionIndex = 0; questionIndex < section.assessmentEntries.length; questionIndex++) {
        const question = section.assessmentEntries[questionIndex]
        
        if (!question.question.trim()) {
          toast.error(`Section "${section.title}", Question ${questionIndex + 1}: Question text is required`)
          return false
        }

        if (question.choices.length < 2) {
          toast.error(`Section "${section.title}", Question ${questionIndex + 1}: At least 2 choices are required`)
          return false
        }

        if (question.questionType === "RADIO" && question.choices.filter(c => c.isCorrect).length !== 1) {
          toast.error(`Section "${section.title}", Question ${questionIndex + 1}: Exactly one correct answer is required for single choice questions`)
          return false
        }

        if (question.questionType === "CHECKBOX" && question.choices.filter(c => c.isCorrect).length < 1) {
          toast.error(`Section "${section.title}", Question ${questionIndex + 1}: At least one correct answer is required for multiple choice questions`)
          return false
        }
      }
    }

    return true
  }

  // Form submission
  const handleSubmit = () => {
    if (editingAssessment) {
      handleUpdateAssessment()
    } else {
      if (!validateForm()) {
        return
      }
      handleCreateAssessment()
    }
  }

  const handleCreateAssessment = () => {
    // Convert duration to minutes based on duration type
    let durationInMinutes = Number(duration) || 0
    if (durationType === "Hours") {
      durationInMinutes = durationInMinutes * 60
    } else if (durationType === "Days") {
      durationInMinutes = durationInMinutes * 24 * 60
    }

    // Sanitize sections: remove empty questions and drop sections without title and questions
    const sanitizedSections = sections
      .map((section) => ({
        ...section,
        assessmentEntries: section.assessmentEntries.filter((q) => q.question.trim())
      }))
      .filter((section) => section.title.trim() || section.assessmentEntries.length > 0)

    const payload: CreateAssessmentData = {
      name: assessmentName,
      type: "PRE_POST", // Always send PRE_POST for now, even if CAT is selected
      description: `${assessmentType} Assessment`, // Use type as description
      duration: timed ? durationInMinutes : 0,
      maxAttempts: numberOfAttempts,
      contentDeveloperEmail,
      timed,
      sections: sanitizedSections,
    }
    onSubmit(payload)
  }

  const handleUpdateAssessment = () => {
    // Validate basic settings
    if (!assessmentName.trim()) {
      toast.error("Assessment name is required")
      return
    }
    if (numberOfAttempts <= 0) {
      toast.error("Number of attempts must be greater than 0")
      return
    }
    if (timed && duration <= 0) {
      toast.error("Duration must be greater than 0 for timed assessments")
      return
    }
    // Content developer email is optional during edit

    // Convert duration to minutes based on duration type
    let durationInMinutes = Number(duration) || 0
    if (durationType === "Hours") {
      durationInMinutes = durationInMinutes * 60
    } else if (durationType === "Days") {
      durationInMinutes = durationInMinutes * 24 * 60
    }

    updateAssessment.mutate({
      assessmentId: editingAssessment!.id,
      data: {
        name: assessmentName,
        type: "PRE_POST",
        description: `${assessmentType} Assessment`,
        duration: timed ? durationInMinutes : 0,
        maxAttempts: numberOfAttempts,
        contentDeveloperEmail,
        timed,
      }
    }, {
      onSuccess: () => {
        toast.success("Assessment settings updated successfully")
        // Don't close the form, user might want to edit questions too
      }
    })
  }

  const currentQuestion = sections[selectedSection]?.assessmentEntries[selectedQuestion]

  // Helper: identify sections (by index) that are ready to post
  const getUnsavedReadySectionIndexes = () => {
    const indexes: number[] = []
    sections.forEach((sec, idx) => {
      // Consider any section with at least one entry as ready (content may include images only)
      const hasAnyEntry = (sec.assessmentEntries || []).length > 0
      if (!sec.id && hasAnyEntry) indexes.push(idx)
    })
    return indexes
  }

  const [creatingAllSections, setCreatingAllSections] = useState(false)

  const handleCreateAllSections = async () => {
    if (!editingAssessment?.id) return
    const sectionIndexes = getUnsavedReadySectionIndexes()
    if (sectionIndexes.length === 0) {
      toast.error("Add at least one question to a section before creating")
      return
    }

    setCreatingAllSections(true)
    try {
      const unsavedSections = sectionIndexes.map((idx) => {
        const sec = sections[idx]
        return {
          title: sec.title || `Section ${idx + 1}`,
          description: sec.description || "",
          assessmentEntries: (sec.assessmentEntries || []).map((q: AssessmentEntryForm) => ({
            question: q.question,
            questionImage: q.questionImage,
            questionType: q.questionType,
            weight: q.weight,
            choices: (q.choices || []).map((c: ChoiceForm) => ({
              choice: c.choice,
              choiceImage: c.choiceImage,
              isCorrect: c.isCorrect,
            })),
          })),
        }
      })

      // Bulk post all ready sections in a single request
      const res = await addAssessmentSectionsBulk.mutateAsync({
        assessmentId: editingAssessment.id,
        sections: unsavedSections,
      })

      // Try to update local state with returned IDs if available
      let createdSections: { id?: string; section?: { id?: string } }[] | undefined = undefined
      if (Array.isArray(res)) createdSections = res
      else if (Array.isArray(res?.sections)) createdSections = res.sections
      else if (Array.isArray(res?.data?.sections)) createdSections = res.data.sections

      if (createdSections && createdSections.length === sectionIndexes.length) {
        const updated = [...sections]
        sectionIndexes.forEach((idx, i) => {
          const created = createdSections?.[i]
          const newId = created?.id || created?.section?.id
          if (newId) {
            updated[idx] = { ...updated[idx], id: newId }
          }
        })
        setSections(updated)
      }

      toast.success("All sections created successfully")
      // Refresh assessment detail so UI reflects newly created sections/ids
      queryClient.invalidateQueries({ queryKey: ["assessments", "detail", editingAssessment.id] })
      queryClient.invalidateQueries({ queryKey: ["assessments"] })
      } catch {
      // Errors are toasted in hook as well
    } finally {
      setCreatingAllSections(false)
    }
  }

  // Keep selection valid after local sections state changes during creation
  useEffect(() => {
    if (editorMode !== 'question' || questionState !== 'creating') return
    const qLen = sections[selectedSection]?.assessmentEntries.length || 0
    if (qLen === 0) return
    if (selectedQuestion > qLen - 1) {
      setSelectedQuestion(qLen - 1)
    }
  }, [sections, selectedSection, editorMode, questionState, selectedQuestion, setSelectedQuestion])

  // Show loading when fetching assessment details for editing
  if (editingAssessment && isLoadingAssessment) {
    return (
      <div className="min-h-screen bg-gray-50 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading assessment details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <div className="bg-white border-b w-full">
        <div className="px-[7%] py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAssessment ? "Edit Assessment" : "Create New Assessment"}
              </h2>
              <p className="text-gray-600 mt-1">
                {editorMode === 'assessment' 
                  ? (editingAssessment ? 'Update assessment settings and basic information' : 'Configure assessment settings and basic information')
                  : `Editing ${sections[selectedSection]?.title || `Section ${selectedSection + 1}`} - Question ${selectedQuestion + 1}`
                }
              </p>
            </div>
            
              <div className="flex gap-3">
                {/* Show header Cancel unless we're in assessment settings while editing,
                    in which case Cancel appears inside the settings panel next to Update */}
                {onCancel && !(editorMode === 'assessment' && !!editingAssessment) && (
                  <Button variant="outline" onClick={onCancel} className="px-6">
                    Cancel
                  </Button>
                )}
        {/* Content developer: create all local sections with their questions at once */}
        {isContentDeveloper && !!editingAssessment && (
                <Button
                  onClick={handleCreateAllSections}
                  className="bg-green-600 text-white hover:bg-green-700 px-6"
                  disabled={creatingAllSections}
                >
                  {creatingAllSections ? "Creating..." : "Create All Sections"}
                </Button>
        )}
        {/* Only show the main submit button in header when creating new assessment */}
        {!editingAssessment && !isContentDeveloper && (
                <Button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-6"
                  disabled={isSubmitting || updateAssessment.isPending}
                >
                  {isSubmitting 
                    ? (editingAssessment ? "Updating..." : "Creating...") 
                    : (editingAssessment ? (updateAssessment.isPending ? "Updating..." : "Update Assessment") : "Create Assessment")
                  }
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <div className="px-[7%] py-8">
          <div className="grid grid-cols-12 gap-8 max-w-full w-full">
            {/* Left Sidebar - Navigation */}
            <div className="col-span-3">
              <AssessmentNavigation
                sections={sections}
                selectedSection={selectedSection}
                selectedQuestion={selectedQuestion}
                editMode={editorMode}
                assessmentName={assessmentName}
                isEditMode={false}
                canAddSection={true}
                disableAssessmentSettings={!!editingAssessment && isContentDeveloper}
                onSelectAssessmentSettings={selectAssessmentSettings}
                onSelectQuestion={selectQuestion}
                onUpdateSectionTitle={updateSectionTitle}
                onUpdateSectionDescription={updateSectionDescription}
                onDeleteSection={removeSection}
                onDeleteQuestion={removeQuestion}
                onAddQuestion={addQuestion}
                onAddSection={addSection}
                onSaveSectionMeta={(idx, title, description) => {
                  // Update local state immediately
                  setSections(prev => prev.map((s, i) => i === idx ? { ...s, title, description } : s))
                  const sec = sections[idx]
                  const sectionId = sec?.id
                  if (editingAssessment && sectionId) {
                    updateAssessmentSection.mutate({
                      sectionId,
                      data: { title, description, sectionOrder: idx + 1 }
                    })
                  }
                }}
                onReorderSections={(fromIdx, toIdx) => {
                  if (fromIdx === toIdx) return
                  setSections(prev => {
                    const next = [...prev]
                    const [moved] = next.splice(fromIdx, 1)
                    next.splice(toIdx, 0, moved)
                    // Adjust selection index to follow moved section naturally
                    let nextSelected = selectedSection
                    if (selectedSection === fromIdx) nextSelected = toIdx
                    else if (fromIdx < selectedSection && toIdx >= selectedSection) nextSelected = selectedSection - 1
                    else if (fromIdx > selectedSection && toIdx <= selectedSection) nextSelected = selectedSection + 1
                    setSelectedSection(Math.max(0, Math.min(next.length - 1, nextSelected)))
                    // Persist new order only for sections with ids and whose index changed
                    const prevIndexById = new Map<string, number>()
                    prev.forEach((s, i) => { if (s.id) prevIndexById.set(s.id, i) })
                    next.forEach((s, i) => {
                      if (!s.id) return
                      const prevIdx = prevIndexById.get(s.id)
                      if (prevIdx !== i && editingAssessment) {
                        updateAssessmentSection.mutate({
                          sectionId: s.id,
                          data: { title: s.title, description: s.description, sectionOrder: i + 1 }
                        })
                      }
                    })
                    return next
                  })
                }}
              />
            </div>

            {/* Main Content Area */}
            <div className="col-span-6">
              <Card className="w-full">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">
                    {editorMode === 'assessment' ? 'Assessment Settings' : 'Question Editor'}
                  </h3>
                </div>
                
                <div className="p-6">
                {editorMode === 'assessment' ? (
                  <AssessmentSettings
                    assessmentName={assessmentName}
                    setAssessmentName={setAssessmentName}
                    assessmentType={assessmentType}
                    setAssessmentType={setAssessmentType}
                    numberOfAttempts={numberOfAttempts}
                    setNumberOfAttempts={setNumberOfAttempts}
                    timed={timed}
                    setTimed={setTimed}
                    duration={duration}
                    setDuration={setDuration}
                    durationType={durationType}
                    setDurationType={setDurationType}
                    contentDeveloperEmail={contentDeveloperEmail}
                    setContentDeveloperEmail={setContentDeveloperEmail}
                    trainingId={trainingId}
                    onSubmit={editingAssessment ? handleSubmit : undefined}
                    onCancel={editingAssessment ? onCancel : undefined}
                    submitLabel={editingAssessment ? "Update Assessment" : undefined}
                    isSubmitting={isSubmitting || updateAssessment.isPending}
                  />
                        ) : (
                          currentQuestion && (
                            <>
                              {editingAssessment ? (
                                // In edit mode, use the editable editor for both creating and editing
                                questionState !== 'viewing' || !currentQuestion.id ? (
                                  <EditableAssessmentQuestionEditor
                                    key={`${sections[selectedSection]?.id || 'local'}-${selectedSection}-${selectedQuestion}-${currentQuestion?.id || 'new'}`}
                                    question={currentQuestion}
                                    sectionId={sections[selectedSection]?.id}
                                    isEditing={true}
                                    onUpdateQuestion={(updates) => updateQuestion(selectedSection, selectedQuestion, updates)}
                                    onSaveQuestion={() => {
                                      stopEditingQuestion()
                                      toast.success("Question saved successfully")
                                    }}
                                    onCancelEdit={() => stopEditingQuestion()}
                                    assessmentId={editingAssessment?.id}
                                    sectionTitle={sections[selectedSection]?.title}
                                    sectionDescription={sections[selectedSection]?.description}
                                    onSectionCreated={(newSectionId) => {
                                      // write back the new section id locally so next questions attach correctly
                                      setSections(prev => prev.map((section, i) => i === selectedSection ? { ...section, id: newSectionId } : section))
                                    }}
                                    disableHeaderActions={isContentDeveloper}
                                  />
                                ) : (
                                  <>
                                    <div className="mb-4 flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                          Question {selectedQuestion + 1}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                          Saved
                                        </Badge>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={startEditingQuestion}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        Edit Question
                                      </Button>
                                    </div>
                                    <ReadOnlyQuestionView question={currentQuestion} />
                                  </>
                                )
                              ) : (
                                <SingleAssessmentQuestionEditor
                                  key={`${sections[selectedSection]?.id || 'local'}-${selectedSection}-${selectedQuestion}-create`}
                                  question={currentQuestion}
                                  onUpdateQuestion={(updates) => updateQuestion(selectedSection, selectedQuestion, updates)}
                                />
                              )}
                            </>
                          )
                        )}
                </div>
              </Card>
            </div>

            {/* Right Sidebar - Preview */}
            <div className="col-span-3">
              {editorMode === 'question' && currentQuestion && (
                <AssessmentQuestionPreview question={currentQuestion} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper component with context provider
export function CreateAssessmentForm(props: CreateAssessmentFormProps) {
  return (
    <AssessmentEditorProvider>
      <CreateAssessmentFormInner {...props} />
    </AssessmentEditorProvider>
  )
}

export default CreateAssessmentForm


