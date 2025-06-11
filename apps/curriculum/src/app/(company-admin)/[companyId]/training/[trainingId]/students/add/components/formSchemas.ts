import { z } from "zod"

// Step 1: Personal Information
export const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  languageId: z.string().optional(),
  hasSmartphone: z.boolean(),
  smartphoneOwner: z.string().optional(),
})

// Step 2: Contact Information
export const contactInfoSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().min(9, "Phone number must be at least 9 digits"),
  countryId: z.string().optional(),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  cityId: z.string().optional(),
  woreda: z.string().min(1, "Please enter a woreda/kebele"),
  houseNumber: z.string().min(1, "Please enter your house number or building name"),
})

// Step 3: Education & Experience
export const educationSchemaBase = z.object({
  academicLevelId: z.string().optional(),
  fieldOfStudy: z.string().min(1, "Please enter your field of study"),
  hasTrainingExperience: z.boolean(),
  trainingExperienceDescription: z.string().optional(),
});

export const educationSchema = educationSchemaBase.refine(data => {
  // Require description only if experience is true
  if (data.hasTrainingExperience) {
    return data.trainingExperienceDescription && data.trainingExperienceDescription.length > 0;
  }
  return true;
}, {
  message: "Please provide details about your training experience",
  path: ["trainingExperienceDescription"], // Specify the field this error message relates to
});

// Step 4: Emergency Contact
export const emergencyContactSchema = z.object({
  emergencyContactName: z.string().min(2, "Contact name must be at least 2 characters"),
  emergencyContactPhone: z.string().min(9, "Phone number must be at least 9 digits"),
  emergencyContactRelationship: z.string().min(2, "Relationship must be at least 2 characters"),
});

// Step 5: Additional Information - Base definition
export const additionalInfoSchemaBase = z.object({
  hasDisability: z.boolean().nullable().optional(), // Use nullable boolean for initial undefined state, optional
  disabilityIds: z.array(z.string()).optional(),
  belongsToMarginalizedGroup: z.boolean().nullable().optional(), // Use nullable boolean, optional
  marginalizedGroupIds: z.array(z.string()).optional(),
});

// Combined schema for the entire form
export const studentFormSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(educationSchemaBase)
  .merge(emergencyContactSchema)
  .merge(additionalInfoSchemaBase) // Merge the base schema for step 5
  // Refinement for required select fields
  .refine(data => {
    return data.gender && (data.gender === "MALE" || data.gender === "FEMALE");
  }, {
    message: "Please select a gender",
    path: ["gender"],
  })
  .refine(data => {
    return data.languageId && data.languageId.length > 0;
  }, {
    message: "Please select a language",
    path: ["languageId"],
  })
  .refine(data => {
    return data.countryId && data.countryId.length > 0;
  }, {
    message: "Please select a country",
    path: ["countryId"],
  })
  .refine(data => {
    return data.regionId && data.regionId.length > 0;
  }, {
    message: "Please select a region",
    path: ["regionId"],
  })
  .refine(data => {
    return data.zoneId && data.zoneId.length > 0;
  }, {
    message: "Please select a zone",
    path: ["zoneId"],
  })
  .refine(data => {
    return data.academicLevelId && data.academicLevelId.length > 0;
  }, {
    message: "Please select your highest qualification",
    path: ["academicLevelId"],
  })
  // Refinement for training experience
  .refine(data => {
    if (data.hasTrainingExperience) {
      return data.trainingExperienceDescription && data.trainingExperienceDescription.length > 0;
    }
    return true;
  }, {
    message: "Please provide details about your training experience",
    path: ["trainingExperienceDescription"],
  })
  // Refinement for disabilities
  .refine(data => {
    // If hasDisability is explicitly true, require at least one ID
    if (data.hasDisability === true) {
      return data.disabilityIds && data.disabilityIds.length > 0;
    } 
    // If hasDisability is false or null/undefined, it's valid regardless of disabilityIds
    return true;
  }, {
    message: "Please select at least one disability if you indicated you have one",
    path: ["disabilityIds"], // Apply error to the selection field
  })
  // Refinement for marginalized groups
  .refine(data => {
    // If belongsToMarginalizedGroup is explicitly true, require at least one ID
    if (data.belongsToMarginalizedGroup === true) {
      return data.marginalizedGroupIds && data.marginalizedGroupIds.length > 0;
    }
    // If belongsToMarginalizedGroup is false or null/undefined, it's valid
    return true;
  }, {
    message: "Please select at least one group if you indicated you belong to one",
    path: ["marginalizedGroupIds"], // Apply error to the selection field
  });

export type StudentFormValues = z.infer<typeof studentFormSchema> 