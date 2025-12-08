"use client"

import { useReducer, useMemo, useCallback, useEffect, useState } from "react"
import { Loading } from "@/components/ui/loading"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { useGetEvaluations, useCreateEvaluation, useDeleteEvaluationForm } from "@/lib/hooks/useEvaluation"
import { EvaluationSummary } from "@/lib/hooks/evaluation-types"
import { CreateEvaluationForm } from "./evaluation/components/CreateEvaluationForm"
import { EvaluationDataTable } from "./evaluation/components/evaluation-data-table"
import { evaluationColumns, createEvaluationActionsColumn } from "./evaluation/components/evaluation-columns"
import { EvaluationHeader } from "./evaluation/components/evaluation-header"
import { EvaluationViewModal } from "./evaluation/components/EvaluationViewModal"
import { DeleteConfirmDialog } from "./evaluation/components/DeleteConfirmDialog"
import { EvaluationAnswerModal } from "./evaluation/components/EvaluationAnswerModal"
import { DefaultCreate } from "./defaultCreate"
// Removed unused imports - using EvaluationHeader component now

interface EvaluationComponentProps {
  trainingId: string
}

// State management with useReducer (Mirroring Assessment)
type EvaluationState = {
  showCreateForm: boolean
  searchQuery: string
  currentPage: number
  pageSize: number
  editingForm: EvaluationSummary | null
  viewModal: { open: boolean; evaluation: EvaluationSummary | null }
}

type EvaluationAction =
  | { type: 'SHOW_CREATE_FORM' }
  | { type: 'HIDE_CREATE_FORM' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'START_EDIT'; payload: EvaluationSummary }
  | { type: 'OPEN_VIEW_MODAL'; payload: EvaluationSummary }
  | { type: 'CLOSE_VIEW_MODAL' }

const initialState: EvaluationState = {
  showCreateForm: false,
  searchQuery: "",
  currentPage: 1,
  pageSize: 10,
  editingForm: null,
  viewModal: { open: false, evaluation: null },
}

function evaluationReducer(state: EvaluationState, action: EvaluationAction): EvaluationState {
  switch (action.type) {
    case 'SHOW_CREATE_FORM':
      return { ...state, showCreateForm: true }
    case 'HIDE_CREATE_FORM':
      return { ...state, showCreateForm: false, editingForm: null }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload, currentPage: 1 } // Reset page on search
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, currentPage: 1 }
    case 'START_EDIT':
      return { ...state, editingForm: action.payload, showCreateForm: true }
    case 'OPEN_VIEW_MODAL':
      return { ...state, viewModal: { open: true, evaluation: action.payload } }
    case 'CLOSE_VIEW_MODAL':
      return { ...state, viewModal: { open: false, evaluation: null } }
    default:
      return state
  }
}

