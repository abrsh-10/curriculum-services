"use client"

import { useCallback } from "react"
import { UseFormReturn } from "react-hook-form"
import { StudentFormValues } from "../../students/add/components/formSchemas"
import { FormHeader } from "../../students/add/components/FormHeader"
import { FormStepper } from "../../students/add/components/FormStepper"
import { PersonalInfoForm } from "../../students/add/components/PersonalInfoForm"
import { ContactInfoForm } from "../../students/add/components/ContactInfoForm"
import { EducationForm } from "../../students/add/components/EducationForm"
import { EmergencyContactForm } from "../../students/add/components/EmergencyContactForm"
import { AdditionalInfoForm } from "../../students/add/components/AdditionalInfoForm"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Loading } from "@/components/ui/loading"

interface Country {
  id: string
  name: string
  description: string
}

interface Region {
  id: string
  name: string
  description: string
  country: Country
}

interface Zone {
  id: string
  name: string
  description: string
  region: Region
}

interface City {
  id: string
  name: string
  description: string
  zone?: Zone
}

interface Language {
  id: string
  name: string
  description: string
}

interface AcademicLevel {
  id: string
  name: string
  description: string
}

interface Disability {
  id: string
  name: string
  description: string
}

interface MarginalizedGroup {
  id: string
  name: string
  description: string
}

interface StudentFormModalProps {
  form: UseFormReturn<StudentFormValues>
  isOpen: boolean
  onClose: () => void
  step: number
  setStep: (step: number) => void
  isEditing: boolean
  isLoadingStudent: boolean
  isSubmitting: boolean
  validateStep: () => Promise<boolean>
  onSubmit: (values: StudentFormValues) => Promise<void>
  languages: Language[]
  countries: Country[]
  regions: Region[]
  zones: Zone[]
  cities: City[]
  academicLevels: AcademicLevel[]
  disabilities: Disability[]
  marginalizedGroups: MarginalizedGroup[]
}

export function StudentFormModal({
  form,
  isOpen,
  onClose,
  step,
  setStep,
  isEditing,
  isLoadingStudent,
  isSubmitting,
  validateStep,
  onSubmit,
  languages,
  countries,
  regions,
  zones,
  cities,
  academicLevels,
  disabilities,
  marginalizedGroups
}: StudentFormModalProps) {
  const getStepTitle = () => {
    switch (step) {
      case 1: return "Personal Information"
      case 2: return "Contact Information"
      case 3: return "Education & Experience"
      case 4: return "Emergency Contact"
      case 5: return "Additional Information"
      default: return ""
    }
  };

  const handleContinue = useCallback(async () => {
    const isValid = await validateStep();
    if (isValid) {
      setStep(step + 1);
    }
  }, [validateStep, step, setStep]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] my-4 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 pt-6 px-6 md:pt-8 md:px-8 rounded-t-lg">
          <FormHeader 
            onCancel={onClose} 
            isEditing={isEditing}
          />

          {/* Form stepper */}
          <div className="flex justify-center mb-6">
            <FormStepper currentStep={step} totalSteps={5} />
          </div>

          <h1 className="text-xl font-bold text-gray-800 mb-6">
            {getStepTitle()}
          </h1>
        </div>

        <div className="p-6 md:px-8 pt-0 overflow-y-auto flex-grow">
          <div className="max-w-3xl">
            {isEditing && isLoadingStudent ? (
              <Loading />
            ) : (
              <Form {...form}>
                <form className="space-y-8 pb-20">
                  {step === 1 && (
                    <PersonalInfoForm form={form} languages={languages} />
                  )}
                  {step === 2 && (
                    <ContactInfoForm 
                      form={form} 
                      countries={countries}
                      regions={regions}
                      zones={zones}
                      cities={cities} 
                    />
                  )}
                  {step === 3 && (
                    <EducationForm
                      form={form}
                      academicLevels={academicLevels}
                    />
                  )}
                  {step === 4 && <EmergencyContactForm form={form} />}
                  {step === 5 && (
                    <AdditionalInfoForm
                      form={form}
                      disabilities={disabilities}
                      marginalizedGroups={marginalizedGroups}
                    />
                  )}
                </form>
              </Form>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="sticky bottom-0 bg-white z-10 px-6 md:px-8 py-4 border-t">
          <div className="flex justify-between">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            <div
              className={step > 1 ? "ml-auto" : "w-full flex justify-end"}
            >
              {step < 5 ? (
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="bg-brand hover:bg-blue-600 text-white px-8"
                >
                  {step === 4 ? "Next" : "Continue"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  className="bg-brand hover:bg-blue-600 text-white px-8"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? "Submitting..." : isEditing ? "Update" : "Submit"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 