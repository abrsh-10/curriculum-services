import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface FormStepperProps {
  currentStep: number
  totalSteps?: number // Make totalSteps optional for backward compatibility, default to 5
}

export function FormStepper({ currentStep, totalSteps = 5 }: FormStepperProps) {
  // Add a unique key to force re-render when needed
  const [renderKey, setRenderKey] = useState(Date.now())

  // Force re-render when step changes
  useEffect(() => {
    setRenderKey(Date.now())
  }, [currentStep])

  return (
    <div key={renderKey} className="flex items-center justify-center gap-4 mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        const isLastStep = stepNumber === totalSteps;

        return (
          <div key={stepNumber} className="flex items-center gap-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              isCompleted ? "bg-brand text-white" :
              isActive ? "bg-brand/20 text-brand border border-brand" : "bg-gray-100 text-gray-400 border border-gray-200"
            )}>
              {stepNumber}
            </div>
            {!isLastStep && (
              <div className={cn(
                "h-1 w-12",
                isCompleted ? "bg-brand" : "bg-gray-200"
              )}></div>
            )}
          </div>
        );
      })}
    </div>
  )
} 