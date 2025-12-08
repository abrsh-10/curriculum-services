"use client"

import { Badge } from "@/components/ui/badge"
import { EvaluationEntryForm } from "@/lib/hooks/evaluation-types"

interface ReadOnlyEvaluationQuestionViewProps {
  question: EvaluationEntryForm
}

export function ReadOnlyEvaluationQuestionView({ question }: ReadOnlyEvaluationQuestionViewProps) {
  const getQuestionTypeIcon = () => {
    switch (question.questionType) {
      case "TEXT": return "📝"
      case "RADIO": return "🔘"
      case "CHECKBOX": return "☑️"
      default: return "❓"
    }
  }

  const getQuestionTypeName = () => {
    switch (question.questionType) {
      case "TEXT": return "Text Response"
      case "RADIO": return "Single Choice"
      case "CHECKBOX": return "Multiple Choice"
      default: return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words overflow-hidden line-clamp-3 md:line-clamp-5">
            {question.question || "Untitled Question"}
          </h3>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] md:text-xs whitespace-nowrap">
              {getQuestionTypeIcon()} {getQuestionTypeName()}
            </Badge>
            {question.isFollowUp && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-[10px] md:text-xs whitespace-nowrap">
                📎 Follow-up
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Question Image */}
      {(question.questionImageFile || question.questionImage) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Image
          </label>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={question.questionImageFile ? URL.createObjectURL(question.questionImageFile) : question.questionImage} 
            alt="Question" 
            className="max-w-full h-auto rounded border max-h-64" 
          />
        </div>
      )}

      {/* Follow-up Information */}
      {question.isFollowUp && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-800 mb-2">Follow-up Question Settings</h4>
          <div className="text-sm text-orange-700 space-y-1">
            <div>
              <span className="font-medium">Parent Question ID:</span> {question.parentQuestionClientId || "Not set"}
            </div>
            {question.triggerChoiceClientIds && question.triggerChoiceClientIds.length > 0 && (
              <div>
                <span className="font-medium">Trigger Choices:</span> {question.triggerChoiceClientIds.length} selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Answer Choices */}
      {(question.questionType === "RADIO" || question.questionType === "CHECKBOX") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Answer Choices ({question.choices.length})
          </label>
          <div className="space-y-3">
            {question.choices.map((choice, index) => (
              <div key={choice.clientId} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="flex-shrink-0 w-6 text-center text-gray-500 font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 overflow-hidden text-ellipsis truncate" title={choice.choiceText}>
                    {choice.choiceText || <span className="text-gray-400 italic">Empty choice</span>}
                  </div>
                  {(choice.choiceImageFile || choice.choiceImage) && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={choice.choiceImageFile ? URL.createObjectURL(choice.choiceImageFile) : choice.choiceImage} 
                        alt={`Choice ${index + 1}`} 
                        className="h-14 w-14 md:h-16 md:w-16 object-cover rounded border" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Response Note */}
      {question.questionType === "TEXT" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700">
            <span className="font-medium">Response Type:</span> Respondents will provide a text answer to this question.
          </div>
        </div>
      )}
    </div>
  )
}
