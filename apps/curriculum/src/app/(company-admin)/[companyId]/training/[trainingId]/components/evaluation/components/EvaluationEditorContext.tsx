"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

export type EvaluationEditorMode = 'evaluation' | 'question'
export type QuestionState = 'viewing' | 'editing' | 'creating'

interface EvaluationEditorState {
  // Navigation
  selectedSection: number
  selectedQuestion: number
  editorMode: EvaluationEditorMode
  questionState: QuestionState
  
  // Actions
  setSelectedSection: (index: number) => void
  setSelectedQuestion: (index: number) => void
  setEditorMode: (mode: EvaluationEditorMode) => void
  
  // Question state management
  startEditingQuestion: () => void
  startCreatingQuestion: () => void
  stopEditingQuestion: () => void
  
  // Navigation helpers
  navigateToNewQuestion: (sectionIndex: number, questionIndex: number) => void
  navigateToNewSection: (sectionIndex: number) => void
}

const EvaluationEditorContext = createContext<EvaluationEditorState | null>(null)

export function EvaluationEditorProvider({ children }: { children: React.ReactNode }) {
  const [selectedSection, setSelectedSection] = useState(0)
  const [selectedQuestion, setSelectedQuestion] = useState(0)
  const [editorMode, setEditorMode] = useState<EvaluationEditorMode>('evaluation')
  const [questionState, setQuestionState] = useState<QuestionState>('viewing')

  const startEditingQuestion = useCallback(() => {
    setQuestionState('editing')
    setEditorMode('question')
  }, [])

  const startCreatingQuestion = useCallback(() => {
    setQuestionState('creating')
    setEditorMode('question')
  }, [])

  const stopEditingQuestion = useCallback(() => {
    setQuestionState('viewing')
  }, [])

  const navigateToNewQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    setSelectedSection(sectionIndex)
    setSelectedQuestion(questionIndex)
    setEditorMode('question')
    setQuestionState('creating')
  }, [])

  const navigateToNewSection = useCallback((sectionIndex: number) => {
    setSelectedSection(sectionIndex)
    setSelectedQuestion(0)
    setEditorMode('question')
    setQuestionState('creating')
  }, [])

  const value: EvaluationEditorState = {
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
  }

  return (
    <EvaluationEditorContext.Provider value={value}>
      {children}
    </EvaluationEditorContext.Provider>
  )
}

export function useEvaluationEditor() {
  const context = useContext(EvaluationEditorContext)
  if (!context) {
    throw new Error('useEvaluationEditor must be used within an EvaluationEditorProvider')
  }
  return context
}

