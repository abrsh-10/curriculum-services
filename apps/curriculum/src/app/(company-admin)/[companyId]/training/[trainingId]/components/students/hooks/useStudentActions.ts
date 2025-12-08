import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { RowSelectionState } from "@tanstack/react-table"
import { Student, CreateStudentData, StudentFilters } from "@/lib/hooks/useStudents"
import { useAddStudent, useUpdateStudent, useDeleteStudent, useBulkDeleteStudents } from "@/lib/hooks/useStudents"
import { useSubmitCertificate, useSendCertificateSms } from "@/lib/hooks/useCertificate"
import { toast } from "sonner"
import { StudentFormValues } from "../../../students/add/components/formSchemas"

interface UseStudentActionsProps {
  trainingId: string
  paginationData: {
    students: Student[]
  }
  rowSelection: RowSelectionState
  setRowSelection: (selection: RowSelectionState) => void
}

export function useStudentActions({
  trainingId,
  paginationData,
  rowSelection,
  setRowSelection,
}: UseStudentActionsProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [certificateDateModalOpen, setCertificateDateModalOpen] = useState(false)

  const { addStudent, isLoading: isAddingStudent } = useAddStudent()
  const updateStudentMutation = useUpdateStudent()
  const deleteStudentMutation = useDeleteStudent()
  const bulkDeleteMutation = useBulkDeleteStudents()
  const { mutateAsync: generateCertificatesAsync, isPending: isGeneratingCertificates } = useSubmitCertificate()
  const { mutateAsync: sendCertificateSmsAsync, isPending: isSendingCertificateSms } = useSendCertificateSms()

  const selectedStudentsCount = Object.keys(rowSelection).length

  // Helper function to get selected student IDs
  const getSelectedStudentIds = useCallback(() => {
    const selectedKeys = Object.keys(rowSelection);
    if (selectedKeys.length === 0) return [];

    // Backward compatibility: if keys are numeric, treat them as indices
    const allNumeric = selectedKeys.every((k) => /^\d+$/.test(k));
    if (allNumeric) {
      return selectedKeys
        .map((index) => paginationData.students[parseInt(index)]?.id)
        .filter(Boolean) as string[];
    }

    // Otherwise keys are stable row IDs (student IDs)
    const availableIds = new Set(paginationData.students.map((s) => s.id));
    return selectedKeys.filter((id) => availableIds.has(id));
  }, [rowSelection, paginationData.students]);

  // Convert form values to API format
  const convertToCreateStudentData = useCallback((values: StudentFormValues): CreateStudentData => {
    const formattedDateOfBirth = values.dateOfBirth instanceof Date
      ? values.dateOfBirth.toISOString().split('T')[0]
      : ""; 
    
    return {
      firstName: values.firstName,
      middleName: values.middleName || undefined,
      lastName: values.lastName,
      email: values.email,
      contactPhone: values.contactPhone,
      dateOfBirth: formattedDateOfBirth,
      gender: values.gender as "MALE" | "FEMALE",
      zoneId: values.zoneId || "",
      cityId: values.cityId || "",
      woreda: values.woreda,
      houseNumber: values.houseNumber,
      languageId: values.languageId || "",
      academicLevelId: values.academicLevelId || "",
      fieldOfStudy: values.fieldOfStudy,
      hasSmartphone: values.hasSmartphone,
      hasTrainingExperience: values.hasTrainingExperience,
      trainingExperienceDescription: values.trainingExperienceDescription || undefined,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      emergencyContactRelationship: values.emergencyContactRelationship,
      disabilityIds: values.hasDisability ? (values.disabilityIds || []) : [],
      marginalizedGroupIds: values.belongsToMarginalizedGroup ? (values.marginalizedGroupIds || []) : [],
    }
  }, []);

  // Submit handler
  const onSubmit = useCallback(async (values: StudentFormValues, isEditing: boolean, currentStudentId: string | null) => {
    const studentData = convertToCreateStudentData(values);

    try {
      if (isEditing && currentStudentId) {
        await updateStudentMutation.mutateAsync({ id: currentStudentId, studentData });
        return true;
      } else {
        await addStudent({ trainingId, studentData });
        return true;
      }
    } catch (error) {
      console.log("Submission failed:", error);
      return false;
    }
  }, [addStudent, convertToCreateStudentData, trainingId, updateStudentMutation]);

  // Edit handler
  const handleEditStudent = useCallback((student: Student) => {
    return student.id;
  }, []);

  // Delete handlers
  const handleDeleteStudent = useCallback((student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (studentToDelete) {
      try {
        await deleteStudentMutation.mutateAsync(studentToDelete.id);
        setDeleteDialogOpen(false);
        setStudentToDelete(null);
      } catch (error) {
        console.log("Delete failed:", error);
      }
    }
  }, [deleteStudentMutation, studentToDelete]);

  // Bulk delete handlers
  const handleBulkDelete = useCallback(() => {
    const selectedIndices = Object.keys(rowSelection);
    if (selectedIndices.length === 0) return;

    const selectedStudentIds = getSelectedStudentIds();

    if (selectedStudentIds.length === 0) {
      toast.error('No valid students selected for deletion');
      return;
    }

    setBulkDeleteDialogOpen(true);
  }, [rowSelection, getSelectedStudentIds]);

  const confirmBulkDelete = useCallback(async () => {
    const selectedStudentIds = getSelectedStudentIds();

    try {
      await bulkDeleteMutation.mutateAsync(selectedStudentIds);
      setRowSelection({});
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.log("Bulk delete failed:", error);
    }
  }, [getSelectedStudentIds, bulkDeleteMutation, setRowSelection]);

  // Certificate generation handlers
  const handleGenerateCertificates = useCallback(() => {
    if (selectedStudentsCount === 0) {
      toast.error('Please select students to generate certificates');
      return;
    }

    if (selectedStudentsCount > 10) {
      toast.error('You can only generate certificates for up to 10 students at a time');
      return;
    }

    setCertificateDateModalOpen(true);
  }, [selectedStudentsCount]);

  const handleConfirmCertificateGeneration = useCallback(async (issueDate: string) => {
    const traineeIds = getSelectedStudentIds();

    if (traineeIds.length === 0) {
      toast.error('No valid students selected');
      setCertificateDateModalOpen(false);
      return;
    }

    try {
      await generateCertificatesAsync({
        issueDate,
        traineeIds
      });
      
      // On success: clear selection and close modal
      setRowSelection({});
      setCertificateDateModalOpen(false);
      
      // Refresh the page to prevent UI freeze
      setTimeout(() => {
        router.refresh();
      }, 300);
    } catch (error) {
      // Error is handled by mutation's onError handler
      // Close modal and refresh to prevent UI freeze
      setCertificateDateModalOpen(false);
      
      // Refresh the page even on error to prevent UI freeze
      setTimeout(() => {
        router.refresh();
      }, 300);
      
      console.error('Certificate generation failed:', error);
    }
  }, [getSelectedStudentIds, generateCertificatesAsync, setRowSelection, router]);

  // Send certificate SMS for selected trainees
  const handleSendCertificateSms = useCallback(async () => {
    const traineeIds = getSelectedStudentIds();
    if (traineeIds.length === 0) {
      toast.error('No valid students selected');
      return;
    }
    try {
      await sendCertificateSmsAsync({ traineeIds });
      setRowSelection({});
    } catch (error) {
      // Error handled in mutation
      console.error('Send certificate SMS failed:', error);
    }
  }, [getSelectedStudentIds, sendCertificateSmsAsync, setRowSelection]);

  return {
    // State
    deleteDialogOpen,
    setDeleteDialogOpen,
    studentToDelete,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    certificateDateModalOpen,
    setCertificateDateModalOpen,
    selectedStudentsCount,
    
    // Handlers
    onSubmit,
    handleEditStudent,
    handleDeleteStudent,
    confirmDelete,
    handleBulkDelete,
    confirmBulkDelete,
    handleGenerateCertificates,
    handleConfirmCertificateGeneration,
    handleSendCertificateSms,
    getSelectedStudentIds,
    
    // Loading states
    isSubmitting: isAddingStudent || updateStudentMutation.isPending,
    isGeneratingCertificates,
    isSendingCertificateSms,
    isDeleting: deleteStudentMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
  }
}

