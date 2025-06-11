"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, PencilIcon, Check, X } from "lucide-react"
import { 
  useUpdateSurveyQuestion,
  useDeleteSurveyEntry,
  SurveyEntry
} from "@/lib/hooks/useSessionAssesment"
import { SurveyDeleteDialog } from "./SurveyDeleteDialog"

interface SurveyQuestionManagerProps {
  surveyEntries: SurveyEntry[]
  surveyId: string
  onRefresh: () => void
}

interface EditingState {
  entryId: string
  question: string
  choices: string[]
}

export function SurveyQuestionManager({ 
  surveyEntries, 
  surveyId, 
  onRefresh 
}: SurveyQuestionManagerProps) {
  const [editingEntry, setEditingEntry] = useState<EditingState | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; entry: SurveyEntry | null }>({
    isOpen: false,
    entry: null
  })

  const { updateQuestion, isLoading: isUpdating } = useUpdateSurveyQuestion()
  const { deleteSurveyEntry, isLoading: isDeleting } = useDeleteSurveyEntry()

  const handleEditStart = (entry: SurveyEntry) => {
    setEditingEntry({
      entryId: entry.id,
      question: entry.question,
      choices: [...entry.choices]
    })
  }

  const handleEditCancel = () => {
    setEditingEntry(null)
  }

  const handleEditSave = () => {
    if (!editingEntry) return

    if (!editingEntry.question.trim()) {
      return
    }

    if (editingEntry.choices.length < 2 || editingEntry.choices.some(c => !c.trim())) {
      return
    }

    updateQuestion({
      surveyEntryId: editingEntry.entryId,
      questionData: {
        question: editingEntry.question,
        choices: editingEntry.choices
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
    if (!deleteDialog.entry) return

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

  if (surveyEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No questions found for this survey.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {surveyEntries.map((entry, index) => (
        <Card key={entry.id} className="bg-gray-50 border p-6">
          {editingEntry?.entryId === entry.id ? (
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
                <div>
                  <label className="block text-sm font-medium mb-2">Question</label>
                  <Input
                    value={editingEntry.question}
                    onChange={(e) => updateEditingQuestion(e.target.value)}
                    placeholder="Enter your question"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Answer Choices</label>
                  <div className="space-y-3">
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
              </div>
            </div>
          ) : (
            // Display mode
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full mr-2 text-sm">
                    {index + 1}
                  </span>
                  {entry.question}
                </h3>
                <div className="space-y-3 pl-9">
                  {entry.choices.map((choice, choiceIdx) => (
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