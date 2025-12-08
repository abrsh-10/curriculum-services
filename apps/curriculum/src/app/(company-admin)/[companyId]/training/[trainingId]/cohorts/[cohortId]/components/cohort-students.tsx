/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Plus, ChevronDown, Trash2 } from "lucide-react"
import { useCohortTrainees, useRemoveTraineesFromCohort } from "@/lib/hooks/useCohorts"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Loading } from "@/components/ui/loading"
import { StudentDataTable } from "../../../components/students/student-data-table"
import { studentColumns, createRemoveFromCohortColumn } from "../../../components/students/student-columns"
import { ColumnDef } from "@tanstack/react-table"
import { useState as useReactState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCohortSurveyLinks } from "@/lib/hooks/useCohortSurveyLinks"
import { useSurveyLinkExport } from "@/lib/hooks/useSurveyLinkExport"
import { useCohortAssessmentLinks } from "@/lib/hooks/useCohortAssessmentLinks"
import { Copy, FileText, Loader2, Pencil, Upload, Download } from "lucide-react"
import { useUploadConsentForm, useDeleteConsentForm } from "@/lib/hooks/useStudents"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AddCohortStudentModal } from "./add-cohort-student-modal"
import { Student } from "@/lib/hooks/useStudents"
import { DeleteConsentFormDialog } from "../../../components/students/delete-consent-form-dialog"
 
import { toast } from "sonner"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeleteLinkDialog } from "./DeleteLinkDialog"

// Cohort-specific ConsentFormCell component that invalidates cohort queries
interface CohortConsentFormCellProps {
  student: Student;
  cohortId: string;
}

