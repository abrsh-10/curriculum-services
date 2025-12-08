"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Save, X } from "lucide-react"
import { toast } from "sonner"
import { QuestionDeleteDialog } from "./QuestionDeleteDialog"
import { ChoiceDeleteDialog } from "./ChoiceDeleteDialog"
import { useAddAssessmentSection } from "@/lib/hooks/useAssessment"
import {
  useUpdateAssessmentEntry,
  useAddAssessmentEntry,
  useDeleteAssessmentEntry,
  useUpdateChoice,
  useAddChoice,
  useDeleteChoice,
  type UpdateAssessmentEntryPayload,
  type CreateAssessmentEntryPayload
} from "@/lib/hooks/useAssessmentEntry"

type QuestionType = "RADIO" | "CHECKBOX"

interface ChoiceForm {
  id?: string
  choice: string
  choiceImage: string
  choiceImageFile?: File
  isCorrect: boolean
}

interface AssessmentEntryForm {
  id?: string
  question: string
  questionImage: string
  questionImageFile?: File
  questionType: QuestionType
  choices: ChoiceForm[]
  weight: number
}

interface EditableAssessmentQuestionEditorProps {
  question: AssessmentEntryForm
  sectionId?: string
  isEditing: boolean
  onUpdateQuestion: (updates: Partial<AssessmentEntryForm>) => void
  onSaveQuestion?: () => void
  onCancelEdit?: () => void
  assessmentId?: string
  sectionTitle?: string
  sectionDescription?: string
  onSectionCreated?: (newSectionId: string) => void
  disableHeaderActions?: boolean
}

