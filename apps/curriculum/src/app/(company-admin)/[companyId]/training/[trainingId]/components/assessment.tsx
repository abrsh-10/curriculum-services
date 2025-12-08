"use client"

import { useReducer, useMemo, useCallback, useEffect } from "react"
import { Loading } from "@/components/ui/loading"
import { toast } from "sonner"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { useAuth } from "@/lib/hooks/useAuth"
import { useChangeAssessmentStatus } from "@/lib/hooks/useAssessment"
import { useCreateAssessment, useAssessments, AssessmentSummary, useDeleteAssessment } from "@/lib/hooks/useAssessment"
import { CreateAssessmentForm, type CreateAssessmentData } from "./assessment/index"
import { AssessmentDataTable } from "./assessment/components/assessment-data-table"
import { createAssessmentColumnsWithActions } from "./assessment/components/assessment-columns"
import { AssessmentViewModal } from "./assessment/components/AssessmentViewModal"
import { DefaultCreate } from "./defaultCreate"
import { AssessmentApproveDialog } from "./assessment/components/AssessmentApproveDialog"
import { AssessmentDeleteDialog } from "./assessment/components/AssessmentDeleteDialog"
import { AssessmentHeader } from "./assessment/components/assessment-header"

interface AssessmentComponentProps {
  trainingId: string
}

// State management with useReducer
type AssessmentState = {
  // UI State
  showCreateForm: boolean
  searchQuery: string
  isSubmitting: boolean
  
  // Pagination
  currentPage: number
  pageSize: number
  
  // Modals
  viewModal: { open: boolean; assessment: AssessmentSummary | null }
  approveDialog: { open: boolean; target: AssessmentSummary | null }
  deleteDialog: { open: boolean; target: AssessmentSummary | null }
  
  // Editing
  editingAssessment: AssessmentSummary | null
}

type AssessmentAction =
  | { type: 'SHOW_CREATE_FORM' }
  | { type: 'HIDE_CREATE_FORM' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'OPEN_VIEW_MODAL'; payload: AssessmentSummary }
  | { type: 'CLOSE_VIEW_MODAL' }
  | { type: 'OPEN_APPROVE_DIALOG'; payload: AssessmentSummary }
  | { type: 'CLOSE_APPROVE_DIALOG' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: AssessmentSummary }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'START_EDIT'; payload: AssessmentSummary }
  | { type: 'CLEAR_EDIT' }

const initialState: AssessmentState = {
  showCreateForm: false,
  searchQuery: "",
  isSubmitting: false,
  currentPage: 1,
  pageSize: 10,
  viewModal: { open: false, assessment: null },
  approveDialog: { open: false, target: null },
  deleteDialog: { open: false, target: null },
  editingAssessment: null,
}

function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'SHOW_CREATE_FORM':
      return { ...state, showCreateForm: true }
    case 'HIDE_CREATE_FORM':
      return { ...state, showCreateForm: false, editingAssessment: null }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload }
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, currentPage: 1 }
    case 'OPEN_VIEW_MODAL':
      return { ...state, viewModal: { open: true, assessment: action.payload } }
    case 'CLOSE_VIEW_MODAL':
      return { ...state, viewModal: { open: false, assessment: null } }
    case 'OPEN_APPROVE_DIALOG':
      return { ...state, approveDialog: { open: true, target: action.payload } }
    case 'CLOSE_APPROVE_DIALOG':
      return { ...state, approveDialog: { open: false, target: null } }
    case 'OPEN_DELETE_DIALOG':
      return { ...state, deleteDialog: { open: true, target: action.payload } }
    case 'CLOSE_DELETE_DIALOG':
      return { ...state, deleteDialog: { open: false, target: null } }
    case 'START_EDIT':
      return { ...state, editingAssessment: action.payload, showCreateForm: true }
    case 'CLEAR_EDIT':
      return { ...state, editingAssessment: null }
    default:
      return state
  }
}

