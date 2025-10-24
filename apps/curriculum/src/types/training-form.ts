import { z } from "zod"
import { Training, TrainingUpdateRequest } from "./training"
import { BaseItem } from "./curriculum"

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
  durationType: z.enum(["MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS"]),
  trainingTypeId: z.string().min(1, "Training type is required"),
  deliveryMethod: z.enum(["BLENDED", "OFFLINE", "VIRTUAL"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  // New Edge product fields (optional for backward compatibility)
  productKey: z.enum(["LEYU", "OTHER"]).nullable().optional(),
  edgeProduct: z.boolean().optional().default(false),
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
  trainingPurposeIds: z.array(z.string()).min(1, "At least one training purpose is required"),
  certificateDescription: z.string().min(1, "Certificate description is required")
})

export type PurposeFormData = z.infer<typeof purposeSchema>

// Combined schema for the entire form
export const trainingFormSchema = titleRationaleSchema
  .merge(locationSchema)
  .merge(durationSchema)
  .merge(targetAudienceSchema)
  .merge(purposeSchema)

export type TrainingFormData = z.infer<typeof trainingFormSchema>

// Interface for preloaded data in form components
export interface PreloadedFormData extends Partial<TrainingFormData> {
  // Step 1
  preloadedTrainingTags?: BaseItem[]
  
  // Step 2
  preloadedCountries?: BaseItem[]
  preloadedRegions?: BaseItem[]
  preloadedZones?: BaseItem[]
  preloadedCities?: {
    id: string
    name: string
    description: string
    country: BaseItem
    zone?: {
      id: string
      name: string
      description: string
      region: BaseItem
    }
  }[]
  
  // Step 3
  preloadedTrainingType?: BaseItem
  preloadedTrainingTypes?: BaseItem[]
  deliveryMethod?: "BLENDED" | "OFFLINE" | "VIRTUAL"
  startDate?: string
  endDate?: string
  
  // Step 4
  totalParticipants?: number
  preloadedAgeGroups?: BaseItem[]
  preloadedDisabilities?: BaseItem[]
  preloadedMarginalizedGroups?: BaseItem[]
  preloadedEconomicBackgrounds?: BaseItem[]
  preloadedAcademicQualifications?: BaseItem[]
  
  // Step 5
  preloadedTrainingPurposes?: BaseItem[]
  certificateDescription?: string
}

/**
 * Helper function to normalize deliveryMethod values
 */
const normalizeDeliveryMethod = (value?: string): "BLENDED" | "OFFLINE" | "VIRTUAL" | undefined => {
  if (!value) return undefined;
  
  if (value === "BLENDED" || value === "OFFLINE" || value === "VIRTUAL") {
    return value;
  }
  
  // Map old values to new values
  if (value === "OFFLINE") return "OFFLINE";
  if (value === "SELF_PACED") return "VIRTUAL";
  
  // Default fallback
  return "OFFLINE";
}

/**
 * Transforms API Training data to form data format
 */
