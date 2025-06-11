import { useState, useEffect, memo, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"


import { venueSchema, VenueSchema } from "./venue-schema"
import { useAddVenue, useUpdateVenue, Venue, CreateVenueData, VenueResponse } from "@/lib/hooks/useVenue"
import { VenueWizardForm } from "./venue-wizard-form"

interface VenueWizardProps {
  companyId: string
  onSuccess: () => void
  onCancel: () => void
  venue?: Venue | null
  venueDetails?: VenueResponse
}

// Define step titles
const steps = [
  { id: 1, title: "General Details" },
  { id: 2, title: "Resource Availability" },
  { id: 3, title: "Venue Capacity & Features" },
];

const defaultValues: VenueSchema = {
  name: "",
  location: "",
  zoneId: "",
  cityId: "",
  woreda: "",
  latitude: undefined,
  longitude: undefined,
  venueRequirements: [],
  seatingCapacity: undefined as unknown as number,
  standingCapacity: undefined,
  roomCount: undefined as unknown as number,
  totalArea: undefined as unknown as number,
  hasAccessibility: false,
  accessibilityFeatures: "",
  hasParkingSpace: false,
  parkingCapacity: undefined,
  isActive: true,
}

export const VenueWizard = memo(function VenueWizard({ 
  companyId, 
  onSuccess, 
  onCancel, 
  venue, 
  venueDetails 
}: VenueWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const { addVenue, isLoading: isAddingVenue } = useAddVenue()
  const { updateVenue, isLoading: isUpdatingVenue } = useUpdateVenue()
  
  const isLoading = isAddingVenue || isUpdatingVenue
  const isEditMode = !!venue

  // Initialize form with values based on edit or add mode
  const form = useForm<VenueSchema>({
    resolver: zodResolver(venueSchema),
    defaultValues: useMemo(() => {
      // Use detailed venue data if available, otherwise fall back to basic venue data
      const venueData = venueDetails?.venue || venue;
      
      if (!venueData) return defaultValues
      
      // Handle zone ID extraction - zone can be string or object
      let zoneId = "";
      if (venueData.zone) {
        if (typeof venueData.zone === 'string') {
          zoneId = venueData.zone;
        } else {
          zoneId = venueData.zone.id || "";
        }
      }
      
      return {
        name: venueData.name || "",
        location: venueData.location || "",
        zoneId,
        cityId: venueData.city?.id || "",
        woreda: venueData.woreda || "",
        latitude: venueData.latitude,
        longitude: venueData.longitude,
        venueRequirements: venueData.venueRequirementList?.map(req => ({
          equipmentItemId: req.equipmentItem.id,
          numericValue: req.numericValue,
          remark: req.remark || "",
          available: req.available,
        })) || [],
        seatingCapacity: venueData.seatingCapacity || 1,
        standingCapacity: venueData.standingCapacity,
        roomCount: venueData.roomCount || 1,
        totalArea: venueData.totalArea || 1,
        hasAccessibility: venueData.hasAccessibility || false,
        accessibilityFeatures: venueData.accessibilityFeatures || "",
        hasParkingSpace: venueData.hasParkingSpace || false,
        parkingCapacity: venueData.parkingCapacity,
        isActive: venueData.isActive ?? true,
      }
    }, [venue, venueDetails]),
    mode: "onChange",
  })

  // Reset step when venue changes, but only when not in edit mode
  useEffect(() => {
    // If it's a new venue (not edit mode), reset to step 1
    // If editing an existing venue, don't reset the step
    if (!venue) {
      setCurrentStep(1)
    }
  }, [venue])

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

  // Handle form submission
  const onSubmit = (values: VenueSchema) => {
    // Ensure required numeric fields have valid values
    const seatingCapacity = values.seatingCapacity || 1;
    const roomCount = values.roomCount || 1;
    const totalArea = values.totalArea || 1;

    const formattedData: CreateVenueData = {
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
    
    if (isEditMode && venue) {
      updateVenue({ venueId: venue.id, venueData: formattedData }, {
        onSuccess: () => {
          // Only call onSuccess when the API operation actually succeeds
          onSuccess()
        },
        onError: (error) => {
          // Keep modal open on error - toast notification is handled by the hook
          console.error('Update venue failed:', error);
        }
      })
    } else {
      addVenue(formattedData, {
        onSuccess: () => {
          // Only call onSuccess when the API operation actually succeeds
          onSuccess()
        },
        onError: (error) => {
          // Keep modal open on error - toast notification is handled by the hook
          console.error('Add venue failed:', error);
        }
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
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

      {/* Form Content Area */}
      <div className="flex-1 min-h-0">
        <VenueWizardForm
          form={form} 
          currentStep={currentStep}
          steps={steps}
          nextStep={nextStep}
          prevStep={prevStep}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
          companyId={companyId}
          isEditMode={isEditMode}
          initialCountryId={venueDetails?.venue?.city?.zone?.region?.country?.id || venue?.city?.zone?.region?.country?.id || ""}
          initialRegionId={venueDetails?.venue?.city?.zone?.region?.id || venue?.city?.zone?.region?.id || ""}
        />
      </div>
    </div>
  )
}) 