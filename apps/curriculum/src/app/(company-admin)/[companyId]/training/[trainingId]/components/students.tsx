"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Loading } from "@/components/ui/loading"
import { useStudents, useBulkImportStudentsByName, Student, StudentFilters, CreateStudentByNameData } from "@/lib/hooks/useStudents"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { RowSelectionState, ColumnDef } from "@tanstack/react-table"
import { StudentFormValues } from "../students/add/components/formSchemas"
import { studentColumns, createActionsColumn, createStudentColumnsWithSelection, createConsentFormColumn } from "./students/student-columns"
import { StudentDataTable } from "./students/student-data-table"
import { StudentFormModal } from "./students/student-form-modal"
import { DeleteStudentDialog } from "./students/delete-student-dialog"
import { CertificateDateModal } from "./students/certificate-date-modal"
import { useStudentForm } from "./students/hooks/useStudentForm"
import { useStudentActions } from "./students/hooks/useStudentActions"
import { useStudentSync } from "./students/hooks/useStudentSync"
import { StudentsHeader } from "./students/components/students-header"
import { StudentsEmptyState } from "./students/components/students-empty-state"
import { CSVImportView } from "./students/components/csv-import-view"

interface StudentsComponentProps {
  trainingId: string
}

export function StudentsComponent({ trainingId }: StudentsComponentProps) {
  const router = useRouter()
  
  // State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showImportView, setShowImportView] = useState(false)
  const [hasUploadedCSV, setHasUploadedCSV] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [filters, setFilters] = useState<StudentFilters>({})
  
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  // User roles
  const { isProjectManager, isTrainingAdmin, isCompanyAdmin } = useUserRole()
  const hasEditPermission = useMemo(() => isCompanyAdmin || isProjectManager || isTrainingAdmin, [isCompanyAdmin, isProjectManager, isTrainingAdmin])
  const hasSyncPermission = useMemo(() => isProjectManager || isCompanyAdmin, [isProjectManager, isCompanyAdmin])
  
  // Memoize filters using JSON stringify to prevent unnecessary re-renders from object reference changes
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)])
  
  // Students data queries
  const { data, isLoading, isFetching } = useStudents(trainingId, page, pageSize, undefined, undefined, debouncedSearch, memoizedFilters)
  
  // Only check for empty state when no search/filters - use main query data
  const shouldFetchAllStudents = !debouncedSearch.trim() && Object.keys(memoizedFilters).length === 0
  // Use the main query data for empty state check instead of a separate query
  const allStudentsData = shouldFetchAllStudents ? data : null
  const isLoadingAllStudents = shouldFetchAllStudents ? isLoading : false
  
  // Pagination data
  const paginationData = useMemo(() => ({
    students: data?.trainees || [],
    totalPages: data?.totalPages || 0,
    totalElements: data?.totalElements || 0,
    currentPage: data?.currentPage || 1
  }), [data])
  
  // Form hook
  const {
    form,
    step,
    setStep,
    isEditing,
    currentStudentId,
    isLoadingStudent,
    startEdit,
    startAdd,
    validateStep,
  } = useStudentForm()
  
  // Actions hook
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    studentToDelete,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    certificateDateModalOpen,
    setCertificateDateModalOpen,
    selectedStudentsCount,
    onSubmit: handleSubmit,
    handleEditStudent,
    handleDeleteStudent,
    confirmDelete,
    handleBulkDelete,
    confirmBulkDelete,
    handleGenerateCertificates,
    handleConfirmCertificateGeneration,
    handleSendCertificateSms,
    getSelectedStudentIds,
    isSubmitting,
    isGeneratingCertificates,
    isSendingCertificateSms,
    isDeleting,
    isBulkDeleting,
  } = useStudentActions({
    trainingId,
    paginationData,
    rowSelection,
    setRowSelection,
  })
  
  // Sync hook
  const {
    handleSyncPreAssessment,
    handleSyncPostAssessment,
    handleSyncEnrollTrainees,
    handleSyncCreateTrainees,
    handleSyncCompletion,
    handleSyncPreAssessmentTraining,
    handleSyncPostAssessmentTraining,
    handleSyncEnrollTraineesTraining,
    handleSyncCreateTraineesTraining,
    handleSyncCompletionTraining,
    isSyncingPreAssessment,
    isSyncingPostAssessment,
    isSyncingEnrollTrainees,
    isSyncingCreateTrainees,
    isSyncingCompletion,
    isSyncingPreAssessmentTraining,
    isSyncingPostAssessmentTraining,
    isSyncingEnrollTraineesTraining,
    isSyncingCreateTraineesTraining,
    isSyncingCompletionTraining,
  } = useStudentSync({
    trainingId,
    getSelectedStudentIds,
  })
  
  // CSV import data - fetch data when import view OR form modal is shown (not just when CSV is uploaded)
  // This ensures we have the necessary data for both CSV import and student add/edit forms
  const {
    countries: csvCountries,
    regions: csvRegions,
    zones: csvZones,
    cities: csvCities,
    languages: csvLanguages,
    academicLevels: csvAcademicLevels,
    disabilities: csvDisabilities,
    marginalizedGroups: csvMarginalizedGroups,
    bulkImportByNameAsync,
    isLoading: isBulkImporting
  } = useBulkImportStudentsByName(showImportView || showModal)
  
  // Use same data for form modal (avoid duplicate fetching)
  // Extract arrays from wrapper objects
  const languages = csvLanguages?.data || []
  const academicLevels = csvAcademicLevels?.data || []
  const disabilities = csvDisabilities?.data || []
  const marginalizedGroups = csvMarginalizedGroups?.data || []
  
  // Reset page when debounced search actually changes (not on every searchQuery keystroke)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, memoizedFilters])
  
  // Handlers
  const handleAddStudent = useCallback(() => {
    startAdd()
    setShowModal(true)
  }, [startAdd])
  
  const handleShowImport = useCallback(() => {
    setShowImportView(true)
  }, [])
  
  const handleBackFromImport = useCallback(() => {
    setShowImportView(false)
    setHasUploadedCSV(false)
  }, [])
  
  const handleEditClick = useCallback((student: Student) => {
    const studentId = handleEditStudent(student)
    startEdit(studentId)
    setShowModal(true)
  }, [handleEditStudent, startEdit])
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])
  
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])
  
  const handleApplyFilters = useCallback((newFilters: StudentFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])
  
  const handleCSVImport = useCallback(async (students: CreateStudentByNameData[]) => {
    try {
      // Wait for the import to complete - using Async version to catch errors
      await bulkImportByNameAsync({ trainingId, studentsData: students })
      
      // Add a small delay to ensure loading state is visible and success message is read
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Only navigate back on success
      setShowImportView(false)
      setHasUploadedCSV(false)
      // Success toast is already shown in the mutation
    } catch (error) {
      // Error toast is already shown in the mutation
      throw error
    }
  }, [bulkImportByNameAsync, trainingId])
  
  const handleFormSubmit = useCallback(async (values: StudentFormValues) => {
    const success = await handleSubmit(values, isEditing, currentStudentId)
    if (success) {
      setShowModal(false)
    }
  }, [handleSubmit, isEditing, currentStudentId])
  
  // Columns
  const columnsWithActions = useMemo<ColumnDef<Student>[]>(() => {
    const baseColumns = hasEditPermission 
      ? createStudentColumnsWithSelection()
      : [...studentColumns]
    
    if (isProjectManager || isTrainingAdmin) {
      baseColumns.push(createConsentFormColumn())
    }
    
    if (hasEditPermission) {
      baseColumns.push(createActionsColumn(handleEditClick, handleDeleteStudent, hasEditPermission))
    }
    
    return baseColumns
  }, [handleEditClick, handleDeleteStudent, hasEditPermission, isProjectManager, isTrainingAdmin])
  
  // Empty state check
  const shouldShowEmptyState = useMemo(() => {
    const hasNoSearchQuery = !debouncedSearch.trim()
    const hasNoFilters = Object.keys(memoizedFilters).length === 0
    const hasNoStudentsAtAll = allStudentsData?.totalElements === 0
    return hasNoSearchQuery && hasNoFilters && hasNoStudentsAtAll
  }, [debouncedSearch, memoizedFilters, allStudentsData?.totalElements])
  
  // Show full loading only on initial load (when no cached data exists)
  // For refetches (filters, search, pagination), React Query keeps previous data and we use isFetching for table loading
  if (isLoading) {
    return <Loading />
  }
  
  return (
    <div className="flex lg:px-16 md:px-14 px-4 w-full">
      <div className="flex-1 py-4 md:pl-12 min-w-0">
        {showImportView ? (
          <CSVImportView
            onBack={handleBackFromImport}
            onImport={handleCSVImport}
            onFileUpload={() => setHasUploadedCSV(true)}
            isSubmitting={isBulkImporting}
            languages={csvLanguages}
            countries={csvCountries}
            regions={csvRegions}
            zones={csvZones}
            cities={csvCities}
            academicLevels={csvAcademicLevels}
            disabilities={csvDisabilities}
            marginalizedGroups={csvMarginalizedGroups}
          />
        ) : (
          <>
            {shouldShowEmptyState ? (
              <StudentsEmptyState
                onAddStudent={handleAddStudent}
                onShowImport={handleShowImport}
                hasEditPermission={hasEditPermission}
              />
            ) : (
              <>
                <StudentsHeader
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  trainingId={trainingId}
                  filters={memoizedFilters}
                  onApplyFilters={handleApplyFilters}
                  onAddStudent={handleAddStudent}
                  onShowImport={handleShowImport}
                  csvCountries={csvCountries}
                  csvRegions={csvRegions}
                  csvZones={csvZones}
                  languages={csvLanguages}
                  academicLevels={csvAcademicLevels}
                  hasEditPermission={hasEditPermission}
                  hasSyncPermission={hasSyncPermission}
                  selectedCount={selectedStudentsCount}
                  onSyncPreAssessment={handleSyncPreAssessment}
                  onSyncPostAssessment={handleSyncPostAssessment}
                  onSyncEnrollTrainees={handleSyncEnrollTrainees}
                  onSyncCreateTrainees={handleSyncCreateTrainees}
                  onSyncCompletion={handleSyncCompletion}
                  isSyncingPreAssessment={isSyncingPreAssessment}
                  isSyncingPostAssessment={isSyncingPostAssessment}
                  isSyncingEnrollTrainees={isSyncingEnrollTrainees}
                  isSyncingCreateTrainees={isSyncingCreateTrainees}
                  isSyncingCompletion={isSyncingCompletion}
                  onSyncPreAssessmentTraining={handleSyncPreAssessmentTraining}
                  onSyncPostAssessmentTraining={handleSyncPostAssessmentTraining}
                  onSyncEnrollTraineesTraining={handleSyncEnrollTraineesTraining}
                  onSyncCreateTraineesTraining={handleSyncCreateTraineesTraining}
                  onSyncCompletionTraining={handleSyncCompletionTraining}
                  isSyncingPreAssessmentTraining={isSyncingPreAssessmentTraining}
                  isSyncingPostAssessmentTraining={isSyncingPostAssessmentTraining}
                  isSyncingEnrollTraineesTraining={isSyncingEnrollTraineesTraining}
                  isSyncingCreateTraineesTraining={isSyncingCreateTraineesTraining}
                  isSyncingCompletionTraining={isSyncingCompletionTraining}
                  isCompanyAdmin={isCompanyAdmin}
                  isProjectManager={isProjectManager}
                  onGenerateCertificates={handleGenerateCertificates}
                  onSendCertificateSms={handleSendCertificateSms}
                  onBulkDelete={handleBulkDelete}
                  isGeneratingCertificates={isGeneratingCertificates}
                  isSendingCertificateSms={isSendingCertificateSms}
                  isBulkDeleting={isBulkDeleting}
                />
                
                <StudentDataTable
                  columns={columnsWithActions}
                  data={paginationData.students}
                  isLoading={isFetching}
                  pagination={{
                    totalPages: paginationData.totalPages,
                    currentPage: paginationData.currentPage,
                    setPage,
                    pageSize,
                    setPageSize: handlePageSizeChange,
                    totalElements: paginationData.totalElements,
                  }}
                  rowSelection={hasEditPermission ? rowSelection : {}}
                  onRowSelectionChange={hasEditPermission ? setRowSelection : undefined}
                />
              </>
            )}
          </>
        )}
        
        {/* Modals */}
        {showModal && (
          <StudentFormModal
            form={form}
            isOpen={showModal}
            onClose={handleCloseModal}
            step={step}
            setStep={setStep}
            isEditing={isEditing}
            isLoadingStudent={isLoadingStudent}
            isSubmitting={isSubmitting}
            validateStep={validateStep}
            onSubmit={handleFormSubmit}
            languages={languages}
            academicLevels={academicLevels}
            disabilities={disabilities}
            marginalizedGroups={marginalizedGroups}
          />
        )}
        
        <DeleteStudentDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          student={studentToDelete}
          onConfirmDelete={confirmDelete}
          isDeleting={isDeleting}
        />
        
        <DeleteStudentDialog
          isOpen={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          student={null}
          onConfirmDelete={confirmBulkDelete}
          isDeleting={isBulkDeleting}
          title={`Delete ${selectedStudentsCount} Students`}
          description={`Are you sure you want to delete these ${selectedStudentsCount} students? This action cannot be undone.`}
        />
        
        <CertificateDateModal
          isOpen={certificateDateModalOpen}
          onClose={() => {
            setCertificateDateModalOpen(false);
            // Refresh page when modal closes to prevent UI freeze
            setTimeout(() => {
              router.refresh();
            }, 300);
          }}
          onConfirm={handleConfirmCertificateGeneration}
          studentCount={selectedStudentsCount}
          isGenerating={isGeneratingCertificates}
        />
      </div>
    </div>
  )
}