export function apiToFormData(training: Training): PreloadedFormData {
  // Extract countries from zones (ensuring uniqueness)
  const extractedCountryIds = [...new Set([
    // From zones
    ...(training.zones || []).map(z => z.region.country.id),
    // From cities as fallback - cities have country property directly
    // @ts-expect-error - city.country exists in the actual API response
    ...training.cities.map(c => c.zone?.region.country.id || c.country?.id).filter(Boolean)
  ] as string[])]
  
  // Extract countries objects
  const extractedCountries: BaseItem[] = []
  const countryMap = new Map<string, BaseItem>()
  
  // Add countries from zones
  ;(training.zones || []).forEach(zone => {
    if (zone.region.country && !countryMap.has(zone.region.country.id)) {
      countryMap.set(zone.region.country.id, zone.region.country)
    }
  })
  
  // Add countries from cities as fallback
  training.cities.forEach(city => {
    // @ts-expect-error - city.country exists in the actual API response
    const country = city.zone?.region.country || city.country
    if (country && !countryMap.has(country.id)) {
      countryMap.set(country.id, country)
    }
  })
  
  extractedCountries.push(...countryMap.values())

  // Extract regions from zones (ensuring uniqueness)
  const extractedRegionIds = [...new Set([
    // From zones
    ...(training.zones || []).map(z => z.region.id),
    // From cities as fallback
    ...training.cities.map(c => c.zone?.region.id).filter(Boolean)
  ] as string[])]
  
  // Extract region objects
  const extractedRegions: BaseItem[] = []
  const regionMap = new Map<string, BaseItem>()
  
  // Add regions from zones
  ;(training.zones || []).forEach(zone => {
    if (zone.region && !regionMap.has(zone.region.id)) {
      regionMap.set(zone.region.id, zone.region)
    }
  })
  
  // Add regions from cities as fallback
  training.cities.forEach(city => {
    if (city.zone?.region && !regionMap.has(city.zone.region.id)) {
      regionMap.set(city.zone.region.id, city.zone.region)
    }
  })
  
  extractedRegions.push(...regionMap.values())

  // Extract zone IDs from training.zones and cities
  const extractedZoneIds = [...new Set([
    // From zones array (primary source)
    ...(training.zones || []).map(z => z.id),
    // From cities as fallback
    ...training.cities.map(c => c.zone?.id).filter(Boolean)
  ] as string[])]
  
  // Extract zone objects 
  const extractedZones: BaseItem[] = []
  const zoneMap = new Map<string, BaseItem>()
  
  // Add zones from training.zones (primary source)
  ;(training.zones || []).forEach(zone => {
    if (!zoneMap.has(zone.id)) {
      zoneMap.set(zone.id, zone)
    }
  })
  
  // Add zones from cities as fallback
  training.cities.forEach(city => {
    if (city.zone && !zoneMap.has(city.zone.id)) {
      zoneMap.set(city.zone.id, city.zone)
    }
  })
  
  extractedZones.push(...zoneMap.values())
  
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
    regionIds: extractedRegionIds,
    zoneIds: extractedZoneIds,
    cityIds: training.cities.map(c => c.id),
    preloadedCountries: extractedCountries,
    preloadedRegions: extractedRegions,
    preloadedZones: extractedZones,
    preloadedCities: training.cities,
    
    // Step 3
    duration: training.duration,
    durationType: training.durationType as "MINUTES" | "HOURS" | "DAYS" | "WEEKS" | "MONTHS",
    deliveryMethod: normalizeDeliveryMethod(training.deliveryMethod) || "OFFLINE", // Default to ONLINE if not set
    trainingTypeId: training.trainingType?.id || "",
    startDate: training.startDate || '',
    endDate: training.endDate || '',
    preloadedTrainingType: training.trainingType,
    preloadedTrainingTypes: training.trainingType ? [training.trainingType] : [],
    // New Edge product fields (handle nulls from existing trainings)
    productKey: training.productKey,
    edgeProduct: training.edgeProduct ?? false,
    
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
    preloadedTrainingPurposes: training.trainingPurposes,
    certificateDescription: training.certificateDescription || ''
  }
}

/**
 * Transforms form data to API format for updating
 */
export function formToApiData(formData: Partial<TrainingFormData>): Record<string, unknown> {
  const apiData: Record<string, unknown> = {}
  
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
  
  if (formData.countryIds !== undefined) {
    apiData.countryIds = formData.countryIds
  }
  
  if (formData.regionIds !== undefined) {
    apiData.regionIds = formData.regionIds
  }
  
  if (formData.zoneIds !== undefined) {
    apiData.zoneIds = formData.zoneIds
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
  
  if (formData.startDate !== undefined) {
    apiData.startDate = formData.startDate
  }
  
  if (formData.endDate !== undefined) {
    apiData.endDate = formData.endDate
  }

  if (formData.productKey !== undefined) {
    apiData.productKey = formData.productKey
  }

  if (formData.edgeProduct !== undefined) {
    apiData.edgeProduct = formData.edgeProduct
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
  
  // Map the disability percentages to the format expected by the API (ID-based for requests)
  if (formData.disabilityPercentages !== undefined) {
    apiData.disabilityPercentages = formData.disabilityPercentages.map(dp => ({
      disabilityId: dp.disabilityId,
      percentage: dp.percentage
    }))
  }
  
  // Map the marginalized group percentages to the format expected by the API (ID-based for requests)
  if (formData.marginalizedGroupPercentages !== undefined) {
    apiData.marginalizedGroupPercentages = formData.marginalizedGroupPercentages.map(mgp => ({
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
  
  if (formData.certificateDescription !== undefined) {
    apiData.certificateDescription = formData.certificateDescription
  }
  
  return apiData
} 