export function EvaluationComponent({ trainingId }: EvaluationComponentProps) {
  const [state, dispatch] = useReducer(evaluationReducer, initialState)
  const { isProjectManager, isTrainingAdmin, isCompanyAdmin, isCurriculumAdmin, isMeExpert } = useUserRole()
  
  // Fetch evaluations
  const { data, isLoading } = useGetEvaluations(trainingId)
  
  // Transform API data to Summary type - API returns correct structure now
  const evaluations: EvaluationSummary[] = useMemo(() => {
    if (!data?.monitoringForm) return []
    return data.monitoringForm
  }, [data])

  // Filtering
  const filteredEvaluations = useMemo(() => {
    if (!state.searchQuery.trim()) return evaluations
    const query = state.searchQuery.toLowerCase()
    return evaluations.filter(e => 
      e.formType.toLowerCase().includes(query) ||
      (e.formType === 'PRE' && 'pre-training'.includes(query)) ||
      (e.formType === 'MID' && 'mid-training'.includes(query)) ||
      (e.formType === 'POST' && 'post-training'.includes(query))
    )
  }, [evaluations, state.searchQuery])

  // Pagination
  const paginatedEvaluations = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize
    const endIndex = startIndex + state.pageSize
    return filteredEvaluations.slice(startIndex, endIndex)
  }, [filteredEvaluations, state.currentPage, state.pageSize])

  const totalPages = Math.ceil(filteredEvaluations.length / state.pageSize)

  // Reset to page 1 when search changes
  useEffect(() => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 })
  }, [state.searchQuery])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: newPageSize })
  }, [])

  // Handlers
  const handleCreateNew = useCallback(() => {
    dispatch({ type: 'SHOW_CREATE_FORM' })
  }, [])

  const handleBackToList = useCallback(() => {
    dispatch({ type: 'HIDE_CREATE_FORM' })
  }, [])

  const handleView = useCallback((form: EvaluationSummary) => {
    dispatch({ type: 'OPEN_VIEW_MODAL', payload: form })
  }, [])

  const handleEdit = useCallback((form: EvaluationSummary) => {
    dispatch({ type: 'START_EDIT', payload: form })
  }, [])

  const [deleteTarget, setDeleteTarget] = useState<EvaluationSummary | null>(null)
  const deleteFormMutation = useDeleteEvaluationForm()
  const handleDelete = useCallback((form: EvaluationSummary) => {
    setDeleteTarget(form)
  }, [])

  const [answerModal, setAnswerModal] = useState<{ open: boolean; evaluation: EvaluationSummary | null }>({ open: false, evaluation: null })
  const handleAnswer = useCallback((form: EvaluationSummary) => {
    setAnswerModal({ open: true, evaluation: form })
  }, [])

  // Columns
  const columns = useMemo(() => [
    ...evaluationColumns,
    createEvaluationActionsColumn(
      handleView,
      handleEdit,
      handleDelete,
      {
        showView: !isMeExpert,
        showEdit: !isMeExpert,
        showDelete: !isMeExpert && (isCompanyAdmin || isProjectManager || isCurriculumAdmin || isTrainingAdmin),
        // Only show "Answer" strictly for ME Expert and no other elevated role
        showAnswer: isMeExpert && !(isCompanyAdmin || isProjectManager || isCurriculumAdmin || isTrainingAdmin),
        onAnswer: handleAnswer
      }
    )
  ], [handleView, handleEdit, handleDelete, handleAnswer, isMeExpert, isCompanyAdmin, isProjectManager, isCurriculumAdmin, isTrainingAdmin])

  // Permission logic for evaluations (ME Expert handles evaluations)
  const canCreateEvaluations = useMemo(() => {
    // ME Expert should not create/edit evaluations
    return isCompanyAdmin || isProjectManager || isCurriculumAdmin || isTrainingAdmin
  }, [isCompanyAdmin, isProjectManager, isCurriculumAdmin, isTrainingAdmin])

  if (isLoading) {
    return <Loading />
  }

  if (state.showCreateForm) {
    return (
      <CreateEvaluationForm 
        trainingId={trainingId}
        onCancel={handleBackToList}
        editingEvaluation={state.editingForm}
      />
    )
  }

  // No evaluations view
  if (evaluations.length === 0) {
    return (
      <DefaultCreate
        title="Create Evaluation"
        trainingId={trainingId}
        onCreateClick={handleCreateNew}
      />
    )
  }

  // Show evaluations list (matching assessment structure)
  return (
    <div className="flex lg:px-16 md:px-14 px-4 w-full">
      <div className="flex-1 py-4 md:pl-12 min-w-0">
        <EvaluationHeader
          searchQuery={state.searchQuery}
          onSearchChange={(value) => dispatch({ type: 'SET_SEARCH_QUERY', payload: value })}
          onCreateNew={handleCreateNew}
          canCreateEvaluations={canCreateEvaluations}
        />

        {/* Evaluations Table */}
      <EvaluationDataTable 
        columns={columns} 
        data={paginatedEvaluations}
          isLoading={isLoading}
        pagination={{
            currentPage: state.currentPage,
            totalPages,
              setPage: (page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
            pageSize: state.pageSize,
              setPageSize: handlePageSizeChange,
            totalElements: filteredEvaluations.length
        }}
      />

        {/* Evaluation View Modal */}
        <EvaluationViewModal
          evaluation={state.viewModal.evaluation}
          isOpen={state.viewModal.open}
          onClose={() => dispatch({ type: 'CLOSE_VIEW_MODAL' })}
        />
        <EvaluationAnswerModal
          evaluation={answerModal.evaluation}
          isOpen={answerModal.open}
          onClose={() => setAnswerModal({ open: false, evaluation: null })}
        />
        <DeleteConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (!deleteTarget) return
            await deleteFormMutation.mutateAsync(deleteTarget.id)
            setDeleteTarget(null)
          }}
          title="Delete Evaluation"
          description="Are you sure you want to delete this evaluation form? This action cannot be undone."
          confirmText={deleteFormMutation.isPending ? "Deleting..." : "Delete"}
          isDeleting={deleteFormMutation.isPending}
        />
      </div>
    </div>
  )
}
