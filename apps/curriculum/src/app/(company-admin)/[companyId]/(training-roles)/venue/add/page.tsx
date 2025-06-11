"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@/components/ui/form"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { venueSchema, VenueSchema } from "../components/venue-schema"
import { useAddVenue, CreateVenueData } from "@/lib/hooks/useVenue"
import { VenueWizardForm } from "../components/venue-wizard-form"

const defaultValues: VenueSchema = {
  name: "",
  location: "",
  zoneId: "",
  cityId: "",
  woreda: "",
  latitude: undefined,
  longitude: undefined,
  venueRequirements: [],
  seatingCapacity: 1,
  standingCapacity: undefined,
  roomCount: 1,
  totalArea: 1,
  hasAccessibility: false,
  accessibilityFeatures: "",
  hasParkingSpace: false,
  parkingCapacity: undefined,
  isActive: true,
}

// Define step titles
const steps = [
  { id: 1, title: "General Details" },
  { id: 2, title: "Resource Availability" },
  { id: 3, title: "Venue Capacity & Features" },
];

export default function AddVenuePage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const [currentStep, setCurrentStep] = useState(1)

  const { addVenue, isLoading } = useAddVenue()

  const form = useForm<VenueSchema>({
    resolver: zodResolver(venueSchema),
    defaultValues,
    mode: "onChange"
  })

  const handleCancel = () => {
    router.back()
  }

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const onSubmit = async (values: VenueSchema) => {
    console.log("Submitting Venue form:", values);

    // Ensure required numeric fields have valid values
    const seatingCapacity = values.seatingCapacity || 1;
    const roomCount = values.roomCount || 1;
    const totalArea = values.totalArea || 1;

    // Construct the data payload
    const venueData: CreateVenueData = {
      name: values.name,
      location: values.location,
      zoneId: values.zoneId,
      cityId: values.cityId || undefined,
      woreda: values.woreda,
      latitude: values.latitude,
      longitude: values.longitude,
      venueRequirements: values.venueRequirements?.map(req => ({
        equipmentItemId: req.equipmentItemId,
        numericValue: req.numericValue ?? 0,
        remark: req.remark ?? '',
        available: req.available ?? false,
      })),
      seatingCapacity,
      standingCapacity: values.standingCapacity,
      roomCount,
      totalArea,
      hasAccessibility: values.hasAccessibility,
      accessibilityFeatures: values.accessibilityFeatures,
      hasParkingSpace: values.hasParkingSpace,
      parkingCapacity: values.parkingCapacity,
      isActive: values.isActive,
    };

    try {
      await addVenue(venueData);
      router.back(); // Redirect on success to venue list page
    } catch (error) {
      console.error("Venue submission failed:", error);
      // Error handled by the hook's onError usually
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
          
          {/* Form Title - Changes based on current step */}
          <h1 className="text-2xl font-bold text-gray-700 mb-6">
            Add New Venue
          </h1>

          {/* Stepper UI */}
          <div className="mb-6 flex justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${ 
                    currentStep > index + 1 ? 'bg-green-500 text-white' : 
                    currentStep === index + 1 ? 'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-16 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200 '} mx-2`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 pt-0">
          <div className="max-w-4xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <VenueWizardForm
                  form={form} 
                  currentStep={currentStep}
                  steps={steps}
                  nextStep={nextStep}
                  prevStep={prevStep}
                  onSubmit={onSubmit}
                  onCancel={handleCancel}
                  isLoading={isLoading}
                  companyId={companyId}
                  isEditMode={false}
                  initialCountryId=""
                  initialRegionId=""
                />
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
} 