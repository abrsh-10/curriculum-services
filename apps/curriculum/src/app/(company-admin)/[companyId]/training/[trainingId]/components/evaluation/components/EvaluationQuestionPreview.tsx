"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { EvaluationEntryForm } from "@/lib/hooks/evaluation-types"

interface EvaluationQuestionPreviewProps {
  question: EvaluationEntryForm
}

export function EvaluationQuestionPreview({ question }: EvaluationQuestionPreviewProps) {
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
    <Card className="p-4 md:p-6 bg-white sticky top-8">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Preview</h3>
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
        <p className="text-sm text-gray-600">
          See how your question will appear to respondents
        </p>
      </div>

      <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
        {/* Question Header */}
        <div className="mb-4">
          {question.isFollowUp && (
            <div className="mb-2">
              <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                ↳ Follow-up question
              </Badge>
            </div>
          )}
          
          <div className="space-y-3">
            {/* Question Text */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 break-words overflow-hidden line-clamp-3 md:line-clamp-5">
                {question.question || <span className="text-gray-400 italic">Question text will appear here...</span>}
              </h4>
              
              {/* Question Image */}
              {(question.questionImageFile || question.questionImage) && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={question.questionImageFile ? URL.createObjectURL(question.questionImageFile) : question.questionImage} 
                    alt="Question" 
                    className="max-w-full h-auto rounded border max-h-40 md:max-h-48" 
                  />
                </div>
              )}
            </div>

            {/* Answer Input based on question type */}
            <div className="mt-4">
              {question.questionType === "TEXT" && (
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Your response:</Label>
                  <Textarea 
                    placeholder="Respondent will type their answer here..."
                    className="w-full"
                    rows={3}
                    disabled
                  />
                </div>
              )}

              {question.questionType === "RADIO" && (
                <div>
                  <Label className="text-sm text-gray-600 mb-3 block">Select one option:</Label>
                  <RadioGroup className="space-y-2.5 md:space-y-3" disabled>
                    {question.choices.length > 0 ? (
                      question.choices.map((choice, index) => (
                        <div key={choice.clientId} className="flex items-center space-x-3 min-w-0">
                          <RadioGroupItem value={choice.clientId} id={choice.clientId} />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={choice.clientId} 
                              className="text-sm font-normal cursor-pointer flex items-center gap-2 md:gap-3 min-w-0"
                            >
                              <span className="flex-1 overflow-hidden text-ellipsis truncate min-w-0" title={choice.choiceText}>
                                {choice.choiceText || <span className="text-gray-400 italic">Choice {index + 1} text...</span>}
                                {choice.hasFollowUp && (
                                  <span className="ml-2 text-[10px] md:text-xs bg-blue-100 text-blue-800 px-1 rounded whitespace-nowrap">
                                    + Follow-up
                                  </span>
                                )}
                              </span>
                              {(choice.choiceImageFile || choice.choiceImage) && (
                                <div className="flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={choice.choiceImageFile ? URL.createObjectURL(choice.choiceImageFile) : choice.choiceImage} 
                                    alt={`Choice ${index + 1}`} 
                                    className="h-7 w-7 md:h-8 md:w-8 object-cover rounded border" 
                                  />
                                </div>
                              )}
                            </Label>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 italic text-sm py-4">
                        Answer choices will appear here...
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}

              {question.questionType === "CHECKBOX" && (
                <div>
                  <Label className="text-sm text-gray-600 mb-3 block">Select all that apply:</Label>
                  <div className="space-y-2.5 md:space-y-3">
                    {question.choices.length > 0 ? (
                      question.choices.map((choice, index) => (
                        <div key={choice.clientId} className="flex items-center space-x-3 min-w-0">
                          <Checkbox id={`preview-${choice.clientId}`} disabled />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={`preview-${choice.clientId}`} 
                              className="text-sm font-normal cursor-pointer flex items-center gap-2 md:gap-3 min-w-0"
                            >
                              <span className="flex-1 overflow-hidden text-ellipsis truncate min-w-0" title={choice.choiceText}>
                                {choice.choiceText || <span className="text-gray-400 italic">Choice {index + 1} text...</span>}
                                {choice.hasFollowUp && (
                                  <span className="ml-2 text-[10px] md:text-xs bg-blue-100 text-blue-800 px-1 rounded whitespace-nowrap">
                                    + Follow-up
                                  </span>
                                )}
                              </span>
                              {(choice.choiceImageFile || choice.choiceImage) && (
                                <div className="flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={choice.choiceImageFile ? URL.createObjectURL(choice.choiceImageFile) : choice.choiceImage} 
                                    alt={`Choice ${index + 1}`} 
                                    className="h-7 w-7 md:h-8 md:w-8 object-cover rounded border" 
                                  />
                                </div>
                              )}
                            </Label>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 italic text-sm py-4">
                        Answer choices will appear here...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Follow-up Logic Info */}
        {question.isFollowUp && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="font-medium text-orange-700 mb-1">Follow-up Logic:</div>
              <div>
                This question will only show when specific choices are selected in the parent question.
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
