"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { EvaluationSummary } from "@/lib/hooks/evaluation-types"
import { useGetEvaluationDetail } from "@/lib/hooks/useEvaluation"
import { Loading } from "@/components/ui/loading"
import { cn } from "@/lib/utils"

interface EvaluationViewModalProps {
  evaluation: EvaluationSummary | null
  isOpen: boolean
  onClose: () => void
}

export function EvaluationViewModal({ evaluation, isOpen, onClose }: EvaluationViewModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  
  // Fetch full evaluation details
  const { data: evaluationDetail, isLoading } = useGetEvaluationDetail(evaluation?.id || "")
  
  if (!evaluation) return null
  
  // Process questions to group follow-ups under their parent choices
  const processedQuestions = evaluationDetail?.sections?.flatMap(section => {
    const allQuestions = section.questions || []
    
    // Separate main questions from follow-ups
    const mainQuestions = allQuestions.filter(q => !q.isFollowUp)
    const followUpQuestions = allQuestions.filter(q => q.isFollowUp)
    
    // For each main question, attach its follow-up questions to the relevant choices
    return mainQuestions.map(question => {
      const questionWithNestedFollowUps = {
        ...question,
        sectionTitle: section.title,
        sectionDescription: section.description,
        choices: question.choices?.map(choice => {
          // Find follow-up questions triggered by this choice
          const relevantFollowUps = followUpQuestions.filter(followUp => 
            followUp.parentQuestionId === question.id && 
            followUp.triggerChoiceIds?.includes(choice.id)
          )
          
          return {
            ...choice,
            followUpQuestions: relevantFollowUps
          }
        }) || []
      }
      
      return questionWithNestedFollowUps
    })
  }).flat() || []
  
  const currentQuestion = processedQuestions[currentQuestionIndex]
  const totalQuestions = processedQuestions.length
  
  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1))
  }
  
  const handleNext = () => {
    setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))
  }
  
  const handleClose = () => {
    setCurrentQuestionIndex(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <DialogTitle className="text-lg font-semibold">
              {evaluation.formType === "PRE" ? "Pre Training Evaluation" 
               : evaluation.formType === "MID" ? "Mid Training Evaluation" 
               : "Post Training Evaluation"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : !currentQuestion ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-gray-500">No questions found in this evaluation form.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 md:pr-4">
            {/* Section Header */}
            <div className="mb-6 p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-lg">
              <h2 className="text-lg font-semibold text-slate-800 mb-2 break-words overflow-hidden text-ellipsis line-clamp-2 md:line-clamp-3">
                {currentQuestion.sectionTitle as string}
              </h2>
              {currentQuestion.sectionDescription && (
                <p className="text-sm text-slate-600 break-words leading-relaxed overflow-hidden line-clamp-3 md:line-clamp-5">
                  {currentQuestion.sectionDescription}
                </p>
              )}
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 md:mb-6">
                <div className="flex-1 pr-2 md:pr-4 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-700">Q{currentQuestionIndex + 1}</span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 break-words leading-relaxed overflow-hidden line-clamp-3 md:line-clamp-5">
                      {currentQuestion.question}
                    </h3>
                  </div>
                </div>
                <div className="mt-2 md:mt-0 self-start md:self-auto">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 flex-shrink-0 text-[10px] md:text-xs whitespace-nowrap">
                    {currentQuestion.questionType === 'RADIO' ? 'Single Choice' : 
                     currentQuestion.questionType === 'CHECKBOX' ? 'Multiple Choice' : 
                     'Text Response'}
                  </Badge>
                </div>
              </div>

              {/* Question Image */}
              {currentQuestion.questionImageUrl && (
                <div className="mb-4 md:mb-6 pl-11">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={currentQuestion.questionImageUrl}
                    alt="Question image"
                    className="w-48 h-32 md:w-56 md:h-36 object-cover rounded-lg border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              {/* Choices */}
              {currentQuestion.choices && currentQuestion.choices.length > 0 && (
                <div className="pl-11 space-y-4 md:space-y-5">
                  {currentQuestion.choices.map((choice: any, index: number) => (
                    <div key={choice.id} className="space-y-0">
                      {/* Main Choice */}
                      <div className="flex items-start gap-3 md:gap-4 p-3 rounded-lg border border-gray-200 bg-white max-w-full min-w-0">
                        {/* Radio/Checkbox indicator */}
                        {currentQuestion.questionType === "RADIO" ? (
                          <div className="w-5 h-5 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center mt-0.5 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-blue-400 bg-white flex items-center justify-center mt-0.5 flex-shrink-0">
                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {/* Choice Image */}
                        {choice.choiceImageUrl && (
                          <div className="flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={choice.choiceImageUrl}
                              alt={`Choice ${index + 1} image`}
                              className="w-14 h-10 md:w-16 md:h-12 object-cover rounded border border-gray-200"
                            />
                          </div>
                        )}

                        {/* Choice Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm break-words text-gray-800 leading-relaxed overflow-hidden text-ellipsis truncate" title={choice.choiceText}>
                            {choice.choiceText || `Choice ${index + 1}`}
                          </p>
                          {(choice as any).followUpQuestions && (choice as any).followUpQuestions.length > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] md:text-xs">
                                <span className="mr-1">↳</span>
                                {(choice as any).followUpQuestions.length} Follow-up Question{(choice as any).followUpQuestions.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Follow-up Questions for this choice */}
                      {(choice as any).followUpQuestions && (choice as any).followUpQuestions.length > 0 && (
                        <div className="ml-4 md:ml-6 mt-3">
                          {(choice as any).followUpQuestions.map((followUp: any, followUpIndex: number) => (
                            <div key={followUp.id} className="relative">
                              {/* Connection Line */}
                              <div className="absolute -left-3 top-2 w-3 h-0.5 bg-gray-300"></div>
                              <div className="absolute -left-3 top-2 w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                              
                              <div className="border-l-2 border-amber-200 pl-3 md:pl-4 py-2">
                                <div className="space-y-3">
                                  {/* Follow-up Question Header */}
                                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                        ↳ Follow-up
                                      </span>
                                    </div>
                                    <div className="mt-2 md:mt-0 self-start md:self-auto">
                                      <Badge variant="secondary" className="text-[10px] md:text-xs bg-gray-100 text-gray-600 whitespace-nowrap">
                                        {followUp.questionType === 'RADIO' ? 'Single Choice' : 
                                         followUp.questionType === 'CHECKBOX' ? 'Multiple Choice' : 
                                         'Text Response'}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Follow-up Question Text */}
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 leading-relaxed break-words overflow-hidden line-clamp-2 md:line-clamp-3">
                                      {followUp.question}
                                    </p>

                                    {/* Follow-up Question Image */}
                                    {followUp.questionImageUrl && (
                                      <div className="mt-2 mb-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                          src={followUp.questionImageUrl}
                                          alt="Follow-up question image"
                                          className="w-28 h-18 md:w-32 md:h-20 object-cover rounded border border-gray-200"
                                        />
                                      </div>
                                    )}

                                    {/* Follow-up Choices */}
                                    {followUp.choices && followUp.choices.length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        {followUp.choices.map((followUpChoice: any, followUpChoiceIndex: number) => (
                                          <div key={followUpChoice.id} className="flex items-start gap-2 md:gap-3 p-2 bg-white border border-gray-200 rounded">
                                            {/* Follow-up choice indicator */}
                                            {followUp.questionType === "RADIO" ? (
                                              <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mt-0.5 flex-shrink-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                              </div>
                                            ) : (
                                              <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white flex items-center justify-center mt-0.5 flex-shrink-0">
                                                <svg className="w-2.5 h-2.5 text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                            )}

                                            {/* Follow-up choice image */}
                                            {followUpChoice.choiceImageUrl && (
                                              <div className="flex-shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                  src={followUpChoice.choiceImageUrl}
                                                  alt={`Follow-up choice ${followUpChoiceIndex + 1} image`}
                                                  className="w-9 h-7 md:w-10 md:h-8 object-cover rounded border border-gray-200"
                                                />
                                              </div>
                                            )}

                                            {/* Follow-up choice text */}
                                            <p className="text-sm text-gray-700 break-words flex-1 overflow-hidden text-ellipsis truncate min-w-0" title={followUpChoice.choiceText}>
                                              {followUpChoice.choiceText || `Choice ${followUpChoiceIndex + 1}`}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            {totalQuestions > 1 && (
              <div className="flex items-center justify-between pt-4 md:pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
