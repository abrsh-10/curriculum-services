"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TrainerPersonalInfoForm } from "../add/components/TrainerPersonalInfoForm"
import { TrainerProfessionalInfoForm } from "../add/components/TrainerProfessionalInfoForm"
import { Trainer, CreateTrainerData, useUpdateTrainer, Language, AcademicLevel, TrainingTag } from "@/lib/hooks/useTrainers"

// Reuse the same schema from add page
const trainerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  faydaId: z.string().optional(),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }).optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  
  // Location fields - hierarchical structure (countryId and regionId are for UI cascading only, not sent to API)
  countryId: z.string().optional(),
  regionId: z.string().optional(),
  zoneId: z.string().min(1, "Zone is required"),
  cityId: z.string().optional(),
  woreda: z.string().optional(),
  houseNumber: z.string().optional(),
  location: z.string().optional(),
  languageId: z.string().min(1, "Language is required"),
  academicLevelId: z.string().min(1, "Academic level is required"),
  experienceYears: z.number().min(0, "Experience years must be non-negative").int(),
  trainingTagIds: z.array(z.string()).optional(),
  coursesTaught: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

type TrainerFormValues = z.infer<typeof trainerFormSchema>;
  
interface TrainerDetailsModalProps {
  trainer: Trainer
  isOpen: boolean
  onClose: () => void
  mode: "view" | "edit"
  languages: Language[]
  academicLevels: AcademicLevel[]
  trainingTags: TrainingTag[]
}

export function TrainerDetailsModal({
  trainer,
  isOpen,
  onClose,
  mode,
  languages,
  academicLevels,
  trainingTags,
}: TrainerDetailsModalProps) {
  const [step, setStep] = useState(1)
  const [isEditing, setIsEditing] = useState(mode === "edit")
  const { updateTrainer, isLoading } = useUpdateTrainer()

  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: {
      firstName: trainer.firstName || "",
      lastName: trainer.lastName || "",
      faydaId: trainer.faydaId || "",
      email: trainer.email || "",
      phoneNumber: trainer.phoneNumber || "",
      gender: trainer.gender as "MALE" | "FEMALE" | "OTHER",
      dateOfBirth: trainer.dateOfBirth ? new Date(trainer.dateOfBirth) : undefined,
      languageId: trainer.language?.id || "",
      academicLevelId: trainer.academicLevel?.id || "",
      experienceYears: trainer.experienceYears || 0,
      trainingTagIds: trainer.trainingTags?.map(tag => tag.id) || [],
      coursesTaught: trainer.coursesTaught || [],
      certifications: trainer.certifications || [],
      
      // Location fields - get full hierarchy from nested data for display
      countryId: trainer.zone?.region?.country?.id || "",
      regionId: trainer.zone?.region?.id || "",
      zoneId: trainer.zone?.id || "",
      cityId: trainer.city?.id || "",
      woreda: trainer.woreda || "",
      houseNumber: trainer.houseNumber || "",
      location: trainer.location || "",
    },
  })

  const onSubmit = async (values: TrainerFormValues) => {
    const formattedDateOfBirth = values.dateOfBirth instanceof Date
      ? values.dateOfBirth.toISOString().split('T')[0]
      : trainer.dateOfBirth;

    const trainerData: CreateTrainerData = {
      faydaId: values.faydaId || trainer.faydaId || "",
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      dateOfBirth: formattedDateOfBirth,
      gender: values.gender || trainer.gender,
      languageId: values.languageId || trainer.language?.id || "1",
      zoneId: values.zoneId || trainer.zone?.id || "",
      cityId: values.cityId || trainer.city?.id || "",
      woreda: values.woreda || trainer.woreda || "",
      houseNumber: values.houseNumber || trainer.houseNumber || "",
      location: values.location || trainer.location,
      academicLevelId: values.academicLevelId,
      trainingTagIds: values.trainingTagIds || [],
      experienceYears: values.experienceYears,
      coursesTaught: values.coursesTaught || [],
      certifications: values.certifications || [],
    };

    try {
      await updateTrainer({ id: trainer.id, data: trainerData });
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Failed to update trainer:", error);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center p-4 overflow-y-auto z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full my-10">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-700">
              {isEditing ? "Edit Trainer" : "Trainer Details"}
            </h1>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {step === 1 && (
                  <TrainerPersonalInfoForm 
                    form={form} 
                    languages={languages}
                    disabled={!isEditing}
                  />
                )}
                
                {step === 2 && (
                  <div>
                    <TrainerProfessionalInfoForm 
                      form={form} 
                      trainingTags={trainingTags} 
                      academicLevels={academicLevels}
                      languages={languages}
                      disabled={!isEditing}
                    />
                    
                    {/* Location Hierarchy Display - Show full location path in view mode */}
                    {!isEditing && (trainer.zone || trainer.city) && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Location Hierarchy</h3>
                        <div className="space-y-2">
                          {/* Full location path */}
                          {trainer.zone?.region?.country && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Country:</span>
                              <span className="ml-2">{trainer.zone.region.country.name}</span>
                            </div>
                          )}
                          {trainer.zone?.region && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Region:</span>
                              <span className="ml-2">{trainer.zone.region.name}</span>
                            </div>
                          )}
                          {trainer.zone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Zone:</span>
                              <span className="ml-2">{trainer.zone.name}</span>
                            </div>
                          )}
                          {trainer.city && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">City:</span>
                              <span className="ml-2">{trainer.city.name}</span>
                            </div>
                          )}
                          {trainer.woreda && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Woreda:</span>
                              <span className="ml-2">{trainer.woreda}</span>
                            </div>
                          )}
                          {trainer.houseNumber && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">House Number:</span>
                              <span className="ml-2">{trainer.houseNumber}</span>
                            </div>
                          )}
                          {trainer.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Additional Location:</span>
                              <span className="ml-2">{trainer.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-4 pt-8">
                  {step === 2 && (
                    <Button 
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="border-gray-400 text-gray-600 px-8"
                    >
                      Back
                    </Button>
                  )}
                  
                  {step === 1 && (
                    <Button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5"
                    >
                      Continue
                    </Button>
                  )}

                  {step === 2 && mode === "view" && !isEditing && (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5"
                    >
                      Edit Trainer
                    </Button>
                  )}

                  {step === 2 && isEditing && (
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
} 