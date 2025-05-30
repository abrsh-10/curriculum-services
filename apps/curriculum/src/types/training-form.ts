import { z } from "zod"
import { Training } from "./training"

// Step 1: Title, Rationale & Tags
export const titleRationaleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  rationale: z.string().min(1, "Rationale is required"),
  trainingTagIds: z.array(z.string()).optional()
})

export type TitleRationaleFormData = z.infer<typeof titleRationaleSchema>

// Step 2: Location
export const locationSchema = z.object({
  countryIds: z.array(z.string()).min(1, "At least one country is required"),
  regionIds: z.array(z.string()).min(1, "At least one region is required"),
  zoneIds: z.array(z.string()).min(1, "At least one zone is required"),
  cityIds: z.array(z.string()).optional()
})

export type LocationFormData = z.infer<typeof locationSchema>

// Step 3: Duration and Training Type
export const durationSchema = z.object({
  duration: z.number().min(1, "Duration must be at least 1"),
  durationType: z.enum(["DAYS", "WEEKS", "MONTHS", "HOURS"]),
  trainingTypeId: z.string().min(1, "Training type is required"),
  deliveryMethod: z.enum(["BLENDED", "ONLINE", "VIRTUAL"]),
})

export type DurationFormData = z.infer<typeof durationSchema>

// Step 4: Target Audience
export const targetAudienceSchema = z.object({
  totalParticipants: z.number().min(0, "Total participants must be a positive number").default(0),
  ageGroupIds: z.array(z.string()).min(1, "At least one age group is required"),
  genderPercentages: z.array(z.object({
    gender: z.enum(["MALE", "FEMALE"]),
    percentage: z.number().min(0).max(100)
  })).min(1, "Gender percentages are required"),
  disabilityPercentages: z.array(z.object({
    disabilityId: z.string(),
    percentage: z.number().min(0).max(100)
  })).optional(),
  marginalizedGroupPercentages: z.array(z.object({
    marginalizedGroupId: z.string(),
    percentage: z.number().min(0).max(100)
  })).optional(),
  economicBackgroundIds: z.array(z.string()).min(1, "At least one economic background is required"),
  academicQualificationIds: z.array(z.string()).min(1, "At least one academic qualification is required")
})

export type TargetAudienceFormData = z.infer<typeof targetAudienceSchema>

// Step 5: Purpose
export const purposeSchema = z.object({
  trainingPurposeIds: z.array(z.string()).min(1, "At least one training purpose is required")
})

export type PurposeFormData = z.infer<typeof purposeSchema>

// Combined schema for the entire form
export const trainingFormSchema = titleRationaleSchema
  .merge(locationSchema)
  .merge(durationSchema)
  .merge(targetAudienceSchema)
  .merge(purposeSchema)

export type TrainingFormData = z.infer<typeof trainingFormSchema>

// Base item interface for reference data
export interface BaseItem {
  id: string
  name: string
  description: string
  range?: string | null
}

// Interface for preloaded data in form components
export interface PreloadedFormData extends Partial<TrainingFormData> {
  // Step 1
  preloadedTrainingTags?: BaseItem[]
  
  // Step 2
  preloadedCountries?: BaseItem[]
  preloadedCities?: {
    id: string
    name: string
    description: string
    country: BaseItem
  }[]
  
  // Step 3
  preloadedTrainingType?: BaseItem
  preloadedTrainingTypes?: BaseItem[]
  deliveryMethod?: "BLENDED" | "ONLINE" | "VIRTUAL"
  
  // Step 4
  totalParticipants?: number
  preloadedAgeGroups?: BaseItem[]
  preloadedDisabilities?: BaseItem[]
  preloadedMarginalizedGroups?: BaseItem[]
  preloadedEconomicBackgrounds?: BaseItem[]
  preloadedAcademicQualifications?: BaseItem[]
  
  // Step 5
  preloadedTrainingPurposes?: BaseItem[]
}

/**
 * Helper function to normalize deliveryMethod values
 */
const normalizeDeliveryMethod = (value?: string): "BLENDED" | "ONLINE" | "VIRTUAL" | undefined => {
  if (!value) return undefined;
  
  if (value === "BLENDED" || value === "ONLINE" || value === "VIRTUAL") {
    return value;
  }
  
  // Map old values to new values
  if (value === "OFFLINE") return "BLENDED";
  if (value === "SELF_PACED") return "VIRTUAL";
  
  // Default fallback
  return "ONLINE";
}

/**
 * Transforms API Training data to form data format
 */
