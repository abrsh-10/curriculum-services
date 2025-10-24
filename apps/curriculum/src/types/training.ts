import { BaseItem } from "./curriculum"; 

export interface Training {
  id: string;
  title: string;
  rationale: string;
  trainingType: BaseItem;
  cities: {
    id: string;
    name: string;
    description: string;
    country: BaseItem;
    zone?: {
      id: string;
      name: string;
      description: string;
      region: BaseItem;
    };
  }[];
  regions?: {
    id: string;
    name: string;
    description: string;
    country: BaseItem;
  }[];
  zones?: {
    id: string;
    name: string;
    description: string;
    region: {
      id: string;
      name: string;
      description: string;
      country: BaseItem;
    };
  }[];
  countries?: BaseItem[];
  duration: number;
  durationType: "MINUTES" | "HOURS" | "DAYS" | "WEEKS" | "MONTHS";
  deliveryMethod?: "BLENDED" | "OFFLINE" | "VIRTUAL";
  startDate?: string;
  endDate?: string;
  totalParticipants?: number;
  ageGroups: BaseItem[];
  genderPercentages: {
    gender: "MALE" | "FEMALE";
    percentage: number;
  }[];
  disabilityPercentages?: {
    disability: BaseItem;
    percentage: number;
  }[];
  marginalizedGroupPercentages?: {
    marginalizedGroup: BaseItem;
    percentage: number;
  }[];
  economicBackgrounds: BaseItem[];
  academicQualifications: BaseItem[];
  trainingPurposes: BaseItem[];
  trainingTags?: BaseItem[]; // Populated tags in response
  certificateDescription?: string;
  companyProfile: {
    id: string;
    name: string;
    // ... other company profile fields
  };
  
  // Fields used only in API requests, align with backend expectations
  cityIds?: string[];
  countryIds?: string[];
  regionIds?: string[];
  zoneIds?: string[];
  trainingTypeId?: string;
  trainingTagIds?: string[]; // Added for API request payload
  ageGroupIds?: string[];
  economicBackgroundIds?: string[];
  academicQualificationIds?: string[];
  trainingPurposeIds?: string[];
  // Edge New DTO
  productKey?: 'LEYU' | 'OTHER' | null;
  edgeProduct?: boolean | null;
}

// Type for API requests with ID-based percentages
export interface TrainingUpdateRequest {
  disabilityPercentages?: Array<{ disabilityId: string; percentage: number; }>;
  marginalizedGroupPercentages?: Array<{ marginalizedGroupId: string; percentage: number; }>;
}
