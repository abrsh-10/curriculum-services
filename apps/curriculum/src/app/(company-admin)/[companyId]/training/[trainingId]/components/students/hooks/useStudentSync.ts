import { useCallback } from "react"
import { toast } from "sonner"
import {
  useSyncPreAssessment,
  useSyncPostAssessment,
  useSyncEnrollTrainees,
  useSyncCreateTrainees,
  useSyncPreAssessmentTraining,
  useSyncPostAssessmentTraining,
  useSyncEnrollTraineesTraining,
  useSyncCreateTraineesTraining,
} from "@/lib/hooks/useSyncEdgeIntegration"

interface UseStudentSyncProps {
  trainingId: string
  getSelectedStudentIds: () => string[]
}

export function useStudentSync({ trainingId, getSelectedStudentIds }: UseStudentSyncProps) {
  // Sync hooks for selected students
  const { syncPreAssessment, isLoading: isSyncingPreAssessment } = useSyncPreAssessment()
  const { syncPostAssessment, isLoading: isSyncingPostAssessment } = useSyncPostAssessment()
  const { syncEnrollTrainees, isLoading: isSyncingEnrollTrainees } = useSyncEnrollTrainees()
  const { syncCreateTrainees, isLoading: isSyncingCreateTrainees } = useSyncCreateTrainees()
  
  // Sync hooks for all students in training
  const { syncPreAssessmentTraining, isLoading: isSyncingPreAssessmentTraining } = useSyncPreAssessmentTraining()
  const { syncPostAssessmentTraining, isLoading: isSyncingPostAssessmentTraining } = useSyncPostAssessmentTraining()
  const { syncEnrollTraineesTraining, isLoading: isSyncingEnrollTraineesTraining } = useSyncEnrollTraineesTraining()
  const { syncCreateTraineesTraining, isLoading: isSyncingCreateTraineesTraining } = useSyncCreateTraineesTraining()

  // Sync handlers for selected students
  const handleSyncPreAssessment = useCallback(() => {
    const traineeIds = getSelectedStudentIds();
    if (traineeIds.length === 0) {
      toast.error('Please select students to sync');
      return;
    }
    syncPreAssessment({ traineeIds });
  }, [getSelectedStudentIds, syncPreAssessment]);

  const handleSyncPostAssessment = useCallback(() => {
    const traineeIds = getSelectedStudentIds();
    if (traineeIds.length === 0) {
      toast.error('Please select students to sync');
      return;
    }
    syncPostAssessment({ traineeIds });
  }, [getSelectedStudentIds, syncPostAssessment]);

  const handleSyncEnrollTrainees = useCallback(() => {
    const traineeIds = getSelectedStudentIds();
    if (traineeIds.length === 0) {
      toast.error('Please select students to sync');
      return;
    }
    syncEnrollTrainees({ traineeIds });
  }, [getSelectedStudentIds, syncEnrollTrainees]);

  const handleSyncCreateTrainees = useCallback(() => {
    const traineeIds = getSelectedStudentIds();
    if (traineeIds.length === 0) {
      toast.error('Please select students to sync');
      return;
    }
    syncCreateTrainees({ traineeIds });
  }, [getSelectedStudentIds, syncCreateTrainees]);

  // Sync handlers for all students in training
  const handleSyncPreAssessmentTraining = useCallback(() => {
    syncPreAssessmentTraining({ trainingId });
  }, [syncPreAssessmentTraining, trainingId]);

  const handleSyncPostAssessmentTraining = useCallback(() => {
    syncPostAssessmentTraining({ trainingId });
  }, [syncPostAssessmentTraining, trainingId]);

  const handleSyncEnrollTraineesTraining = useCallback(() => {
    syncEnrollTraineesTraining({ trainingId });
  }, [syncEnrollTraineesTraining, trainingId]);

  const handleSyncCreateTraineesTraining = useCallback(() => {
    syncCreateTraineesTraining({ trainingId });
  }, [syncCreateTraineesTraining, trainingId]);

  return {
    // Selected students sync handlers
    handleSyncPreAssessment,
    handleSyncPostAssessment,
    handleSyncEnrollTrainees,
    handleSyncCreateTrainees,
    
    // All students sync handlers
    handleSyncPreAssessmentTraining,
    handleSyncPostAssessmentTraining,
    handleSyncEnrollTraineesTraining,
    handleSyncCreateTraineesTraining,
    
    // Loading states
    isSyncingPreAssessment,
    isSyncingPostAssessment,
    isSyncingEnrollTrainees,
    isSyncingCreateTrainees,
    isSyncingPreAssessmentTraining,
    isSyncingPostAssessmentTraining,
    isSyncingEnrollTraineesTraining,
    isSyncingCreateTraineesTraining,
  }
}