export function AssessmentComponent({ trainingId }: AssessmentComponentProps) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState)
  
  const { isProjectManager, isTrainingAdmin, isCompanyAdmin, isCurriculumAdmin, isContentDeveloper } = useUserRole()
  const { user } = useAuth()
  
  // Fetch assessments for this training
  const { data: assessmentsData, isLoading } = useAssessments(trainingId)
  const changeStatus = useChangeAssessmentStatus()
  const createAssessment = useCreateAssessment()
  const deleteAssessment = useDeleteAssessment()

  // For content developers: show only assigned assessments
  const assessments = useMemo(() => {
    const allAssessments = assessmentsData?.assessments || []
    if (isContentDeveloper && user?.email) {
      return allAssessments.filter(a => a.contentDeveloper?.email === user.email)
    }
    return allAssessments
  }, [assessmentsData?.assessments, isContentDeveloper, user?.email])
  
  // Filter assessments based on search query
  const filteredAssessments = useMemo(() => {
    if (!state.searchQuery.trim()) return assessments
    
    return assessments.filter(assessment => 
      assessment.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      assessment.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      assessment.type.toLowerCase().includes(state.searchQuery.toLowerCase())
    )
  }, [assessments, state.searchQuery])

  // Client-side pagination
  const paginatedAssessments = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize
    const endIndex = startIndex + state.pageSize
    return filteredAssessments.slice(startIndex, endIndex)
  }, [filteredAssessments, state.currentPage, state.pageSize])

  const totalPages = Math.ceil(filteredAssessments.length / state.pageSize)

  // Reset to page 1 when search changes
  useEffect(() => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 })
  }, [state.searchQuery])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: newPageSize })
  }, [])

  const handleCreateNew = useCallback(() => {
    dispatch({ type: 'SHOW_CREATE_FORM' })
  }, [])

  const handleBackToList = useCallback(() => {
    dispatch({ type: 'HIDE_CREATE_FORM' })
  }, [])

  const handleSubmit = useCallback((data: CreateAssessmentData) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true })
    createAssessment.mutate(
      { trainingId, data },
      {
        onSuccess: () => {
          dispatch({ type: 'SET_SUBMITTING', payload: false })
          dispatch({ type: 'HIDE_CREATE_FORM' })
          toast.success("Assessment created successfully")
        },
        onError: () => {
          dispatch({ type: 'SET_SUBMITTING', payload: false })
        }
      }
    )
  }, [createAssessment, trainingId])

  // Action handlers
  const handleViewAssessment = useCallback((assessment: AssessmentSummary) => {
    dispatch({ type: 'OPEN_VIEW_MODAL', payload: assessment })
  }, [])

  const handleEditAssessment = useCallback((assessment: AssessmentSummary) => {
    // Open builder immediately; for content developers with no sections,
    // the builder will handle creating sections/questions on save
    dispatch({ type: 'START_EDIT', payload: assessment })
  }, [])

  const handleAssessmentSettings = useCallback((assessment: AssessmentSummary) => {
    // TODO: Open assessment settings modal
    console.log("Assessment settings:", assessment)
  }, [])

  const handleDeleteAssessment = useCallback((assessment: AssessmentSummary) => {
    dispatch({ type: 'OPEN_DELETE_DIALOG', payload: assessment })
  }, [])
  
  const confirmDelete = useCallback(() => {
    if (!state.deleteDialog.target) return
    
    deleteAssessment.mutate(state.deleteDialog.target.id, {
      onSuccess: () => {
        dispatch({ type: 'CLOSE_DELETE_DIALOG' })
        toast.success("Assessment deleted successfully")
      }
    })
  }, [deleteAssessment, state.deleteDialog.target])

  const canApprove = useCallback((assessment: AssessmentSummary) => {
    return (isProjectManager || isCompanyAdmin || isCurriculumAdmin) && assessment.approvalStatus !== "APPROVED"
  }, [isProjectManager, isCompanyAdmin, isCurriculumAdmin])

  const handleApproveAssessment = useCallback((assessment: AssessmentSummary) => {
    dispatch({ type: 'OPEN_APPROVE_DIALOG', payload: assessment })
  }, [])

  // Check if user has edit permissions
  const hasEditPermission = useMemo(() => {
    return isCompanyAdmin || isProjectManager || isCurriculumAdmin || isTrainingAdmin || isContentDeveloper
  }, [isCompanyAdmin, isProjectManager, isCurriculumAdmin, isTrainingAdmin, isContentDeveloper])

  // Only non-content roles can create assessments
  const canCreateAssessments = useMemo(() => {
    return isCompanyAdmin || isProjectManager || isCurriculumAdmin || isTrainingAdmin
  }, [isCompanyAdmin, isProjectManager, isCurriculumAdmin, isTrainingAdmin])

  // Create columns with actions
  const columnsWithActions = useMemo(() => {
    const canAddContent = (a: AssessmentSummary) => isContentDeveloper && a.sectionCount === 0
    const onAddContent = (a: AssessmentSummary) => handleEditAssessment(a)
    return createAssessmentColumnsWithActions(
      handleViewAssessment,
      handleEditAssessment,
      handleAssessmentSettings,
      handleDeleteAssessment,
      hasEditPermission,
      handleApproveAssessment,
      canApprove,
      onAddContent,
      canAddContent
    )
  }, [handleViewAssessment, handleEditAssessment, handleAssessmentSettings, handleDeleteAssessment, hasEditPermission, handleApproveAssessment, canApprove, isContentDeveloper])

  // Show loading for initial data fetch
  if (isLoading) {
    return <Loading />
  }

  // Show create form if explicitly requested
  if (state.showCreateForm) {
    return (
      <CreateAssessmentForm
        trainingId={trainingId}
        onCancel={handleBackToList}
        onSubmit={handleSubmit}
        isSubmitting={state.isSubmitting || createAssessment.isPending}
        editingAssessment={state.editingAssessment}
      />
    )
  }

  // No assessments view
  if (assessments.length === 0) {
    if (isContentDeveloper) {
      return (
        <div className="flex lg:px-16 md:px-14 px-4 w-full">
          <div className="flex-1 py-4 md:pl-12 min-w-0">
            <h1 className="text-lg font-semibold mb-6">Assessment</h1>
            <div className="rounded-md border p-10 text-center text-gray-500 text-sm bg-white">
              No assessments assigned to you yet.
            </div>
          </div>
        </div>
      )
    }
    return (
      <DefaultCreate
        title="Create Assessment"
        trainingId={trainingId}
        onCreateClick={handleCreateNew}
      />
    )
  }

  // Show assessments list
  return (
    <div className="flex lg:px-16 md:px-14 px-4 w-full">
      <div className="flex-1 py-4 md:pl-12 min-w-0">
        <AssessmentHeader
          searchQuery={state.searchQuery}
          onSearchChange={(value) => dispatch({ type: 'SET_SEARCH_QUERY', payload: value })}
          onCreateNew={handleCreateNew}
          canCreateAssessments={canCreateAssessments}
        />

        {/* Assessments Table */}
        <AssessmentDataTable
          columns={columnsWithActions}
          data={paginatedAssessments}
          isLoading={isLoading}
          pagination={{
            currentPage: state.currentPage,
            totalPages,
            setPage: (page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
            pageSize: state.pageSize,
            setPageSize: handlePageSizeChange,
            totalElements: filteredAssessments.length,
          }}
        />

        {/* Assessment View Modal */}
        <AssessmentViewModal
          assessment={state.viewModal.assessment}
          isOpen={state.viewModal.open}
          onClose={() => dispatch({ type: 'CLOSE_VIEW_MODAL' })}
        />

        {/* Approve Dialog */}
        <AssessmentApproveDialog
          isOpen={state.approveDialog.open}
          onClose={() => dispatch({ type: 'CLOSE_APPROVE_DIALOG' })}
          onConfirm={() => {
            if (!state.approveDialog.target) return
            changeStatus.mutate({ assessmentId: state.approveDialog.target.id, status: "APPROVED" }, {
              onSuccess: () => {
                dispatch({ type: 'CLOSE_APPROVE_DIALOG' })
              }
            })
          }}
          assessmentName={state.approveDialog.target?.name || ""}
          isApproving={changeStatus.isPending}
        />

        {/* Delete Dialog */}
        <AssessmentDeleteDialog
          isOpen={state.deleteDialog.open}
          onClose={() => dispatch({ type: 'CLOSE_DELETE_DIALOG' })}
          onConfirm={confirmDelete}
          assessmentName={state.deleteDialog.target?.name || ""}
          isDeleting={deleteAssessment.isPending}
        />
      </div>
    </div>
  )
}


