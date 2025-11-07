import { useState, useCallback, useMemo } from "react"
import { RowSelectionState } from "@tanstack/react-table"
import { Student, CreateStudentData, StudentFilters } from "@/lib/hooks/useStudents"
import { useAddStudent, useUpdateStudent, useDeleteStudent, useBulkDeleteStudents } from "@/lib/hooks/useStudents"
import { useSubmitCertificate } from "@/lib/hooks/useCertificate"
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [certificateDateModalOpen, setCertificateDateModalOpen] = useState(false)

  const { addStudent, isLoading: isAddingStudent } = useAddStudent()
  const updateStudentMutation = useUpdateStudent()
  const deleteStudentMutation = useDeleteStudent()
  const bulkDeleteMutation = useBulkDeleteStudents()
  const { mutate: generateCertificates, isPending: isGeneratingCertificates } = useSubmitCertificate()

  const selectedStudentsCount = Object.keys(rowSelection).length

  // Helper function to get selected student IDs
  const getSelectedStudentIds = useCallback(() => {
    const selectedIndices = Object.keys(rowSelection);
    return selectedIndices
      .map(index => {
        const student = paginationData.students[parseInt(index)];
        return student?.id;
      })
      .filter(Boolean) as string[];
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

  const handleConfirmCertificateGeneration = useCallback((issueDate: string) => {
    const traineeIds = getSelectedStudentIds();

    if (traineeIds.length === 0) {
      toast.error('No valid students selected');
      return;
    }

    generateCertificates(
      {
        issueDate,
        traineeIds
      },
      {
        onSuccess: () => {
          setRowSelection({});
          setCertificateDateModalOpen(false);
        },
        onError: () => {
          // Keep modal open on error so user can retry
        }
      }
    );
  }, [getSelectedStudentIds, generateCertificates, setRowSelection]);

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
    getSelectedStudentIds,
    
    // Loading states
    isSubmitting: isAddingStudent || updateStudentMutation.isPending,
    isGeneratingCertificates,
    isDeleting: deleteStudentMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
  }
}

