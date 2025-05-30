/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Training } from "@/types/training"
import { CreateTrainingStep1 } from "@/app/(company-admin)/[companyId]/training/create-training/components/steps/step-1"
import { CreateTrainingStep2 } from "@/app/(company-admin)/[companyId]/training/create-training/components/steps/step-2"
import { CreateTrainingStep3 } from "@/app/(company-admin)/[companyId]/training/create-training/components/steps/step-3"
import { CreateTrainingStep4 } from "@/app/(company-admin)/[companyId]/training/create-training/components/steps/step-4"
import { CreateTrainingStep5 } from "@/app/(company-admin)/[companyId]/training/create-training/components/steps/step-5"

import { 
  apiToFormData, 
  formToApiData, 
  TrainingFormData,
  trainingFormSchema
} from "@/types/training-form"

interface OverviewEditProps {
  training: Training
  initialStep?: number
  onSave: (data: Partial<Training>) => void
  onCancel: () => void
}

export function OverviewEdit({ training, initialStep = 1, onSave, onCancel }: OverviewEditProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Convert training data to form format
  const formData = apiToFormData(training)
  
  // Initialize the form with existing training data
  const methods = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      title: formData.title || '',
      rationale: formData.rationale || '',
      trainingTagIds: formData.trainingTagIds || [],
      countryIds: formData.countryIds || [],
      regionIds: [], // Initialize to empty as it's derived from location relationships
      zoneIds: [], // Initialize to empty as it's derived from location relationships  
      cityIds: formData.cityIds || [],
      duration: formData.duration || 1,
      durationType: formData.durationType || 'DAYS',
      deliveryMethod: formData.deliveryMethod || 'ONLINE',
      trainingTypeId: formData.trainingTypeId || '',
      totalParticipants: formData.totalParticipants || 0,
      ageGroupIds: formData.ageGroupIds || [],
      genderPercentages: formData.genderPercentages || [
        { gender: "MALE", percentage: 50 },
        { gender: "FEMALE", percentage: 50 }
      ],
      disabilityPercentages: formData.disabilityPercentages || [],
      marginalizedGroupPercentages: formData.marginalizedGroupPercentages || [],
      economicBackgroundIds: formData.economicBackgroundIds || [],
      academicQualificationIds: formData.academicQualificationIds || [],
      trainingPurposeIds: formData.trainingPurposeIds || []
    }
  })

  const handleStepSubmit = (stepData?: any) => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step - save the form
      handleFinalSubmit()
    }
  }

  const handleFinalSubmit = () => {
    const formValues = methods.getValues()
    console.log("Form values for API:", formValues)
    
    const apiData = formToApiData(formValues)
    console.log("Transformed API data:", apiData)
    
    setIsSubmitting(true)
    
    try {
      onSave(apiData)
    } catch (error) {
      setIsSubmitting(false)
      console.error("Error saving training:", error)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      onCancel()
    }
  }

  const renderCurrentStep = () => {
    const stepProps = {
      onNext: handleStepSubmit,
      onBack: handleBack,
      onCancel,
      isEditing: true,
      isSubmitting: currentStep === 5 ? isSubmitting : false
    }

    switch (currentStep) {
      case 1:
        return <CreateTrainingStep1 {...stepProps} />
      case 2:
        return <CreateTrainingStep2 {...stepProps} />
      case 3:
        return (
          <CreateTrainingStep3
            {...stepProps}
            initialData={{
              duration: formData.duration,
              durationType: formData.durationType,
              deliveryMethod: formData.deliveryMethod,
              trainingTypeId: formData.trainingTypeId || '',
              preloadedTrainingType: formData.preloadedTrainingType,
              preloadedTrainingTypes: formData.preloadedTrainingTypes
            }}
          />
        )
      case 4:
        return (
          <CreateTrainingStep4
            {...stepProps}
            initialData={{
              totalParticipants: formData.totalParticipants,
              ageGroupIds: formData.ageGroupIds || [],
              genderPercentages: formData.genderPercentages || [
                { gender: "MALE", percentage: 50 },
                { gender: "FEMALE", percentage: 50 }
              ],
              disabilityPercentages: formData.disabilityPercentages || [],
              marginalizedGroupPercentages: formData.marginalizedGroupPercentages || [],
              economicBackgroundIds: formData.economicBackgroundIds || [],
              academicQualificationIds: formData.academicQualificationIds || [],
              preloadedAgeGroups: formData.preloadedAgeGroups,
              preloadedDisabilities: formData.preloadedDisabilities,
              preloadedMarginalizedGroups: formData.preloadedMarginalizedGroups,
              preloadedEconomicBackgrounds: formData.preloadedEconomicBackgrounds,
              preloadedAcademicQualifications: formData.preloadedAcademicQualifications
            }}
          />
        )
      case 5:
        return <CreateTrainingStep5 {...stepProps} />
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen">
        <div className="w-full mx-auto py-8">
          <div className="w-full mx-auto px-5">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </FormProvider>
  )
} 