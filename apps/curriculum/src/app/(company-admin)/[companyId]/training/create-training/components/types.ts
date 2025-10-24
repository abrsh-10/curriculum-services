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
    regionIds?: string[];
    zoneIds?: string[];
    cityIds?: string[];
    duration?: number;
    durationType?: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
    deliveryMethod?: 'BLENDED' | 'OFFLINE' | 'VIRTUAL';
    productKey?: 'LEYU' | 'OTHER' | null;
    edgeProduct?: boolean;
    startDate?: string;
    endDate?: string;
    trainingTypeId?: string;
    totalParticipants?: number;
    trainingPurposeIds?: string[];
    certificateDescription?: string;
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
    preloadedRegions?: any[];
    preloadedZones?: any[];
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