export function apiToFormData(training: Training): PreloadedFormData {
  // Extract country IDs from cities (ensuring uniqueness)
  const extractedCountryIds = [...new Set(
    training.cities
      .map(c => c.country?.id)
      .filter(Boolean) as string[]
  )]
  
  // Extract countries from cities
  const extractedCountries = extractedCountryIds.map(id => {
    const city = training.cities.find(c => c.country?.id === id)
    return city?.country
  }).filter(Boolean) as BaseItem[]
  
  // Transform the disability percentages
  const transformedDisabilityPercentages = Array.isArray(training.disabilityPercentages) 
    ? training.disabilityPercentages.map(item => ({
        disabilityId: item.disability?.id || "",
        percentage: item.percentage || 0
      }))
    : []
  
  // Transform the marginalized group percentages
  const transformedMarginalizedGroupPercentages = Array.isArray(training.marginalizedGroupPercentages)
    ? training.marginalizedGroupPercentages.map(item => ({
        marginalizedGroupId: item.marginalizedGroup?.id || "",
        percentage: item.percentage || 0
      }))
    : []
  
  // Extract unique disabilities from disabilityPercentages
  const extractedDisabilities = Array.isArray(training.disabilityPercentages)
    ? training.disabilityPercentages.map(item => item.disability).filter(Boolean)
    : []
  
  // Extract unique marginalized groups
  const extractedMarginalizedGroups = Array.isArray(training.marginalizedGroupPercentages)
    ? training.marginalizedGroupPercentages.map(item => item.marginalizedGroup).filter(Boolean)
    : []
  
  // Extract unique tags if they exist on the training object
  const extractedTrainingTags = Array.isArray(training.trainingTags) 
    ? training.trainingTags.filter(Boolean) 
    : []
    
  // Extract tag IDs
  const extractedTrainingTagIds = extractedTrainingTags.map(tag => tag.id)
  
  return {
    // Step 1
    title: training.title,
    rationale: training.rationale,
    trainingTagIds: extractedTrainingTagIds,
    preloadedTrainingTags: extractedTrainingTags,
    
    // Step 2
    countryIds: extractedCountryIds,
    cityIds: training.cities.map(c => c.id),
    preloadedCountries: extractedCountries,
    preloadedCities: training.cities,
    
    // Step 3
    duration: training.duration,
    durationType: training.durationType as "DAYS" | "WEEKS" | "MONTHS" | "HOURS",
    deliveryMethod: normalizeDeliveryMethod(training.deliveryMethod) || "ONLINE", // Default to ONLINE if not set
    trainingTypeId: training.trainingType?.id || "",
    preloadedTrainingType: training.trainingType,
    preloadedTrainingTypes: training.trainingType ? [training.trainingType] : [],
    
    // Step 4
    totalParticipants: training.totalParticipants || 0,
    ageGroupIds: training.ageGroups.map(ag => ag.id),
    genderPercentages: training.genderPercentages,
    disabilityPercentages: transformedDisabilityPercentages,
    marginalizedGroupPercentages: transformedMarginalizedGroupPercentages,
    economicBackgroundIds: training.economicBackgrounds.map(eb => eb.id),
    academicQualificationIds: training.academicQualifications.map(aq => aq.id),
    
    // Preloaded data
    preloadedAgeGroups: training.ageGroups,
    preloadedDisabilities: extractedDisabilities as BaseItem[],
    preloadedMarginalizedGroups: extractedMarginalizedGroups as BaseItem[],
    preloadedEconomicBackgrounds: training.economicBackgrounds,
    preloadedAcademicQualifications: training.academicQualifications,
    
    // Step 5
    trainingPurposeIds: training.trainingPurposes.map(tp => tp.id),
    preloadedTrainingPurposes: training.trainingPurposes
  }
}

/**
 * Transforms form data to API format for updating
 */
export function formToApiData(formData: Partial<TrainingFormData>): Partial<Training> {
  const apiData: Partial<Training> = {}
  
  // Always include these core fields if available
  if (formData.title !== undefined) {
    apiData.title = formData.title
  }
  
  if (formData.rationale !== undefined) {
    apiData.rationale = formData.rationale
  }
  
  if (formData.trainingTypeId !== undefined) {
    apiData.trainingTypeId = formData.trainingTypeId
  }
  
  if (formData.cityIds !== undefined) {
    apiData.cityIds = formData.cityIds
  }
  
  if (formData.duration !== undefined) {
    apiData.duration = formData.duration
  }
  
  if (formData.durationType !== undefined) {
    apiData.durationType = formData.durationType
  }
  
  if (formData.deliveryMethod !== undefined) {
    apiData.deliveryMethod = normalizeDeliveryMethod(formData.deliveryMethod)
  }
  
  if (formData.totalParticipants !== undefined) {
    apiData.totalParticipants = formData.totalParticipants
  }
  
  if (formData.ageGroupIds !== undefined) {
    apiData.ageGroupIds = formData.ageGroupIds
  }
  
  if (formData.economicBackgroundIds !== undefined) {
    apiData.economicBackgroundIds = formData.economicBackgroundIds
  }
  
  if (formData.academicQualificationIds !== undefined) {
    apiData.academicQualificationIds = formData.academicQualificationIds
  }
  
  if (formData.genderPercentages !== undefined) {
    apiData.genderPercentages = formData.genderPercentages
  }
  
  // Map the disability percentages to the format expected by the API
  if (formData.disabilityPercentages !== undefined) {
    apiData.disabilityPercentagesInput = formData.disabilityPercentages.map(dp => ({
      disabilityId: dp.disabilityId,
      percentage: dp.percentage
    }))
  }
  
  // Map the marginalized group percentages to the format expected by the API
  if (formData.marginalizedGroupPercentages !== undefined) {
    apiData.marginalizedGroupPercentagesInput = formData.marginalizedGroupPercentages.map(mgp => ({
      marginalizedGroupId: mgp.marginalizedGroupId,
      percentage: mgp.percentage
    }))
  }
  
  if (formData.trainingPurposeIds !== undefined) {
    apiData.trainingPurposeIds = formData.trainingPurposeIds
  }
  
  if (formData.trainingTagIds !== undefined) {
    apiData.trainingTagIds = formData.trainingTagIds
  }
  
  return apiData
} 