export const CohortConsentFormCell = ({ student, cohortId }: CohortConsentFormCellProps) => {
  const [isUploading, setIsUploading] = useReactState(false);
  const [isDeleting, setIsDeleting] = useReactState(false);
  const [isRefreshing, setIsRefreshing] = useReactState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useReactState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadConsentForm } = useUploadConsentForm();
  const { mutateAsync: deleteConsentForm } = useDeleteConsentForm();
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image or PDF
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('Please upload an image or PDF file');
      return;
    }

    try {
      setIsUploading(true);
      await uploadConsentForm({ id: student.id, consentFormFile: file });
      // Show a refreshing state until the parent table refetches and provides the updated URL
      setIsRefreshing(true);
      // Invalidate cohort trainees queries instead of student queries
      queryClient.invalidateQueries({ queryKey: ['cohortTrainees', cohortId] });
      await queryClient.refetchQueries({ queryKey: ['cohortTrainees', cohortId] });
    } catch (error) {
      console.error('Error uploading consent form:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteConsentForm(student.id);
      // Refetch to update the UI
      queryClient.invalidateQueries({ queryKey: ['cohortTrainees', cohortId] });
      await queryClient.refetchQueries({ queryKey: ['cohortTrainees', cohortId] });
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting consent form:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Turn off refreshing once the consentFormUrl becomes available from parent data
  useEffect(() => {
    if (student.consentFormUrl) {
      setIsRefreshing(false);
    }
  }, [student.consentFormUrl, setIsRefreshing]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Check if it's a signature URL (read-only) or consent form (editable/deletable)
  const hasSignature = !!student.signatureUrl;
  const hasConsentForm = !!student.consentFormUrl;
  const displayUrl = student.signatureUrl || student.consentFormUrl || undefined;

  // If student has a signature URL (read-only - no edit, no delete)
  if (hasSignature) {
    return (
      <div className="flex items-center gap-2">
        <a 
          href={displayUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 underline"
        >
          <FileText className="h-4 w-4" />
          <span>View Signature</span>
        </a>
      </div>
    );
  }

  // If student has a consent form (editable and deletable)
  if (hasConsentForm) {
    return (
      <div className="flex items-center gap-2">
        <a 
          href={displayUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 underline"
        >
          <FileText className="h-4 w-4" />
          <span>View Form</span>
        </a>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,application/pdf"
          className="hidden"
          aria-label="Edit consent form" 
          title="Edit consent form"
        />
        {isRefreshing ? (
          <div className="h-8 w-8 flex items-center justify-center" title="Refreshing">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerFileInput}
              disabled={isUploading || isDeleting}
              className="h-8 w-8 p-0"
              title="Edit Consent Form"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4 text-gray-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isUploading || isDeleting}
              className="h-8 w-8 p-0"
              title="Delete Consent Form"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-500" />
              )}
            </Button>
          </>
        )}
        <DeleteConsentFormDialog
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirmDelete={handleConfirmDelete}
          isDeleting={isDeleting}
          studentName={`${student.firstName} ${student.lastName}`}
        />
      </div>
    );
  }

  // If no consent form uploaded yet
  return (
    <div className="flex items-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*,application/pdf"
        className="hidden"
        aria-label="Upload consent form" 
        title="Upload consent form"
      />
      {isRefreshing ? (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
          className={cn(
            "flex items-center gap-1.5 text-gray-600 hover:text-blue-600",
            isUploading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload Consent</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

// Create a cohort-specific consent form column
const createCohortConsentFormColumn = (cohortId: string): ColumnDef<Student> => ({
  id: "consentForm",
  header: "Consent Form",
  cell: ({ row }) => {
    return <CohortConsentFormCell student={row.original} cohortId={cohortId} />;
  }
});

interface CohortStudentsProps {
  cohortId: string
  trainingId: string
}

export function CohortStudents({ cohortId, trainingId }: CohortStudentsProps) {
  const params = useParams()
  const companyId = params.companyId as string
  const { isProjectManager, isTrainingAdmin } = useUserRole()
  
  // State for pagination, search, and modal
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  
  // State for remove confirmation dialog
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  // Fetch cohort trainees with pagination
  const { data, isLoading, error, refetch } = useCohortTrainees(cohortId, page, pageSize)
  
  // Remove trainees mutation
  const { removeTrainees, isLoading: isRemoving } = useRemoveTraineesFromCohort()
  
  const students = data?.trainees || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // Filter students based on search query (client-side for better UX)
  const filteredStudents = students.filter(student => {
    if (!debouncedSearch) return true
    const searchLower = debouncedSearch.toLowerCase()
    return (
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.contactPhone?.toLowerCase().includes(searchLower)
    )
  })

  const handleOpenAddStudentModal = () => {
    setIsAddStudentModalOpen(true)
  }

  const handleCloseAddStudentModal = () => {
    setIsAddStudentModalOpen(false)
    refetch() // Refresh the cohort students list when modal closes
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }

  const handleRemoveStudent = (student: Student) => {
    if (!student.id) {
      toast.error("Invalid student data")
      return
    }

    // Show confirmation dialog instead of immediately removing
    setStudentToRemove(student)
    setIsRemoveDialogOpen(true)
  }

  const confirmRemoveStudent = () => {
    if (!studentToRemove?.id) {
      toast.error("Invalid student data")
      return
    }

    removeTrainees({
      cohortId,
      traineeIds: [studentToRemove.id],
      trainingId
    }, {
      onSuccess: () => {
        toast.success(`${studentToRemove.firstName} ${studentToRemove.lastName} removed from cohort`)
        refetch() // Refresh the list after removal
        setIsRemoveDialogOpen(false)
        setStudentToRemove(null)
      }
    })
  }

  const cancelRemove = () => {
    setIsRemoveDialogOpen(false)
    setStudentToRemove(null)
  }

  // Get assigned student IDs for the modal (to filter out already assigned students)
  const assignedStudentIds = students.map(student => student.id)

  const traineeIds = filteredStudents.map(s => s.id).filter(Boolean) as string[]
  const {
    selectedSurveyId,
    setSelectedSurveyId,
    viewMode,
    setViewMode,
    expiryValue,
    setExpiryValue,
    expiryUnit,
    setExpiryUnit,
    surveys,
    answeredIds,
    answeredLoading,
    traineeIdToMeta,
    linksLoading,
    refetchAnswered,
    refetchLinks,
    generateForCohort,
    generateForTrainee,
    extendLink,
    deleteLink,
    getAnswersLink,
  } = useCohortSurveyLinks(trainingId, cohortId, traineeIds)

  // Assessment links hook
  const {
    selectedAssessmentId,
    setSelectedAssessmentId,
    viewMode: assessmentViewMode,
    setViewMode: setAssessmentViewMode,
    linkType,
    setLinkType,
    expiryValue: assessmentExpiryValue,
    setExpiryValue: setAssessmentExpiryValue,
    expiryUnit: assessmentExpiryUnit,
    setExpiryUnit: setAssessmentExpiryUnit,
    assessments,
    answeredIds: assessmentAnsweredIds,
    answeredLoading: assessmentAnsweredLoading,
    traineeIdToMeta: assessmentTraineeIdToMeta,
    linksLoading: assessmentLinksLoading,
    refetchAnswered: refetchAssessmentAnswered,
    refetchLinks: refetchAssessmentLinks,
    generateForCohort: generateAssessmentForCohort,
    generateForTrainee: generateAssessmentForTrainee,
    extendLink: extendAssessmentLink,
    deleteLink: deleteAssessmentLink,
    getAnswersLink: getAssessmentAnswersLink,
  } = useCohortAssessmentLinks(trainingId, cohortId, traineeIds)

  // Extend modal state
  const [extendOpen, setExtendOpen] = useReactState(false)
  const [extendByValue, setExtendByValue] = useReactState<number>(1)
  const [extendByUnit, setExtendByUnit] = useReactState<"minutes" | "hours" | "days" | "weeks">("days")
  const [extendingLinkId, setExtendingLinkId] = useReactState<string>("")
  const [extendContext, setExtendContext] = useReactState<{ linkId: string; traineeName?: string; currentExpiry?: string } | null>(null)
  // Delete link dialog state
  const [linkToDelete, setLinkToDelete] = useReactState<{ linkId: string; traineeName?: string } | null>(null)
  
  // Export links state
  const [isExporting, setIsExporting] = useReactState(false)
  const { refetch: refetchExport } = useSurveyLinkExport(selectedSurveyId, cohortId, false)
  const [isDeleteLinkDialogOpen, setIsDeleteLinkDialogOpen] = useReactState(false)

  // Bulk extend modal state
  const [bulkExtendOpen, setBulkExtendOpen] = useReactState(false)
  const [bulkExtendValue, setBulkExtendValue] = useReactState<number>(1)
  const [bulkExtendUnit, setBulkExtendUnit] = useReactState<"minutes" | "hours" | "days" | "weeks">("days")
  const [isBulkExtending, setIsBulkExtending] = useReactState(false)

  // Export survey links handler
  const handleExportLinks = async () => {
    if (!selectedSurveyId || !cohortId) {
      toast.error("Please select a survey first")
      return
    }

    setIsExporting(true)
    try {
      const result = await refetchExport()
      
      if (!result.data || !result.data.surveyLinks || result.data.surveyLinks.length === 0) {
        toast.error("No active survey links found to export")
        setIsExporting(false)
        return
      }

      const data = result.data
      
      // Get survey and cohort names from the first link
      const surveyName = data.surveyLinks[0]?.survey || "Survey"
      const cohortName = data.surveyLinks[0]?.cohort || "Cohort"
      
      // Create CSV content
      let csvContent = "Survey Links Export\n\n"
      csvContent += `Survey: ${surveyName}\n`
      csvContent += `Cohort: ${cohortName}\n`
      csvContent += `Total Links: ${data.count}\n`
      csvContent += `Export Date: ${new Date().toLocaleString()}\n\n`
      csvContent += "Trainee Name,Phone Number,Survey Link\n"
      
      // Add data rows (only active/valid links)
      data.surveyLinks
        .filter(link => link.isValid)
        .forEach(link => {
          csvContent += `"${link.traineeFullName}","${link.traineePhoneNumber}","${link.link}"\n`
        })
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `survey-links-${cohortName}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success(`Exported ${data.surveyLinks.filter(l => l.isValid).length} survey links`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export survey links")
    } finally {
      setIsExporting(false)
    }
  }

  // Toggle for survey tools panel
  const [showSurveyTools, setShowSurveyTools] = useReactState(false)

  // Assessment-specific modal states
  const [assessmentExtendOpen, setAssessmentExtendOpen] = useReactState(false)
  const [assessmentExtendByValue, setAssessmentExtendByValue] = useReactState<number>(1)
  const [assessmentExtendByUnit, setAssessmentExtendByUnit] = useReactState<"minutes" | "hours" | "days" | "weeks">("days")
  const [extendingAssessmentLinkId, setExtendingAssessmentLinkId] = useReactState<string>("")
  const [assessmentExtendContext, setAssessmentExtendContext] = useReactState<{ linkId: string; traineeName?: string; currentExpiry?: string } | null>(null)
  
  // Assessment delete link dialog state
  const [assessmentLinkToDelete, setAssessmentLinkToDelete] = useReactState<{ linkId: string; traineeName?: string } | null>(null)
  const [isDeleteAssessmentLinkDialogOpen, setIsDeleteAssessmentLinkDialogOpen] = useReactState(false)

  // Assessment bulk extend modal state
  const [assessmentBulkExtendOpen, setAssessmentBulkExtendOpen] = useReactState(false)
  const [assessmentBulkExtendValue, setAssessmentBulkExtendValue] = useReactState<number>(1)
  const [assessmentBulkExtendUnit, setAssessmentBulkExtendUnit] = useReactState<"minutes" | "hours" | "days" | "weeks">("days")
  const [isAssessmentBulkExtending, setIsAssessmentBulkExtending] = useReactState(false)

  // Toggle for assessment tools panel
  const [showAssessmentTools, setShowAssessmentTools] = useReactState(false)

  // Columns: extend with "Survey Link" column
  const formatRemaining = (expiry?: string): string => {
    if (!expiry) return "";
    const expiryMs = new Date(expiry).getTime();
    const now = Date.now();
    const diff = Math.max(0, expiryMs - now);
    const minutes = Math.floor(diff / (60 * 1000));
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  const linkColumn: ColumnDef<Student> = {
    id: "surveyLink",
    header: "Survey Link",
    cell: ({ row }) => {
      const student = row.original
      const isAnswersMode = viewMode === 'answered' && Boolean(selectedSurveyId)
      const meta = student.id ? traineeIdToMeta[student.id] : undefined
      const link = isAnswersMode ? getAnswersLink(selectedSurveyId, student.id) : meta?.fullLink
      const linkId = isAnswersMode ? "" : (meta?.linkId || "")
      const remaining = isAnswersMode ? "" : formatRemaining(meta?.expiryDate)
      const copy = async () => {
        if (link) {
          try {
            await navigator.clipboard.writeText(link)
            toast.success("Link copied")
          } catch {
            toast.error("Failed to copy")
          }
        }
      }
      return (
        <div className="flex items-center gap-2">
          {(!isAnswersMode && linksLoading) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : link ? (
            <>
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm" title={link}>
                View Link
              </a>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copy} title="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
              {!!linkId && !isAnswersMode && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    title="Extend expiry"
                    onClick={() => {
                      setExtendContext({ linkId, traineeName: `${student.firstName} ${student.lastName}`.trim(), currentExpiry: meta?.expiryDate })
                      setExtendOpen(true)
                    }}
                  >
                    {extendingLinkId === linkId ? "Extending..." : "Extend"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    title="Delete link"
                    onClick={() => {
                      setLinkToDelete({ linkId, traineeName: `${student.firstName} ${student.lastName}`.trim() })
                      setIsDeleteLinkDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!!remaining && !isAnswersMode && <span className="text-xs text-gray-500">Expires in {remaining}</span>}
            </>
          ) : (
            <>
              <span className="text-gray-400">No link</span>
              {!isAnswersMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  disabled={!selectedSurveyId}
                  onClick={() => {
                    if (!student.id || !selectedSurveyId) return
                    generateForTrainee(student.id)
                  }}
                >
                  Generate
                </Button>
              )}
            </>
          )}
        </div>
      )
    }
  }

  // Assessment link column
  const assessmentLinkColumn: ColumnDef<Student> = {
    id: "assessmentLink",
    header: "Assessment Link",
    cell: ({ row }) => {
      const student = row.original
      const isAnswersMode = assessmentViewMode === 'answered' && Boolean(selectedAssessmentId)
      const meta = student.id ? assessmentTraineeIdToMeta[student.id] : undefined
      const link = isAnswersMode ? getAssessmentAnswersLink(selectedAssessmentId, student.id) : meta?.fullLink
      const linkId = isAnswersMode ? "" : (meta?.linkId || "")
      const remaining = isAnswersMode ? "" : formatRemaining(meta?.expiryDate)
      const copy = async () => {
        if (link) {
          try {
            await navigator.clipboard.writeText(link)
            toast.success("Assessment link copied")
          } catch {
            toast.error("Failed to copy")
          }
        }
      }
      return (
        <div className="flex items-center gap-2">
          {(!isAnswersMode && assessmentLinksLoading) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : link ? (
            <>
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm" title={link}>
                View Link
              </a>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copy} title="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
              {!!linkId && !isAnswersMode && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    title="Extend expiry"
                    onClick={() => {
                      setAssessmentExtendContext({ linkId, traineeName: `${student.firstName} ${student.lastName}`.trim(), currentExpiry: meta?.expiryDate })
                      setAssessmentExtendOpen(true)
                    }}
                  >
                    {extendingAssessmentLinkId === linkId ? "Extending..." : "Extend"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    title="Delete link"
                    onClick={() => {
                      setAssessmentLinkToDelete({ linkId, traineeName: `${student.firstName} ${student.lastName}`.trim() })
                      setIsDeleteAssessmentLinkDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!!remaining && !isAnswersMode && <span className="text-xs text-gray-500">Expires in {remaining}</span>}
            </>
          ) : (
            <>
              <span className="text-gray-400">No link</span>
              {!isAnswersMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  disabled={!selectedAssessmentId}
                  onClick={() => {
                    if (!student.id || !selectedAssessmentId) return
                    generateAssessmentForTrainee(student.id)
                  }}
                >
                  Generate
                </Button>
              )}
            </>
          )}
        </div>
      )
    }
  }

  // Listen for survey-answered and assessment-answered postMessage to refresh links/answered list without polling
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const d = event.data as { type?: string; surveyId?: string; assessmentId?: string; traineeId?: string }
      if (d?.type === 'survey-answered') {
        refetch()
      }
      if (d?.type === 'assessment-answered') {
        refetch()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [refetch])

  const columnsWithRemove = [
    ...studentColumns,
    createCohortConsentFormColumn(cohortId),
    // Conditionally add survey link column only when survey tools are active and a survey is selected
    ...(showSurveyTools && selectedSurveyId ? [linkColumn] : []),
    // Conditionally add assessment link column only when assessment tools are active and an assessment is selected
    ...(showAssessmentTools && selectedAssessmentId ? [assessmentLinkColumn] : []),
    createRemoveFromCohortColumn(
      handleRemoveStudent,
      isProjectManager || isTrainingAdmin,
      isRemoving
    )
  ]

  if (isLoading && !data) {
    return <Loading />
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Students</h2>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          <Button
            variant="outline"
            size="sm"
            className="ml-2 h-8"
            onClick={() => {
              setShowSurveyTools((v)=>!v)
              // Close assessment tools when opening survey tools
              if (!showSurveyTools) {
                setShowAssessmentTools(false)
              }
            }}
            title="Show survey link tools"
          >
            <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showSurveyTools ? "rotate-180" : "rotate-0"}`} />
            <span className="hidden sm:inline">Survey link tools</span>
            <span className="sm:hidden">Survey tools</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 h-8"
            onClick={() => {
              setShowAssessmentTools((v)=>!v)
              // Close survey tools when opening assessment tools
              if (!showAssessmentTools) {
                setShowSurveyTools(false)
              }
            }}
            title="Show assessment link tools"
          >
            <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAssessmentTools ? "rotate-180" : "rotate-0"}`} />
            <span className="hidden sm:inline">Assessment link tools</span>
            <span className="sm:hidden">Assessment tools</span>
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative md:w-[300px]">
            <Image
              src="/search.svg"
              alt="Search"
              width={19}
              height={19}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 z-10"
            />
            <Input
              type="text"
              placeholder="Search students..."
              className="pl-10 h-10 text-sm bg-white border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {(isProjectManager || isTrainingAdmin) && (
            <Button
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
              onClick={handleOpenAddStudentModal}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              <span>Add Students</span>
            </Button>
          )}
        </div>
      </div>

      {showSurveyTools && (
        <div className="mb-4 rounded-md border border-gray-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
              <SelectTrigger className="w-[220px] h-10">
                <SelectValue placeholder="Select survey" />
              </SelectTrigger>
              <SelectContent>
                {surveys.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={viewMode}
              onValueChange={(v)=> {
                setViewMode(v as any)
                // Proactively refetch when switching mode
                if (v === 'answered') {
                  refetchAnswered()
                } else {
                  refetchLinks()
                }
              }}
              disabled={!selectedSurveyId}
            >
              <SelectTrigger className="w-[200px] h-10">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Manage links</SelectItem>
                <SelectItem value="answered">View answers</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="number"
              min={1}
              value={expiryValue}
              onChange={(e)=> setExpiryValue(Number(e.target.value))}
              className="w-24 h-10 border rounded px-2 text-sm"
              placeholder="Expiry"
              title="Expiry value"
            />
            <Select value={expiryUnit} onValueChange={(v)=> setExpiryUnit(v as any)}>
              <SelectTrigger className="w-[120px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
              </SelectContent>
            </Select>
            {viewMode === 'all' && (
              <>
                <Button
                  className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white h-10"
                  disabled={!selectedSurveyId}
                  onClick={() => generateForCohort(cohortId)}
                >
                  Generate for Cohort
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-600/90 text-white h-10"
                  disabled={!selectedSurveyId || !(Object.keys(traineeIdToMeta).length) || isBulkExtending}
                  onClick={() => setBulkExtendOpen(true)}
                >
                  {isBulkExtending ? "Extending..." : `Extend all (${Object.keys(traineeIdToMeta).length || 0})`}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 gap-2"
                  disabled={!selectedSurveyId || isExporting}
                  onClick={handleExportLinks}
                  title="Export survey links to CSV"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Export Links</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {showAssessmentTools && (
        <div className="mb-4 rounded-md border border-gray-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
              <SelectTrigger className="w-[220px] h-10">
                <SelectValue placeholder="Select assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={linkType} onValueChange={(v) => setLinkType(v as "PRE_ASSESSMENT" | "POST_ASSESSMENT")}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Assessment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRE_ASSESSMENT">Pre Assessment</SelectItem>
                <SelectItem value="POST_ASSESSMENT">Post Assessment</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={assessmentViewMode}
              onValueChange={(v)=> {
                setAssessmentViewMode(v as any)
                // Proactively refetch when switching mode
                if (v === 'answered') {
                  refetchAssessmentAnswered()
                } else {
                  refetchAssessmentLinks()
                }
              }}
              disabled={!selectedAssessmentId}
            >
              <SelectTrigger className="w-[200px] h-10">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Manage links</SelectItem>
                <SelectItem value="answered">View answers</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="number"
              min={1}
              value={assessmentExpiryValue}
              onChange={(e)=> setAssessmentExpiryValue(Number(e.target.value))}
              className="w-24 h-10 border rounded px-2 text-sm"
              placeholder="Expiry"
              title="Expiry value"
            />
            <Select value={assessmentExpiryUnit} onValueChange={(v)=> setAssessmentExpiryUnit(v as any)}>
              <SelectTrigger className="w-[120px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
              </SelectContent>
            </Select>
            {assessmentViewMode === 'all' && (
              <>
                <Button
                  className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white h-10"
                  disabled={!selectedAssessmentId}
                  onClick={() => generateAssessmentForCohort(cohortId)}
                >
                  Generate for Cohort
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-600/90 text-white h-10"
                  disabled={!selectedAssessmentId || !(Object.keys(assessmentTraineeIdToMeta).length) || isAssessmentBulkExtending}
                  onClick={() => setAssessmentBulkExtendOpen(true)}
                >
                  {isAssessmentBulkExtending ? "Extending..." : `Extend all (${Object.keys(assessmentTraineeIdToMeta).length || 0})`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">Error Loading Students</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the students. Please try again later.
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">No Students Added Yet</h3>
          <p className="text-gray-500 text-sm">
            Add students to this cohort to get started.
          </p>
          {(isProjectManager || isTrainingAdmin) && (
            <Button 
              className="mt-4 bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 mx-auto"
              onClick={handleOpenAddStudentModal}
            >
              <Plus className="h-4 w-4" />
              <span>Add Students</span>
            </Button>
          )}
        </div>
      ) : (
        <StudentDataTable
          columns={columnsWithRemove}
          data={
            // Show survey answered students when survey tools are active and in answered mode
            (showSurveyTools && viewMode === 'answered' && selectedSurveyId)
              ? (answeredLoading ? [] : filteredStudents.filter(s => s.id && answeredIds.has(s.id)))
              // Show assessment answered students when assessment tools are active and in answered mode
              : (showAssessmentTools && assessmentViewMode === 'answered' && selectedAssessmentId)
                ? (assessmentAnsweredLoading ? [] : filteredStudents.filter(s => s.id && assessmentAnsweredIds.has(s.id)))
                // Show all students when no tools are active or not in answered mode
                : filteredStudents
          }
          isLoading={isLoading || 
            (showSurveyTools && viewMode === 'answered' && Boolean(selectedSurveyId) && answeredLoading) ||
            (showAssessmentTools && assessmentViewMode === 'answered' && Boolean(selectedAssessmentId) && assessmentAnsweredLoading)
          }
          pagination={{
            totalPages,
            currentPage: page,
            setPage,
            pageSize,
            setPageSize: handlePageSizeChange,
            totalElements,
          }}
        />
      )}

      {/* Add Student Modal */}
      <AddCohortStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={handleCloseAddStudentModal}
        cohortId={cohortId}
        trainingId={trainingId}
        companyId={companyId}
        assignedStudentIds={assignedStudentIds}
      />

      {/* Remove Student Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="">Remove Student from Cohort</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              Are you sure you want to remove <strong>{studentToRemove?.firstName} {studentToRemove?.lastName}</strong> from this cohort?
              <br />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRemove}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveStudent}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Link Modal */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend link {extendContext?.traineeName ? `for ${extendContext.traineeName}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {extendContext?.currentExpiry && (
              <div className="text-sm text-gray-600">Current expiry: {new Date(extendContext.currentExpiry).toLocaleString()} ({formatRemaining(extendContext.currentExpiry)} remaining)</div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm">Extend by</span>
              <input
                type="number"
                min={1}
                value={extendByValue}
                onChange={(e)=> setExtendByValue(Number(e.target.value))}
                className="w-24 h-9 border rounded px-2 text-sm"
              />
              <Select value={extendByUnit} onValueChange={(v)=> setExtendByUnit(v as any)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={()=> setExtendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
              disabled={!extendContext?.linkId}
              onClick={() => {
                if (!extendContext?.linkId) return
                setExtendingLinkId(extendContext.linkId)
                try {
                  extendLink({ linkId: extendContext.linkId, byValue: extendByValue, byUnit: extendByUnit })
                  setExtendOpen(false)
                } finally {
                  setExtendingLinkId("")
                }
              }}
            >
              {extendingLinkId ? "Extending..." : "Extend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Extend Modal */}
      <Dialog open={bulkExtendOpen} onOpenChange={setBulkExtendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend all links</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">{Object.keys(traineeIdToMeta).length || 0} links will be extended.</div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Extend by</span>
              <input
                type="number"
                min={1}
                value={bulkExtendValue}
                onChange={(e)=> setBulkExtendValue(Number(e.target.value))}
                className="w-24 h-9 border rounded px-2 text-sm"
              />
              <Select value={bulkExtendUnit} onValueChange={(v)=> setBulkExtendUnit(v as any)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setBulkExtendOpen(false)}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-600/90 text-white"
              disabled={!selectedSurveyId || !(Object.keys(traineeIdToMeta).length) || isBulkExtending}
              onClick={async () => {
                const ids = Object.values(traineeIdToMeta).map(m => m.linkId).filter(Boolean)
                setIsBulkExtending(true)
                try {
                  ids.forEach(id => extendLink({ linkId: id, byValue: bulkExtendValue, byUnit: bulkExtendUnit }))
                  setBulkExtendOpen(false)
                } finally {
                  setIsBulkExtending(false)
                }
              }}
            >
              {isBulkExtending ? "Extending..." : "Extend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteLinkDialog
        isOpen={isDeleteLinkDialogOpen}
        traineeName={linkToDelete?.traineeName}
        isDeleting={false}
        onCancel={() => setIsDeleteLinkDialogOpen(false)}
        onConfirm={() => {
          if (!linkToDelete?.linkId) return
          deleteLink(linkToDelete.linkId)
          setIsDeleteLinkDialogOpen(false)
          setLinkToDelete(null)
        }}
      />

      {/* Assessment Extend Link Modal */}
      <Dialog open={assessmentExtendOpen} onOpenChange={setAssessmentExtendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend assessment link {assessmentExtendContext?.traineeName ? `for ${assessmentExtendContext.traineeName}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {assessmentExtendContext?.currentExpiry && (
              <div className="text-sm text-gray-600">Current expiry: {new Date(assessmentExtendContext.currentExpiry).toLocaleString()} ({formatRemaining(assessmentExtendContext.currentExpiry)} remaining)</div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm">Extend by</span>
              <input
                type="number"
                min={1}
                value={assessmentExtendByValue}
                onChange={(e)=> setAssessmentExtendByValue(Number(e.target.value))}
                className="w-24 h-9 border rounded px-2 text-sm"
              />
              <Select value={assessmentExtendByUnit} onValueChange={(v)=> setAssessmentExtendByUnit(v as any)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={()=> setAssessmentExtendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
              disabled={!assessmentExtendContext?.linkId}
              onClick={() => {
                if (!assessmentExtendContext?.linkId) return
                setExtendingAssessmentLinkId(assessmentExtendContext.linkId)
                try {
                  extendAssessmentLink({ linkId: assessmentExtendContext.linkId, byValue: assessmentExtendByValue, byUnit: assessmentExtendByUnit })
                  setAssessmentExtendOpen(false)
                } finally {
                  setExtendingAssessmentLinkId("")
                }
              }}
            >
              {extendingAssessmentLinkId ? "Extending..." : "Extend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment Bulk Extend Modal */}
      <Dialog open={assessmentBulkExtendOpen} onOpenChange={setAssessmentBulkExtendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend all assessment links</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">{Object.keys(assessmentTraineeIdToMeta).length || 0} assessment links will be extended.</div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Extend by</span>
              <input
                type="number"
                min={1}
                value={assessmentBulkExtendValue}
                onChange={(e)=> setAssessmentBulkExtendValue(Number(e.target.value))}
                className="w-24 h-9 border rounded px-2 text-sm"
              />
              <Select value={assessmentBulkExtendUnit} onValueChange={(v)=> setAssessmentBulkExtendUnit(v as any)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setAssessmentBulkExtendOpen(false)}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-600/90 text-white"
              disabled={!selectedAssessmentId || !(Object.keys(assessmentTraineeIdToMeta).length) || isAssessmentBulkExtending}
              onClick={async () => {
                const ids = Object.values(assessmentTraineeIdToMeta).map(m => m.linkId).filter(Boolean)
                setIsAssessmentBulkExtending(true)
                try {
                  ids.forEach(id => extendAssessmentLink({ linkId: id, byValue: assessmentBulkExtendValue, byUnit: assessmentBulkExtendUnit }))
                  setAssessmentBulkExtendOpen(false)
                } finally {
                  setIsAssessmentBulkExtending(false)
                }
              }}
            >
              {isAssessmentBulkExtending ? "Extending..." : "Extend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment Delete Link Dialog */}
      <DeleteLinkDialog
        isOpen={isDeleteAssessmentLinkDialogOpen}
        traineeName={assessmentLinkToDelete?.traineeName}
        isDeleting={false}
        onCancel={() => setIsDeleteAssessmentLinkDialogOpen(false)}
        onConfirm={() => {
          if (!assessmentLinkToDelete?.linkId) return
          deleteAssessmentLink(assessmentLinkToDelete.linkId)
          setIsDeleteAssessmentLinkDialogOpen(false)
          setAssessmentLinkToDelete(null)
        }}
      />
    </div>
  )
} 