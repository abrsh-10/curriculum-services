"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, PencilIcon, Check, X, FileText, CheckCircle, Square, Grid3X3 } from "lucide-react"
import { 
  useUpdateSurveyEntry,
  useDeleteSurveyEntry,
  SurveyEntry,
  QuestionType,
  getDefaultQuestionFields,
  validateSurveyEntry
} from "@/lib/hooks/useSurvey"
import { SurveyDeleteDialog } from "./SurveyDeleteDialog"
import { Label } from "@/components/ui/label"

interface SurveyQuestionManagerProps {
  questions: SurveyEntry[]
  surveyId: string
  onRefresh: () => void
}

interface EditingState {
  entryId: string
  question: string
  questionType: QuestionType
  choices: string[]
  allowOtherAnswer: boolean
  rows: string[]
  required: boolean
  // Additional fields for PATCH support
  questionNumber?: number
  questionImage?: string
  questionImageFile?: File
  parentQuestionNumber?: number
  parentChoice?: string
  followUp?: boolean
}

export function SurveyQuestionManager({ 
  questions, 
  surveyId, 
  onRefresh 
}: SurveyQuestionManagerProps) {
  const [editingEntry, setEditingEntry] = useState<EditingState | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; entry: SurveyEntry | null }>({
    isOpen: false,
    entry: null
  })

  const { updateSurveyEntry, isLoading: isUpdating } = useUpdateSurveyEntry()
  const { deleteSurveyEntry, isLoading: isDeleting } = useDeleteSurveyEntry()

  const handleEditStart = (entry: SurveyEntry) => {
    setEditingEntry({
      entryId: entry.id || '',
      question: entry.question,
      questionType: entry.questionType,
      choices: [...(entry.choices as string[])],
      allowOtherAnswer: entry.allowOtherAnswer,
      rows: [...entry.rows],
      required: entry.required,
      // Initialize additional fields from SurveyEntry
      questionNumber: entry.questionNumber,
      questionImage: entry.questionImageUrl || undefined,
      questionImageFile: undefined,
      parentQuestionNumber: entry.parentQuestionNumber || undefined,
      parentChoice: entry.parentChoice || undefined,
      followUp: entry.followUp || false
    })
  }

  const handleEditCancel = () => {
    setEditingEntry(null)
  }

  const handleEditSave = () => {
    if (!editingEntry) return

    // Use the validation utility - convert EditingState to SurveyEntry format
    const entryForValidation: SurveyEntry = {
      ...editingEntry,
      allowMultipleAnswers: editingEntry.questionType === 'CHECKBOX', // CHECKBOX allows multiple answers
      id: editingEntry.entryId
    }
    const validation = validateSurveyEntry(entryForValidation)
    if (!validation.isValid) {
      // Show first error (validation utility already provides good error messages)
      return
    }

    updateSurveyEntry({
      surveyEntryId: editingEntry.entryId,
      questionData: {
        question: editingEntry.question,
        questionType: editingEntry.questionType,
        choices: editingEntry.choices.map(choice => ({ choice, choiceImage: undefined })),
        allowOtherAnswer: editingEntry.allowOtherAnswer,
        rows: editingEntry.rows,
        isRequired: editingEntry.required,
        // Add missing fields
        questionNumber: editingEntry.questionNumber,
        questionImage: editingEntry.questionImage || undefined,
        questionImageFile: editingEntry.questionImageFile || undefined,
        parentQuestionNumber: editingEntry.parentQuestionNumber || undefined,
        parentChoice: editingEntry.parentChoice || undefined,
        isFollowUp: editingEntry.followUp || false
      }
    }, {
      onSuccess: () => {
        setEditingEntry(null)
        onRefresh()
      }
    })
  }

  const handleDeleteClick = (entry: SurveyEntry) => {
    setDeleteDialog({ isOpen: true, entry })
  }

  const handleDeleteConfirm = () => {
    if (!deleteDialog.entry?.id) return

    deleteSurveyEntry(deleteDialog.entry.id, {
      onSuccess: () => {
        setDeleteDialog({ isOpen: false, entry: null })
        onRefresh()
      }
    })
  }

  const updateEditingQuestion = (question: string) => {
    if (!editingEntry) return
    setEditingEntry({ ...editingEntry, question })
  }

  const updateEditingChoice = (index: number, value: string) => {
    if (!editingEntry) return
    const newChoices = [...editingEntry.choices]
    newChoices[index] = value
    setEditingEntry({ ...editingEntry, choices: newChoices })
  }

  const addEditingChoice = () => {
    if (!editingEntry || editingEntry.choices.length >= 6) return
    setEditingEntry({ 
      ...editingEntry, 
      choices: [...editingEntry.choices, ""] 
    })
  }

  const removeEditingChoice = (index: number) => {
    if (!editingEntry || editingEntry.choices.length <= 2) return
    const newChoices = editingEntry.choices.filter((_, i) => i !== index)
    setEditingEntry({ ...editingEntry, choices: newChoices })
  }

  // New helper functions for additional fields
  const updateEditingQuestionType = (questionType: QuestionType) => {
    if (!editingEntry) return
    const defaults = getDefaultQuestionFields(questionType)
    // Convert CreateSurveyChoice[] to string[] for SurveyEntry
    const normalizedChoices = Array.isArray(defaults.choices) 
      ? defaults.choices.map((c: any) => typeof c === 'string' ? c : c.choice || '') 
      : []
    
    setEditingEntry({ 
      ...editingEntry, 
      questionType,
      choices: normalizedChoices,
      allowOtherAnswer: defaults.allowTextAnswer ?? false,
      rows: defaults.rows ?? []
    })
  }

  const updateEditingRow = (index: number, value: string) => {
    if (!editingEntry) return
    const newRows = [...editingEntry.rows]
    newRows[index] = value
    setEditingEntry({ ...editingEntry, rows: newRows })
  }

  const addEditingRow = () => {
    if (!editingEntry || editingEntry.rows.length >= 8) return
    setEditingEntry({ 
      ...editingEntry, 
      rows: [...editingEntry.rows, ""] 
    })
  }

  const removeEditingRow = (index: number) => {
    if (!editingEntry || editingEntry.rows.length <= 2) return
    const newRows = editingEntry.rows.filter((_, i) => i !== index)
    setEditingEntry({ ...editingEntry, rows: newRows })
  }

  const updateEditingRequired = (required: boolean) => {
    if (!editingEntry) return
    setEditingEntry({ ...editingEntry, required })
  }

  // Question Type Components (reused from CreateSurveyForm)
  const QuestionTypeSelector = ({ 
    questionType, 
    onChange 
  }: { 
    questionType: QuestionType; 
    onChange: (type: QuestionType) => void 
  }) => {
    const getIconSrc = (type: QuestionType) => {
      switch (type) {
        case 'TEXT': return '/question-type-text.svg'
        case 'RADIO': return '/question-type-radio.svg'
        case 'CHECKBOX': return '/question-type-checkbox.svg'
        case 'GRID': return '/question-type-grid.svg'
        default: return '/question-type-text.svg'
      }
    }

    return (
      <div className="space-y-2">
        <Label>Question Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { type: 'TEXT' as const, label: 'Text Answer', desc: 'Free text input' },
            { type: 'RADIO' as const, label: 'Single Choice', desc: 'Select one option' },
            { type: 'CHECKBOX' as const, label: 'Multiple Choice', desc: 'Select multiple' },
            { type: 'GRID' as const, label: 'Grid/Matrix', desc: 'Rate multiple items' }
          ]).map(({ type, label, desc }) => (
            <Button
              key={type}
              variant={questionType === type ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(type)}
              className={`h-auto p-4 flex flex-col items-start transition-all duration-200 ${
                questionType === type 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg border-0" 
                  : "border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
              }`}
              type="button"
            >
              <div className="flex items-center gap-2 mb-1">
                <img 
                  src={getIconSrc(type)} 
                  alt={`${type} icon`}
                  className={`w-5 h-5 ${
                    questionType === type ? "text-white" : "text-gray-600"
                  }`}
                />
                <span className={`font-semibold text-sm ${
                  questionType === type ? "text-white" : ""
                }`}>{label}</span>
              </div>
              <span className={`text-xs leading-tight ${
                questionType === type ? "text-blue-100" : "text-gray-500"
              }`}>{desc}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // Question Type Icon
  const QuestionTypeIcon = ({ type }: { type: QuestionType }) => {
    const getIconSrc = (type: QuestionType) => {
      switch (type) {
        case 'TEXT': return '/question-type-text.svg'
        case 'RADIO': return '/question-type-radio.svg'
        case 'CHECKBOX': return '/question-type-checkbox.svg'
        case 'GRID': return '/question-type-grid.svg'
        default: return '/question-type-text.svg'
      }
    }

    return (
      <img 
        src={getIconSrc(type)} 
        alt={`${type} icon`}
        className="w-4 h-4"
      />
    )
  }

  const QuestionTypeBadge = ({ type }: { type: QuestionType }) => {
    const colors = {
      TEXT: "bg-green-100 text-green-700",
      RADIO: "bg-blue-100 text-blue-700", 
      CHECKBOX: "bg-purple-100 text-purple-700",
      GRID: "bg-orange-100 text-orange-700"
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
        <QuestionTypeIcon type={type} />
        {type}
      </span>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No questions found for this survey.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((entry, index) => (
        <Card key={entry.id || index} className="bg-gray-50 border p-6">
          {editingEntry?.entryId === entry.id && editingEntry ? (
            // Editing mode
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full mr-2 text-sm">
                    {index + 1}
                  </span>
                  Edit Question
                </h3>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditSave}
                    disabled={isUpdating}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditCancel}
                    disabled={isUpdating}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pl-9 space-y-4">
                {/* Question Type Selector */}
                <QuestionTypeSelector
                  questionType={editingEntry.questionType}
                  onChange={updateEditingQuestionType}
                />

                {/* Question Text */}
                <div>
                  <Label>Question</Label>
                  <Textarea
                    value={editingEntry.question}
                    onChange={(e) => updateEditingQuestion(e.target.value)}
                    placeholder="Enter your question"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Required Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-required-${editingEntry.entryId}`}
                    checked={editingEntry.required}
                    onChange={(e) => updateEditingRequired(e.target.checked)}
                    className="rounded"
                    aria-label="Mark as required question"
                  />
                  <Label htmlFor={`edit-required-${editingEntry.entryId}`}>
                    Required question
                  </Label>
                </div>

                {/* Question Type Specific Fields */}
                {(editingEntry.questionType === 'RADIO' || editingEntry.questionType === 'CHECKBOX') && (
                  <div>
                    <Label>Answer Choices</Label>
                    <div className="space-y-3 mt-2">
                      {editingEntry.choices.map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                            {String.fromCharCode(65 + choiceIndex)}
                          </div>
                          <Input
                            value={choice}
                            onChange={(e) => updateEditingChoice(choiceIndex, e.target.value)}
                            placeholder={`Choice ${choiceIndex + 1}`}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEditingChoice(choiceIndex)}
                            disabled={editingEntry.choices.length <= 2}
                            className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {editingEntry.choices.length < 6 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addEditingChoice}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Choice
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {editingEntry.questionType === 'GRID' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Column Headers (Rating Scale)</Label>
                      <div className="space-y-3 mt-2">
                        {editingEntry.choices.map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                              {String.fromCharCode(65 + choiceIndex)}
                            </div>
                            <Input
                              value={choice}
                              onChange={(e) => updateEditingChoice(choiceIndex, e.target.value)}
                              placeholder={`Column ${choiceIndex + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEditingChoice(choiceIndex)}
                              disabled={editingEntry.choices.length <= 2}
                              className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {editingEntry.choices.length < 6 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addEditingChoice}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Column
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Row Options (Items to Rate)</Label>
                      <div className="space-y-3 mt-2">
                        {editingEntry.rows.map((row, rowIndex) => (
                          <div key={rowIndex} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                              {rowIndex + 1}
                            </div>
                            <Input
                              value={row}
                              onChange={(e) => updateEditingRow(rowIndex, e.target.value)}
                              placeholder={`Row option ${rowIndex + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEditingRow(rowIndex)}
                              disabled={editingEntry.rows.length <= 2}
                              className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {editingEntry.rows.length < 8 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addEditingRow}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Row
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Display mode - Enhanced for all question types
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full text-sm font-medium shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <QuestionTypeBadge type={entry.questionType} />
                      {entry.required && (
                        <span className="text-red-500 text-sm font-medium">Required</span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                      {entry.question}
                    </h3>
                  </div>
                </div>

                {/* Question Type Specific Display */}
                <div className="pl-10">
                  {entry.questionType === 'TEXT' && (
                    <div className="mt-3">
                      <Textarea
                        placeholder="Trainee will type their answer here..."
                        disabled
                        className="bg-gray-50 border-gray-200 text-gray-500"
                        rows={3}
                      />
                    </div>
                  )}

                  {(entry.questionType === 'RADIO' || entry.questionType === 'CHECKBOX') && (
                    <div className="mt-3 space-y-2">
                      {entry.choices.map((choice, choiceIdx) => (
                        <div key={choiceIdx} className="flex items-center gap-2">
                          <div className={`w-4 h-4 border-2 border-gray-300 ${
                            entry.questionType === 'RADIO' ? 'rounded-full' : 'rounded'
                          }`}></div>
                          <span className="text-gray-700">{typeof choice === 'string' ? choice : choice.choiceText}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.questionType === 'GRID' && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full border border-gray-200 bg-white">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-900"></th>
                            {entry.choices.map((choice, index) => (
                              <th key={index} className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-900">
                                {typeof choice === 'string' ? choice : choice.choiceText}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {entry.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="border border-gray-200 p-3 text-sm font-medium text-gray-900">
                                {row}
                              </td>
                              {entry.choices.map((_, colIndex) => (
                                <td key={colIndex} className="border border-gray-200 p-3 text-center">
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto"></div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEditStart(entry)}
                  className="h-8 w-8 p-0"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDeleteClick(entry)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}

      <SurveyDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, entry: null })}
        onConfirm={handleDeleteConfirm}
        surveyName={deleteDialog.entry ? `Question: ${deleteDialog.entry.question}` : ""}
        isDeleting={isDeleting}
      />
    </div>
  )
} 