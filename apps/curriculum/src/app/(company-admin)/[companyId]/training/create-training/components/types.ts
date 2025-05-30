/* eslint-disable @typescript-eslint/no-explicit-any */
export interface StepProps {
  onNext?: (data?: any) => void;
  onBack?: () => void;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    rationale?: string;
    trainingTagIds?: string[];
    countryIds?: string[];
    cityIds?: string[];
    duration?: number;
    durationType?: 'DAYS' | 'WEEKS' | 'MONTHS' | 'HOURS';
    deliveryMethod?: 'BLENDED' | 'ONLINE' | 'VIRTUAL';
    trainingTypeId?: string;
    totalParticipants?: number;
    trainingPurposeIds?: string[];
    ageGroupIds?: string[];
    genderPercentages?: Array<{
      gender: "MALE" | "FEMALE";
      percentage: number;
    }>;
    disabilityPercentages?: Array<{
      disabilityId: string;
      percentage: number;
    }>;
    marginalizedGroupPercentages?: Array<{
      marginalizedGroupId: string;
      percentage: number;
    }>;
    economicBackgroundIds?: string[];
    academicQualificationIds?: string[];
    // Preloaded reference data to avoid unnecessary API calls
    preloadedTrainingTags?: any[];
    preloadedCountries?: any[];
    preloadedCities?: any[];
    preloadedTrainingType?: any;
    preloadedTrainingTypes?: any[];
    preloadedAgeGroups?: any[];
    preloadedDisabilities?: any[];
    preloadedMarginalizedGroups?: any[];
    preloadedEconomicBackgrounds?: any[];
    preloadedAcademicQualifications?: any[];
    preloadedTrainingPurposes?: any[];
  };
  isSubmitting?: boolean;
  isEditing?: boolean;
} 