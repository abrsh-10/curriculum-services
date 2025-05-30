/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useBaseData } from './useBaseData';
import { getCookie } from "@curriculum-services/auth"

interface CreateTrainingData {
  title: string;
  rationale: string;
  trainingTagIds?: string[];
  zoneIds: string[];
  cityIds: string[];
  duration: number;
  durationType: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  trainingTypeId: string;
  deliveryMethod: 'BLENDED' | 'ONLINE' | 'VIRTUAL';
  totalParticipants: number;
  ageGroupIds: string[];
  genderPercentages: Array<{
    gender: 'MALE' | 'FEMALE';
    percentage: number;
  }>;
  economicBackgroundIds: string[];
  academicQualificationIds: string[];
  disabilityPercentages?: Array<{
    disabilityId: string;
    percentage: number;
  }>;
  marginalizedGroupPercentages?: Array<{
    marginalizedGroupId: string;
    percentage: number;
  }>;
  trainingPurposeIds: string[];
}

export function useCreateTraining() {
  // Use baseData hook for all required data
  const { data: cities } = useBaseData('city');
  const { data: ageGroups } = useBaseData('age-group');
  const { data: economicBackgrounds } = useBaseData('economic-background');
  const { data: academicQualifications } = useBaseData('academic-qualification');
  const { data: trainingPurposes } = useBaseData('training-purpose');


  // Create training mutation
  const createTrainingMutation = useMutation({
    mutationFn: async (data: CreateTrainingData) => {
      const token = getCookie('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Training created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create training');
    }
  });

  return {
    cities,
    ageGroups,
    economicBackgrounds,
    academicQualifications,
    trainingPurposes,
    createTraining: createTrainingMutation.mutate,
    isLoading: createTrainingMutation.isPending
  };
} 