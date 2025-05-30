// apps/curriculum/src/app/(company-admin)/[companyId]/training/create-training/MultiStepFormContainer.tsx

import { useState, ReactElement, cloneElement } from "react";
import { useFormContext } from "react-hook-form";
// Import the combined schema directly
import { trainingFormSchema } from "@/types/training-form"; 
import { z } from "zod";

// Derive the type here
type TrainingFormData = z.infer<typeof trainingFormSchema>;

interface StepComponentProps {
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
}

interface MultiStepFormContainerProps {
  children: ReactElement<StepComponentProps>[];
  initialStep?: number;
  onComplete: (data: TrainingFormData) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  onStepChange?: (step: number) => void;
}

export function MultiStepFormContainer({
  children,
  initialStep = 1,
  onComplete,
  onCancel,
  isEditing = false,
  isSubmitting = false,
  onStepChange
}: MultiStepFormContainerProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const { handleSubmit, trigger, formState: { isValid } } = useFormContext<TrainingFormData>();
  
  const childrenArray = Array.isArray(children) ? children : [children];
  const totalSteps = childrenArray.length;
  const currentChild = childrenArray[currentStep - 1];
  
  const handleNext = async () => {
    const fieldsToValidate = getStepFields(currentStep, isEditing);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      if (currentStep < totalSteps) {
        const newStep = currentStep + 1;
        setCurrentStep(newStep);
        onStepChange?.(newStep);
      } else {
        // Final step - submit the form
        handleSubmit(onComplete)();
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Current Step Component */}
      {cloneElement(currentChild, {
        onNext: handleNext,
        onBack: currentStep > 1 ? handleBack : undefined,
        onCancel,
        isEditing,
        isSubmitting: currentStep === totalSteps && isSubmitting
      })}
    </div>
  );
}

// Helper function with the correct validation logic
function getStepFields(step: number, isEditing = false): (keyof TrainingFormData)[] {
  switch (step) {
    case 1:
      return ["title", "rationale"]; // Made trainingTagIds optional
    case 2:
      return ["countryIds", "regionIds", "zoneIds"]; // cityIds is optional
    case 3:
      return ["duration", "durationType", "trainingTypeId", "deliveryMethod"]; 
    case 4:
      return ["ageGroupIds", "economicBackgroundIds", "academicQualificationIds", "totalParticipants"];
    case 5:
      return ["trainingPurposeIds"];
    default:
      return [];
  }
} 