export function EditableAssessmentQuestionEditor({
  question,
  sectionId,
  isEditing,
  onUpdateQuestion,
  onSaveQuestion,
  onCancelEdit,
  assessmentId,
  sectionTitle,
  sectionDescription,
  onSectionCreated,
  disableHeaderActions = false
}: EditableAssessmentQuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState<AssessmentEntryForm>(question)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showQuestionDeleteDialog, setShowQuestionDeleteDialog] = useState(false)
  const [showChoiceDeleteDialog, setShowChoiceDeleteDialog] = useState(false)
  const [choiceToDelete, setChoiceToDelete] = useState<{ index: number; text: string } | null>(null)
  const [originalChoices, setOriginalChoices] = useState<ChoiceForm[]>(question.choices || [])
  const [originalQuestion, setOriginalQuestion] = useState<{ question: string; questionType: QuestionType; weight: number }>({
    question: question.question,
    questionType: question.questionType,
    weight: question.weight
  })

  // Update local state when switching to a different question reference
  useEffect(() => {
    setLocalQuestion(question)
    setOriginalChoices(question.choices || [])
    setOriginalQuestion({
      question: question.question,
      questionType: question.questionType,
      weight: question.weight
    })
    setHasUnsavedChanges(false)
  }, [question, question?.id])

  // Hooks for API operations
  const updateAssessmentEntry = useUpdateAssessmentEntry()
  const addAssessmentEntry = useAddAssessmentEntry()
  const deleteAssessmentEntry = useDeleteAssessmentEntry()
  const updateChoiceAPI = useUpdateChoice()
  const addChoiceAPI = useAddChoice()
  const deleteChoiceAPI = useDeleteChoice()
  const addAssessmentSection = useAddAssessmentSection()

  const updateLocalQuestion = (updates: Partial<AssessmentEntryForm>) => {
    setLocalQuestion(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
    onUpdateQuestion(updates)
  }

  const updateChoice = (choiceIndex: number, updates: Partial<ChoiceForm>) => {
    const updatedChoices = localQuestion.choices.map((choice, index) => 
      index === choiceIndex ? { ...choice, ...updates } : choice
    )
    updateLocalQuestion({ choices: updatedChoices })
  }

  const addNewChoice = () => {
    const newChoice: ChoiceForm = {
      choice: "",
      choiceImage: "",
      choiceImageFile: undefined,
      isCorrect: false
    }
    updateLocalQuestion({ 
      choices: [...localQuestion.choices, newChoice] 
    })
  }

  const removeChoice = (choiceIndex: number) => {
    const choiceToRemove = localQuestion.choices[choiceIndex]
    setChoiceToDelete({ 
      index: choiceIndex, 
      text: choiceToRemove.choice || `Choice ${choiceIndex + 1}` 
    })
    setShowChoiceDeleteDialog(true)
  }

  const confirmDeleteChoice = () => {
    if (!choiceToDelete) return

    const choiceToRemove = localQuestion.choices[choiceToDelete.index]
    
    if (choiceToRemove.id && isEditing) {
      // Delete from server if it's an existing choice
      deleteChoiceAPI.mutate(choiceToRemove.id, {
        onSuccess: () => {
          const updatedChoices = localQuestion.choices.filter((_, index) => index !== choiceToDelete.index)
          updateLocalQuestion({ choices: updatedChoices })
          setShowChoiceDeleteDialog(false)
          setChoiceToDelete(null)
        }
      })
    } else {
      // Remove locally if it's a new choice
      const updatedChoices = localQuestion.choices.filter((_, index) => index !== choiceToDelete.index)
      updateLocalQuestion({ choices: updatedChoices })
      setShowChoiceDeleteDialog(false)
      setChoiceToDelete(null)
    }
  }

  const handleSaveQuestion = async () => {
    if (!localQuestion.question.trim()) {
      toast.error("Question text is required")
      return
    }

    if (localQuestion.choices.length < 2) {
      toast.error("At least 2 choices are required")
      return
    }

    const correctChoices = localQuestion.choices.filter(c => c.isCorrect)
    if (localQuestion.questionType === "RADIO" && correctChoices.length !== 1) {
      toast.error("Exactly one correct answer is required for single choice questions")
      return
    }

    if (localQuestion.questionType === "CHECKBOX" && correctChoices.length < 1) {
      toast.error("At least one correct answer is required for multiple choice questions")
      return
    }

    try {
      if (localQuestion.id) {
        // Only PATCH the entry if question fields actually changed;
        // choices will be handled individually either way.
        const questionChanged =
          localQuestion.question !== originalQuestion.question ||
          localQuestion.questionType !== originalQuestion.questionType ||
          localQuestion.weight !== originalQuestion.weight ||
          !!localQuestion.questionImageFile

        if (questionChanged) {
          await updateExistingQuestion()
        } else {
          await updateChoicesIndividually()
        }
      } else if (sectionId) {
        // Create new question with all choices
        await createNewQuestion()
      }

      setHasUnsavedChanges(false)
      setOriginalChoices([...localQuestion.choices]) // Update original choices reference
      setOriginalQuestion({
        question: localQuestion.question,
        questionType: localQuestion.questionType,
        weight: localQuestion.weight
      })
      onSaveQuestion?.()
    } catch (error) {
      console.error("Failed to save question:", error)
    }
  }

  const updateExistingQuestion = async () => {
    // First, update the question itself (without choices to avoid duplicates)
    const questionPayload: UpdateAssessmentEntryPayload = {
      question: localQuestion.question,
      questionType: localQuestion.questionType,
      weight: localQuestion.weight,
      questionImageFile: localQuestion.questionImageFile,
      // Don't send choices at all to avoid duplicates
    }

    await updateAssessmentEntry.mutateAsync({
      entryId: localQuestion.id!,
      data: questionPayload
    })

    // Then handle choices individually
    await updateChoicesIndividually()
  }

  const createNewQuestion = async () => {
    // Build question payload
    const payload: CreateAssessmentEntryPayload = {
      question: localQuestion.question,
      questionType: localQuestion.questionType,
      weight: localQuestion.weight,
      questionImage: localQuestion.questionImage,
      questionImageFile: localQuestion.questionImageFile,
      choices: localQuestion.choices.map(choice => ({
        choice: choice.choice,
        choiceImage: choice.choiceImage,
        choiceImageFile: choice.choiceImageFile,
        isCorrect: choice.isCorrect
      }))
    }

    let targetSectionId = sectionId

    // If we don't have a section on the server yet, create one first
    if (!targetSectionId && assessmentId) {
      const res = await addAssessmentSection.mutateAsync({
        assessmentId,
        data: {
          title: sectionTitle || "Section",
          description: sectionDescription || "",
          assessmentEntries: [payload]
        }
      })
      const createdSectionId = res?.section?.id || res?.data?.section?.id || res?.data?.id || res?.id
      if (createdSectionId) {
        targetSectionId = createdSectionId
        onSectionCreated?.(createdSectionId)
      }
      // Since section was created with the first question, we're done
      setHasUnsavedChanges(false)
      return
    }
    
    if (!targetSectionId) {
      throw new Error("Missing section to add question to.")
    }

    // Section exists already → add this question to it
    const response = await addAssessmentEntry.mutateAsync({
      sectionId: targetSectionId,
      data: payload
    })

    if (response?.data?.id) {
      setLocalQuestion(prev => ({ ...prev, id: response.data.id }))
      onUpdateQuestion({ id: response.data.id })
    }
  }

  const updateChoicesIndividually = async () => {
    const currentChoices = localQuestion.choices

    const isSingleChoice = localQuestion.questionType === "RADIO"

    if (isSingleChoice) {
      // 1) For single choice, update the newly selected correct choice first
      const existingNewCorrect = currentChoices.find(c => {
        if (!c.id) return false
        const orig = originalChoices.find(oc => oc.id === c.id)
        return orig && !orig.isCorrect && c.isCorrect
      })

      if (existingNewCorrect && existingNewCorrect.id) {
        await updateChoiceAPI.mutateAsync({
          choiceId: existingNewCorrect.id,
          data: {
            choice: existingNewCorrect.choice,
            choiceImageFile: existingNewCorrect.choiceImageFile,
            isCorrect: true,
          },
        })
      }

      // 2) Process additions and other updates, but DO NOT send updates that flip a choice from true -> false
      for (const currentChoice of currentChoices) {
        if (!currentChoice.id) {
          // New choice - add it
          await addChoiceAPI.mutateAsync({
            entryId: localQuestion.id!,
            data: {
              choice: currentChoice.choice,
              choiceImage: currentChoice.choiceImage,
              choiceImageFile: currentChoice.choiceImageFile,
              isCorrect: currentChoice.isCorrect,
            },
          })
          continue
        }

        const originalChoice = originalChoices.find(oc => oc.id === currentChoice.id)
        if (!originalChoice) continue

        const changedTextOrImage =
          currentChoice.choice !== originalChoice.choice ||
          currentChoice.choiceImageFile !== originalChoice.choiceImageFile
        const changedCorrectness = currentChoice.isCorrect !== originalChoice.isCorrect
        const becameFalseFromTrue = originalChoice.isCorrect && !currentChoice.isCorrect

        // Skip sending a "set to false" update for single-choice to avoid transient no-correct state
        if (becameFalseFromTrue) continue

        if (changedTextOrImage || changedCorrectness) {
          await updateChoiceAPI.mutateAsync({
            choiceId: currentChoice.id,
            data: {
              choice: currentChoice.choice,
              choiceImageFile: currentChoice.choiceImageFile,
              isCorrect: currentChoice.isCorrect,
            },
          })
        }
      }
    } else {
      // Multiple choice (checkbox) – update per choice normally
      for (const currentChoice of currentChoices) {
        if (currentChoice.id) {
          const originalChoice = originalChoices.find(oc => oc.id === currentChoice.id)
          if (originalChoice) {
            const hasChanged =
              currentChoice.choice !== originalChoice.choice ||
              currentChoice.isCorrect !== originalChoice.isCorrect ||
              currentChoice.choiceImageFile !== originalChoice.choiceImageFile

            if (hasChanged) {
              await updateChoiceAPI.mutateAsync({
                choiceId: currentChoice.id,
                data: {
                  choice: currentChoice.choice,
                  choiceImageFile: currentChoice.choiceImageFile,
                  isCorrect: currentChoice.isCorrect,
                },
              })
            }
          }
        } else {
          await addChoiceAPI.mutateAsync({
            entryId: localQuestion.id!,
            data: {
              choice: currentChoice.choice,
              choiceImage: currentChoice.choiceImage,
              choiceImageFile: currentChoice.choiceImageFile,
              isCorrect: currentChoice.isCorrect,
            },
          })
        }
      }
    }

    // Handle deleted choices (choices that were in original but not in current)
    for (const originalChoice of originalChoices) {
      if (originalChoice.id && !currentChoices.find(c => c.id === originalChoice.id)) {
        await deleteChoiceAPI.mutateAsync(originalChoice.id)
      }
    }
  }

  const handleDeleteQuestion = () => {
    setShowQuestionDeleteDialog(true)
  }

  const confirmDeleteQuestion = () => {
    if (localQuestion.id) {
      deleteAssessmentEntry.mutate(localQuestion.id, {
        onSuccess: () => {
          setShowQuestionDeleteDialog(false)
          onCancelEdit?.()
        }
      })
    } else {
      setShowQuestionDeleteDialog(false)
      onCancelEdit?.()
    }
  }

  const isLoading = updateAssessmentEntry.isPending || 
                   addAssessmentEntry.isPending || 
                   deleteAssessmentEntry.isPending ||
                   updateChoiceAPI.isPending ||
                   addChoiceAPI.isPending ||
                   deleteChoiceAPI.isPending

  return (
    <div className="space-y-6">
      {/* Edit Mode Header */}
      {isEditing && !disableHeaderActions && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {localQuestion.id ? "Editing Question" : "New Question"}
            </Badge>
            {hasUnsavedChanges && (
              <Badge variant="pending" className="text-orange-600 border-orange-300">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!sectionId && assessmentId ? (
              <Button
                size="sm"
                onClick={async () => {
                  await createNewQuestion()
                  onSaveQuestion?.()
                }}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Section
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSaveQuestion}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
            {localQuestion.id && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteQuestion}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Question Text with Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question *
        </label>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Input
              value={localQuestion.question}
              onChange={(e) => updateLocalQuestion({ question: e.target.value })}
              placeholder="Enter your question"
              className="w-full"
              disabled={isLoading}
            />
          </div>
          <FileUpload
            accept="image/*"
            onChange={(file) => updateLocalQuestion({ questionImageFile: file || undefined })}
            variant="icon"
            size="md"
          />
        </div>
        
        {/* Question Image Preview */}
        {(localQuestion.questionImageFile || localQuestion.questionImage) && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={localQuestion.questionImageFile ? URL.createObjectURL(localQuestion.questionImageFile) : localQuestion.questionImage} 
              alt="question" 
              className="h-20 w-32 object-cover rounded border" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {localQuestion.questionImageFile?.name || "Existing image"}
              </p>
              <p className="text-xs text-gray-500">
                {localQuestion.questionImageFile 
                  ? `${(localQuestion.questionImageFile.size / 1024).toFixed(1)} KB`
                  : "Uploaded image"
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateLocalQuestion({ 
                questionImage: "", 
                questionImageFile: undefined 
              })}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Question Type and Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type *
          </label>
          <Select
            value={localQuestion.questionType}
            onValueChange={(value) => updateLocalQuestion({ 
              questionType: value as QuestionType,
              choices: localQuestion.choices.map(c => ({ ...c, isCorrect: false }))
            })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RADIO">Single Choice</SelectItem>
              <SelectItem value="CHECKBOX">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight *
          </label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={localQuestion.weight}
            onChange={(e) => updateLocalQuestion({ weight: parseFloat(e.target.value) || 1 })}
            className="w-full"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Answer Choices *
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNewChoice}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            Add Choice
          </Button>
        </div>

        {localQuestion.choices.map((choice, choiceIndex) => (
          <div key={choiceIndex} className="flex items-center gap-3 p-3 border rounded-lg">
            {/* Correct Answer Selector */}
            <div className="flex items-center">
              {localQuestion.questionType === "RADIO" ? (
                <input
                  type="radio"
                  name="correct-answer"
                  checked={choice.isCorrect}
                  onChange={() => {
                    // For radio buttons, only one can be correct
                    const updatedChoices = localQuestion.choices.map((c, i) => ({
                      ...c,
                      isCorrect: i === choiceIndex
                    }))
                    updateLocalQuestion({ choices: updatedChoices })
                  }}
                  disabled={isLoading}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
              ) : (
                <Checkbox
                  checked={choice.isCorrect}
                  onCheckedChange={(checked) => {
                    updateChoice(choiceIndex, { isCorrect: !!checked })
                  }}
                  disabled={isLoading}
                />
              )}
              <span className="ml-2 text-xs text-gray-500">Correct</span>
            </div>

            {/* Choice Text and Image */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={choice.choice}
                  onChange={(e) => updateChoice(choiceIndex, { choice: e.target.value })}
                  placeholder={`Choice ${choiceIndex + 1}`}
                  className="flex-1"
                  disabled={isLoading}
                />
                <FileUpload
                  accept="image/*"
                  onChange={(file) => updateChoice(choiceIndex, { choiceImageFile: file || undefined })}
                  variant="icon"
                  size="sm"
                />
              </div>
              
              {/* Choice Image Preview */}
              {(choice.choiceImageFile || choice.choiceImage) && (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={choice.choiceImageFile ? URL.createObjectURL(choice.choiceImageFile) : choice.choiceImage} 
                    alt={`choice ${choiceIndex + 1}`} 
                    className="h-12 w-16 object-cover rounded border" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {choice.choiceImageFile?.name || "Existing image"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateChoice(choiceIndex, { 
                      choiceImage: "", 
                      choiceImageFile: undefined 
                    })}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Remove Choice */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeChoice(choiceIndex)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={localQuestion.choices.length <= 2 || isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Validation Messages */}
      {localQuestion.choices.length < 2 && (
        <p className="text-sm text-red-600">At least 2 choices are required</p>
      )}
      
      {localQuestion.questionType === "RADIO" && 
       localQuestion.choices.filter(c => c.isCorrect).length !== 1 && (
        <p className="text-sm text-red-600">
          Exactly one correct answer is required for single choice questions
        </p>
      )}
      
      {localQuestion.questionType === "CHECKBOX" && 
       localQuestion.choices.filter(c => c.isCorrect).length < 1 && (
        <p className="text-sm text-red-600">
          At least one correct answer is required for multiple choice questions
        </p>
      )}

      {/* Delete Dialogs */}
      <QuestionDeleteDialog
        isOpen={showQuestionDeleteDialog}
        onClose={() => setShowQuestionDeleteDialog(false)}
        onConfirm={confirmDeleteQuestion}
        questionText={localQuestion.question}
        isDeleting={deleteAssessmentEntry.isPending}
      />

      <ChoiceDeleteDialog
        isOpen={showChoiceDeleteDialog}
        onClose={() => {
          setShowChoiceDeleteDialog(false)
          setChoiceToDelete(null)
        }}
        onConfirm={confirmDeleteChoice}
        choiceText={choiceToDelete?.text || ""}
        isDeleting={deleteChoiceAPI.isPending}
      />
    </div>
  )
}
