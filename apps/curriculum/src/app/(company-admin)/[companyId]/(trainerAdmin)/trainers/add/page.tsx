"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CreateTrainerData, useAddTrainer, Language, AcademicLevel, TrainingTag } from "@/lib/hooks/useTrainers" // Import types explicitly
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { X } from "lucide-react"
import { TrainerPersonalInfoForm } from "./components/TrainerPersonalInfoForm"
import { TrainerProfessionalInfoForm } from "./components/TrainerProfessionalInfoForm"
import { cn } from "@/lib/utils"

// Define Zod schema - keep all fields, validation will be per step
const trainerFormSchema = z.object({
  // Step 1: Personal Info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  faydaId: z.string().optional(),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }).optional(),
  
  // Step 2: Contact/Location
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  
  // Location fields - hierarchical structure
  countryId: z.string().optional(),
  regionId: z.string().optional(),
  zoneId: z.string().min(1, "Zone is required"),
  cityId: z.string().optional(),
  woreda: z.string().optional(),
  houseNumber: z.string().optional(),
  location: z.string().optional(),
  languageId: z.string().optional(),

  // Professional Info
  academicLevelId: z.string().min(1, "Academic level is required"),
  experienceYears: z.number().min(0, "Experience years must be non-negative").int(),
  trainingTagIds: z.array(z.string()).optional(),
  coursesTaught: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

export type TrainerFormValues = z.infer<typeof trainerFormSchema>;

export default function AddTrainerPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual")
  const [step, setStep] = useState(1) // Track which step of the form we're on

  const {
    languages,
    academicLevels,
    trainingTags,
    addTrainerAsync,
    isLoading
  } = useAddTrainer()

  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      faydaId: "",
      gender: undefined,
      languageId: "",
      email: "",
      phoneNumber: "",
      countryId: "",
      regionId: "",
      zoneId: "",
      cityId: "",
      woreda: "",
      houseNumber: "",
      location: "",
      academicLevelId: "",
      experienceYears: 0,
      trainingTagIds: [],
      coursesTaught: [],
      certifications: [],
      // dateOfBirth will be handled by the date picker component if needed
    },
    mode: "onChange"
  })

  const handleCancel = () => {
    router.back()
  }

  // Validation function to check required fields based on current step
  const validateStep = async () => {
    let isValid = false;
    let fieldsToValidate: (keyof TrainerFormValues)[] = [];

    // Define fields for each step validation
    if (step === 1) {
      fieldsToValidate = ["firstName", "lastName", "email", "phoneNumber", "dateOfBirth"];
    } else if (step === 2) {
      fieldsToValidate = ["academicLevelId", "experienceYears", "zoneId", "languageId"];
    }

    if (fieldsToValidate.length > 0) {
      isValid = await form.trigger(fieldsToValidate);
    } else {
      isValid = true;
    }

    return isValid;
  }

  // Handle "Continue" button
  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setStep(2);
    }
  }

  // Handle "Back" button
  const handleBack = () => {
    setStep(1);
  }

  const onSubmit = async (values: TrainerFormValues) => {
    // console.log("Submitting Trainer form:", values);

    // Fill in default values for optional fields to satisfy API requirements
    const formattedDateOfBirth = values.dateOfBirth instanceof Date
      ? values.dateOfBirth.toISOString().split('T')[0]
      : "2000-01-01"; // Default value

    // Construct the data payload
    const trainerData: CreateTrainerData = {
      firstName: values.firstName,
      lastName: values.lastName,
      faydaId: values.faydaId || "",
      email: values.email,
      phoneNumber: values.phoneNumber,
      dateOfBirth: formattedDateOfBirth,
      gender: values.gender || "OTHER", // Default value
      languageId: values.languageId || "1", // Default value - may need adjustment
      zoneId: values.zoneId,
      cityId: values.cityId || "", // Optional field - can be empty
      woreda: values.woreda || "",
      houseNumber: values.houseNumber || "",
      location: values.location || "Ethiopia", // Default value
      academicLevelId: values.academicLevelId,
      trainingTagIds: values.trainingTagIds || [],
      experienceYears: values.experienceYears,
      coursesTaught: values.coursesTaught || [],
      certifications: values.certifications || [],
    };

    try {
      await addTrainerAsync(trainerData);
      // Only close modal on successful submission
      router.back();
    } catch (error) {
      console.error("Trainer submission failed:", error);
      // Modal stays open on error - error message will be shown via toast from the hook
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center p-4 overflow-y-auto z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full my-10">
        {/* Header with close button */}
        <div className="p-6 pb-0">
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={handleCancel} className="text-gray-500">
              <X className="h-5 w-5" />
              <span className="sr-only">Cancel</span>
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <div 
              className={cn(
                "py-3 px-4 text-base font-medium cursor-pointer",
                activeTab === "manual" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
              )}
              onClick={() => setActiveTab("manual")}
            >
              Manually
            </div>
            <div 
              className={cn(
                "py-3 px-4 text-base font-medium cursor-pointer",
                activeTab === "import" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
              )}
              onClick={() => setActiveTab("import")}
            >
              Import CSV
            </div>
          </div>
          
          {/* Form Title - Changes based on current step */}
          <h1 className="text-2xl font-bold text-gray-700 mb-6">
            {step === 1 ? "Trainer Information" : "Professional Information"}
          </h1>
        </div>

        {/* Form Content */}
        <div className="p-6 pt-0">
          <div className="max-w-4xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {activeTab === "manual" && (
                  <>
                    {step === 1 && (
                      <TrainerPersonalInfoForm form={form} languages={languages || []} />
                    )}
                    
                    {step === 2 && (
                      <TrainerProfessionalInfoForm 
                        form={form} 
                        trainingTags={trainingTags || []} 
                        academicLevels={academicLevels || []}
                        languages={languages || []}
                      />
                    )}
                  </>
                )}
                
                {activeTab === "import" && (
                  <div className="text-center text-gray-500 py-10">
                    Import CSV functionality not implemented yet.
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-4 pt-8">
                  {step === 2 && (
                    <Button 
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      className="border-gray-400 text-gray-600 px-8"
                    >
                      Back
                    </Button>
                  )}
                  
                  {step === 1 ? (
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5"
                      disabled={isLoading}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
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