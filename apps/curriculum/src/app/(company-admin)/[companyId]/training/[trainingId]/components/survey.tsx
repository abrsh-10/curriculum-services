"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, PencilIcon, AlertCircle, CalendarIcon, ClipboardList } from "lucide-react"
import { 
  useCreateSurvey, 
  useSurveys,
  useSurveyDetail,
  useUpdateSurvey,
  useDeleteSurvey,
  useUpdateSurveyQuestion,
  useDeleteSurveyEntry,
  useAddQuestionToSurvey,
  SurveyQuestion,
  SurveyEntry,
  Survey
} from "@/lib/hooks/useSessionAssesment"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDateToDisplay } from "@/lib/utils"
import React from "react"
import { SurveyDeleteDialog } from "./survey/SurveyDeleteDialog"
import { SurveyQuestionManager } from "./survey/SurveyQuestionManager"

interface SurveyComponentProps {
  trainingId: string;
}

// Extracted component for choice input
const ChoiceInput = ({
  choice,
  index,
  onChange,
  onRemove,
  canRemove
}: {
  choice: string;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
      {String.fromCharCode(65 + index)}
    </div>
    <Input
      value={choice}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Choice ${index + 1}`}
      className="flex-1"
    />
    <Button
      variant="ghost"
      size="sm"
      onClick={onRemove}
      disabled={!canRemove}
      className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

// Extracted component for preview choice
const PreviewChoice = ({ choice, index }: { choice: string; index: number }) => (
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
      {String.fromCharCode(65 + index)}
    </div>
    <span>{choice || `Choice ${index + 1} will appear here`}</span>
  </div>
);

// Extracted component for existing question display
const ExistingQuestionCard = ({
  entry,
  index,
  onEdit,
  onDelete
}: {
  entry: SurveyEntry;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <Card key={entry.id} className="bg-gray-50 border p-6">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h3 className="text-lg font-medium mb-4">
          <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full mr-2 text-sm">
            {index + 1}
          </span>
          {entry.question}
        </h3>
        <div className="space-y-3 pl-9">
          {entry.choices.map((choice: string, choiceIdx: number) => (
            <div key={choiceIdx} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                {String.fromCharCode(65 + choiceIdx)}
              </div>
              <span>{choice}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEdit}
          className="h-8 w-8 p-0"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </Card>
);

// Add a SessionSurvey type definition
interface SessionSurvey {
  id: string;
  preTrainingAssessmentEntries?: SurveyEntry[];
  // Add other properties as needed
}

// Local interface to match the API requirements
interface CreateSurveyData {
  name: string;
  description: string;
  surveyQuestions: SurveyQuestion[];
}

// Survey card component to display each survey in the list
const SurveyCard = ({
  survey,
  onDelete,
  onView
}: {
  survey: Survey;
  onDelete: () => void;
  onView: () => void;
}) => (
  <Card className="bg-white border p-6 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h3 className="text-lg font-medium mb-2">{survey.name}</h3>
        <p className="text-gray-500 text-sm mb-4">{survey.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {survey.sessionName && (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>Session: {survey.sessionName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-gray-400" />
            <span>Survey ID: {survey.id.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onView}
          className="h-8"
        >
          View
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </Card>
);

/**
 * Survey component that allows creating multiple-choice questions
 * for trainees to answer about the training.
 */
export function SurveyComponent({ trainingId }: SurveyComponentProps) {
  const router = useRouter()
  const params = useParams()
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { question: "", choices: ["", ""] }
  ])
  const [surveyName, setSurveyName] = useState("")
  const [surveyDescription, setSurveyDescription] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; survey: Survey | null }>({
    isOpen: false,
    survey: null
  })
  
  // Fetch existing surveys for this training
  const { 
    data: surveyData, 
    isLoading: isLoadingSurveys,
    error: surveysError,
    refetch: refetchSurveys
  } = useSurveys(trainingId)
  
  // Fetch survey details when viewing or editing
  const { 
    data: surveyDetailData, 
    isLoading: isLoadingSurveyDetails,
    refetch: refetchSurveyDetails
  } = useSurveyDetail(currentSurveyId || "", undefined)
  
  const { createSurvey, isLoading: isCreatingSurvey } = useCreateSurvey(trainingId)
  const { deleteSurvey, isLoading: isDeletingSurvey } = useDeleteSurvey()
  const { updateSurvey, isLoading: isUpdatingSurvey } = useUpdateSurvey()

  // Extract survey data
  const surveys = surveyData?.surveys || []
  const surveyDetail = surveyDetailData?.survey
  const hasExistingSurveys = useMemo(() => surveys.length > 0, [surveys])

  // Initialize form with default values
  const resetForm = useCallback(() => {
    setQuestions([{ question: "", choices: ["", ""] }])
    setSurveyName("")
    setSurveyDescription("")
  }, [])

  // Handle starting to create a new survey
  const handleStartCreate = useCallback(() => {
    setIsCreating(true)
    setIsEditing(null)
    resetForm()
  }, [resetForm])

  // Handle canceling creation or editing
  const handleCancel = useCallback(() => {
    setIsCreating(false)
    setIsEditing(null)
    setIsViewing(false)
    setCurrentSurveyId(null)
    resetForm()
  }, [resetForm])

  const addQuestion = useCallback(() => {
    setQuestions(prev => [...prev, { question: "", choices: ["", ""] }])
  }, [])

  const removeQuestion = useCallback((index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateQuestionText = useCallback((index: number, question: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, question } : q
    ))
  }, [])

  const addChoice = useCallback((questionIndex: number) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { ...q, choices: [...q.choices, ""] }
        : q
    ))
  }, [])

  const removeChoice = useCallback((questionIndex: number, choiceIndex: number) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { ...q, choices: q.choices.filter((_: string, cI: number) => cI !== choiceIndex) }
        : q
    ))
  }, [])

  const updateChoice = useCallback((questionIndex: number, choiceIndex: number, newChoice: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { 
            ...q, 
            choices: q.choices.map((c: string, cI: number) => 
              cI === choiceIndex ? newChoice : c
            ) 
          }
        : q
    ))
  }, [])

  const validateQuestions = useCallback((questionsToValidate: SurveyQuestion[]) => {
    return questionsToValidate.every(q => 
      q.question.trim() !== "" && 
      q.choices.length >= 2 &&
      q.choices.every((c: string) => c.trim() !== "")
    )
  }, [])

  const validateSurveyDetails = useCallback(() => {
    if (!surveyName.trim()) {
      toast.error("Please enter a survey name")
      return false
    }
    if (!surveyDescription.trim()) {
      toast.error("Please enter a survey description")
      return false
    }
    return true
  }, [surveyName, surveyDescription])

  const handleCreateSubmit = useCallback(() => {
    // Validate form before submission
    if (!validateSurveyDetails()) {
      return
    }
    
    if (!validateQuestions(questions)) {
      toast.error("Please complete all questions with at least 2 choices each")
      return
    }

    // Submit the survey with the updated data structure
    const surveyData: CreateSurveyData = {
      name: surveyName,
      description: surveyDescription,
      surveyQuestions: questions
    };
    
    createSurvey(surveyData, {
      onSuccess: () => {
        setIsCreating(false)
        resetForm()
        refetchSurveys()
      }
    });
  }, [questions, createSurvey, validateQuestions, validateSurveyDetails, surveyName, surveyDescription, resetForm, refetchSurveys])

  const handleEditSurvey = useCallback((surveyId: string) => {
    // Set the editing state and load survey data
    setIsEditing(surveyId)
    setIsCreating(false)
    setIsViewing(false)
    setCurrentSurveyId(surveyId)
  }, [])

  const handleViewSurvey = useCallback((surveyId: string) => {
    // Set the viewing state
    setIsViewing(true)
    setIsCreating(false)
    setIsEditing(null)
    setCurrentSurveyId(surveyId)
  }, [])

  // Effect to load survey details when currentSurveyId changes
  const loadSurveyData = useCallback(() => {
    if (surveyDetail) {
      setSurveyName(surveyDetail.name || "")
      setSurveyDescription(surveyDetail.description || "")
      
      // Convert survey entries to questions format for editing
      if (surveyDetail.surveyEntries && surveyDetail.surveyEntries.length > 0) {
        const loadedQuestions = surveyDetail.surveyEntries.map((entry: SurveyEntry) => ({
          question: entry.question,
          choices: entry.choices
        }))
        setQuestions(loadedQuestions)
      } else {
        // Default question if no entries
        setQuestions([{ question: "", choices: ["", ""] }])
      }
    }
  }, [surveyDetail])

  // Load survey data when survey detail is available
  useEffect(() => {
    if (currentSurveyId && (isEditing || isViewing)) {
      loadSurveyData()
    }
  }, [currentSurveyId, isEditing, isViewing, loadSurveyData])

  const handleDeleteSurvey = useCallback((surveyId: string) => {
    if (!surveyId) return
    
    const survey = surveys.find(s => s.id === surveyId)
    if (survey) {
      setDeleteDialog({ isOpen: true, survey })
    }
  }, [surveys])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteDialog.survey) return

    deleteSurvey(deleteDialog.survey.id, {
      onSuccess: () => {
        setDeleteDialog({ isOpen: false, survey: null })
        refetchSurveys()
      }
    })
  }, [deleteDialog.survey, deleteSurvey, refetchSurveys])

  const handleEditSubmit = useCallback(() => {
    // Validate form before submission
    if (!validateSurveyDetails()) {
      return
    }

    if (!currentSurveyId) {
      toast.error("Survey ID is missing")
      return
    }

    // Update only survey name and description using the PUT endpoint
    const surveyUpdateData = {
      name: surveyName,
      description: surveyDescription
    };
    
    updateSurvey({ surveyId: currentSurveyId, data: surveyUpdateData }, {
      onSuccess: () => {
        setIsEditing(null)
        resetForm()
        refetchSurveys()
        refetchSurveyDetails()
      }
    });
  }, [currentSurveyId, updateSurvey, validateSurveyDetails, surveyName, surveyDescription, resetForm, refetchSurveys, refetchSurveyDetails])

  if (isLoadingSurveys) {
    return <Loading />
  }

  if (surveysError) {
    return (
      <div className="px-[7%] py-8">
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Surveys</h3>
          <p className="text-gray-600">
            There was a problem loading the surveys. Please try again later.
          </p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => refetchSurveys()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Show loading when fetching survey details for edit/view
  if ((isEditing || isViewing) && isLoadingSurveyDetails) {
    return <Loading />
  }

  // If we're in creation mode, show the create form
  if (isCreating) {
    return (
      <div className="px-[7%] py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Create New Survey</h2>
            <p className="text-gray-600 mt-1">
              Create multiple-choice survey questions for trainees to provide feedback
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Survey Details</h3>
              </div>
              <div className="space-y-6">
                {/* Survey Name & Description */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="surveyName">Survey Name</Label>
                    <Input
                      id="surveyName"
                      value={surveyName}
                      onChange={(e) => setSurveyName(e.target.value)}
                      placeholder="Enter survey name"
                      className="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="surveyDescription">Description</Label>
                    <Textarea
                      id="surveyDescription"
                      value={surveyDescription}
                      onChange={(e) => setSurveyDescription(e.target.value)}
                      placeholder="Enter survey description"
                      className="w-full mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Questions Section */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium mb-4">Survey Questions</h4>
                  
                  {questions.map((q, questionIndex) => (
                    <div key={questionIndex} className="space-y-4 mb-8">
                      <div className="mb-4">
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium mb-1">
                            Question {questionIndex + 1}
                          </label>
                          {questionIndex > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(questionIndex)}
                              className="p-1 h-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={q.question}
                          onChange={(e) => updateQuestionText(questionIndex, e.target.value)}
                          placeholder="Enter your question"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Answer Choices</label>
                        <div className="space-y-3">
                          {q.choices.map((choice: string, choiceIndex: number) => (
                            <div key={choiceIndex} className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                                {String.fromCharCode(65 + choiceIndex)}
                              </div>
                              <Input
                                value={choice}
                                onChange={(e) => updateChoice(questionIndex, choiceIndex, e.target.value)}
                                placeholder={`Choice ${choiceIndex + 1}`}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeChoice(questionIndex, choiceIndex)}
                                disabled={q.choices.length <= 2}
                                className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {q.choices.length < 6 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addChoice(questionIndex)}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Choice
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Button to add questions */}
                  <Button 
                    onClick={addQuestion} 
                    variant="outline" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Question
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateSubmit} 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isCreatingSurvey}
                  >
                    {isCreatingSurvey ? "Creating..." : "Save Survey"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div>
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Preview</h3>
              </div>
              <div className="space-y-6">
                {/* Survey Details Preview */}
                {(surveyName || surveyDescription) && (
                  <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                    <h4 className="font-medium mb-2">{surveyName || "Survey Name"}</h4>
                    <p className="text-sm text-gray-600">{surveyDescription || "Survey description will appear here"}</p>
                  </div>
                )}
                
                {/* Questions Preview */}
                {questions.map((q, questionIndex) => (
                  <Card key={questionIndex} className="bg-gray-50 border p-6">
                    <h3 className="text-lg font-medium mb-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full mr-2 text-sm">
                        {questionIndex + 1}
                      </span>
                      {q.question || "Your question will appear here"}
                    </h3>
                    <div className="space-y-3 pl-9">
                      {q.choices.map((choice: string, choiceIdx: number) => (
                        <div key={choiceIdx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                            {String.fromCharCode(65 + choiceIdx)}
                          </div>
                          <span>{choice || `Choice ${choiceIdx + 1} will appear here`}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Add questions to see them previewed here
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If we're in viewing mode, show the survey in read-only mode
  if (isViewing && currentSurveyId) {
    return (
      <div className="px-[7%] py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">View Survey</h2>
            <p className="text-gray-600 mt-1">
              {surveyDetail?.name || "Loading..."}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleEditSurvey(currentSurveyId)}
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Survey
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Back to Survey List
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Survey Details */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Survey Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Survey Name</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  {surveyDetail?.name || "Loading..."}
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border min-h-[60px]">
                  {surveyDetail?.description || "Loading..."}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Survey Questions */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Survey Questions</h3>
              <p className="text-gray-600 text-sm mt-1">
                You can edit individual questions by clicking the edit button on each question.
              </p>
            </div>
            
            {surveyDetail?.surveyEntries ? (
              <SurveyQuestionManager
                surveyEntries={surveyDetail.surveyEntries}
                surveyId={currentSurveyId}
                onRefresh={refetchSurveyDetails}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Loading survey questions...</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // If we're in edit mode, show the edit form
  if (isEditing) {
    return (
      <div className="px-[7%] py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Edit Survey</h2>
            <p className="text-gray-600 mt-1">
              Update your survey questions and details
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Survey Details</h3>
              </div>
              <div className="space-y-6">
                {/* Survey Name & Description */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="surveyName">Survey Name</Label>
                    <Input
                      id="surveyName"
                      value={surveyName}
                      onChange={(e) => setSurveyName(e.target.value)}
                      placeholder="Enter survey name"
                      className="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="surveyDescription">Description</Label>
                    <Textarea
                      id="surveyDescription"
                      value={surveyDescription}
                      onChange={(e) => setSurveyDescription(e.target.value)}
                      placeholder="Enter survey description"
                      className="w-full mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Questions Section */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium mb-4">Survey Questions</h4>
                  
                  {questions.map((q, questionIndex) => (
                    <div key={questionIndex} className="space-y-4 mb-8">
                      <div className="mb-4">
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium mb-1">
                            Question {questionIndex + 1}
                          </label>
                          {questionIndex > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(questionIndex)}
                              className="p-1 h-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={q.question}
                          onChange={(e) => updateQuestionText(questionIndex, e.target.value)}
                          placeholder="Enter your question"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Answer Choices</label>
                        <div className="space-y-3">
                          {q.choices.map((choice: string, choiceIndex: number) => (
                            <div key={choiceIndex} className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                                {String.fromCharCode(65 + choiceIndex)}
                              </div>
                              <Input
                                value={choice}
                                onChange={(e) => updateChoice(questionIndex, choiceIndex, e.target.value)}
                                placeholder={`Choice ${choiceIndex + 1}`}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeChoice(questionIndex, choiceIndex)}
                                disabled={q.choices.length <= 2}
                                className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {q.choices.length < 6 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addChoice(questionIndex)}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Choice
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Button to add questions */}
                  <Button 
                    onClick={addQuestion} 
                    variant="outline" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Question
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEditSubmit} 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isUpdatingSurvey}
                  >
                    {isUpdatingSurvey ? "Updating..." : "Update Survey"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div>
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Preview</h3>
              </div>
              <div className="space-y-6">
                {/* Survey Details Preview */}
                {(surveyName || surveyDescription) && (
                  <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                    <h4 className="font-medium mb-2">{surveyName || "Survey Name"}</h4>
                    <p className="text-sm text-gray-600">{surveyDescription || "Survey description will appear here"}</p>
                  </div>
                )}
                
                {/* Questions Preview */}
                {questions.map((q, questionIndex) => (
                  <Card key={questionIndex} className="bg-gray-50 border p-6">
                    <h3 className="text-lg font-medium mb-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full mr-2 text-sm">
                        {questionIndex + 1}
                      </span>
                      {q.question || "Your question will appear here"}
                    </h3>
                    <div className="space-y-3 pl-9">
                      {q.choices.map((choice: string, choiceIdx: number) => (
                        <div key={choiceIdx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                            {String.fromCharCode(65 + choiceIdx)}
                          </div>
                          <span>{choice || `Choice ${choiceIdx + 1} will appear here`}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Add questions to see them previewed here
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main survey list view
  return (
    <div className="px-[7%] py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Training Surveys</h2>
          <p className="text-gray-600 mt-1">
            Create and manage surveys for gathering trainee feedback
          </p>
        </div>
        
        <Button
          onClick={handleStartCreate}
          className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Survey
        </Button>
      </div>

      {/* Survey List */}
      <div className="space-y-4">
        {hasExistingSurveys ? (
          surveys.map((survey: Survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              onDelete={() => handleDeleteSurvey(survey.id)}
              onView={() => handleViewSurvey(survey.id)}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Surveys Available</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first survey for this training.
            </p>
            <Button 
              onClick={handleStartCreate}
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
            >
              Create Your First Survey
            </Button>
          </Card>
        )}
      </div>

      <SurveyDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, survey: null })}
        onConfirm={handleDeleteConfirm}
        surveyName={deleteDialog.survey?.name || ""}
        isDeleting={isDeletingSurvey}
      />
    </div>
  )
}
