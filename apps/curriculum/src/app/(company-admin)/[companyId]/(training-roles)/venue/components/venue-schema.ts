import * as z from "zod";

// Schema for a single venue requirement, linked to an equipment item
const venueRequirementSchema = z.object({
  equipmentItemId: z.string(),
  numericValue: z.number().optional().default(0),
  remark: z.string().optional().default(''),
  available: z.boolean().optional().default(false),
});

// Step 3: Venue Capacity Schema
const venueCapacitySchema = z.object({
  seatingCapacity: z.number().min(1, "Seating capacity must be at least 1"),
  standingCapacity: z.number().min(0, "Standing capacity cannot be negative").optional(),
  roomCount: z.number().min(1, "Room count must be at least 1"),
  totalArea: z.number().min(1, "Total area must be at least 1 square meter"),
  hasAccessibility: z.boolean().optional(),
  accessibilityFeatures: z.string().optional(),
  hasParkingSpace: z.boolean().optional(),
  parkingCapacity: z.number().min(0, "Parking capacity cannot be negative").optional(),
});

// Main venue schema that matches the API structure
export const venueSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  location: z.string().min(1, "Location is required"),
  zoneId: z.string().min(1, "Zone is required"),
  cityId: z.string().min(1, "City is required"),
  woreda: z.string().min(1, "Woreda is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  venueRequirements: z.array(venueRequirementSchema).optional(),
  
  // Step 3: Venue Capacity fields
  seatingCapacity: z.number().min(1, "Seating capacity must be at least 1"),
  standingCapacity: z.number().min(0, "Standing capacity cannot be negative").optional(),
  roomCount: z.number().min(1, "Room count must be at least 1"),
  totalArea: z.number().min(1, "Total area must be at least 1 square meter"),
  hasAccessibility: z.boolean().optional().default(false),
  accessibilityFeatures: z.string().optional().default(''),
  hasParkingSpace: z.boolean().optional().default(false),
  parkingCapacity: z.number().min(0, "Parking capacity cannot be negative").optional(),
  
  isActive: z.boolean().default(true),
});

// Schema for edit mode that includes the venue ID
export const editVenueSchema = venueSchema.extend({
  id: z.string(),
});

export type VenueSchema = z.infer<typeof venueSchema>;
export type EditVenueSchema = z.infer<typeof editVenueSchema>;
export type VenueRequirementSchema = z.infer<typeof venueRequirementSchema>;
export type VenueCapacitySchema = z.infer<typeof venueCapacitySchema>; 