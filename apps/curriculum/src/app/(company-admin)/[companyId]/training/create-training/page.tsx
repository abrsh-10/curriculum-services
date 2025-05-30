/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trainingFormSchema, TrainingFormData } from "@/types/training-form";
import { MultiStepFormContainer } from "./MultiStepFormContainer";
import {
  CreateTrainingStep1,
  CreateTrainingStep2,
  CreateTrainingStep3,
  CreateTrainingStep4,
  CreateTrainingStep5,
} from "./components/create-training-forms";
import { useCreateTraining } from "@/lib/hooks/useCreateTraining";
import { SuccessModal } from "./components/modals/success-modal";
import { InviteModal } from "./components/modals/invite-modal";
import { useInviteTrainingUser, RoleType } from "@/lib/hooks/useInviteTrainingUser";

export default function CreateTraining() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [trainingId, setTrainingId] = useState<string>();
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const params = useParams();
  const { createTraining, isLoading } = useCreateTraining();
  const { inviteUser, isLoading: isInviting } = useInviteTrainingUser();

  // Initialize react-hook-form with the combined schema
  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    mode: "onChange", // Validate on change for better UX
    defaultValues: {
      title: "",
      rationale: "", 
      trainingTagIds: [],
      countryIds: [],    // For UI selection flow
      regionIds: [],     // For UI selection flow
      zoneIds: [],       // Required for API
      cityIds: [],       // Optional for API
      duration: 1,
      durationType: "DAYS",
      deliveryMethod: "BLENDED",
      trainingTypeId: "",
      totalParticipants: 0,
      ageGroupIds: [],
      genderPercentages: [
        { gender: "MALE", percentage: 50 },
        { gender: "FEMALE", percentage: 50 }
      ],
      disabilityPercentages: [],
      marginalizedGroupPercentages: [],
      economicBackgroundIds: [],
      academicQualificationIds: [],
      trainingPurposeIds: []
    }
  });

  const handleComplete = (data: TrainingFormData) => {
    // Transform form data to match API expectations
    const transformedData = {
      // Step 1
      title: data.title,
      rationale: data.rationale,
      trainingTagIds: data.trainingTagIds,
      
      // Step 2 - Only send required zone IDs and optional city IDs
      zoneIds: data.zoneIds,
      cityIds: data.cityIds || [],
      
      // Step 3
      duration: data.duration,
      durationType: data.durationType,
      trainingTypeId: data.trainingTypeId,
      deliveryMethod: data.deliveryMethod,
      
      // Step 4
      totalParticipants: data.totalParticipants,
      ageGroupIds: data.ageGroupIds,
      genderPercentages: data.genderPercentages || [],
      economicBackgroundIds: data.economicBackgroundIds,
      academicQualificationIds: data.academicQualificationIds,
      disabilityPercentages: data.disabilityPercentages,
      marginalizedGroupPercentages: data.marginalizedGroupPercentages,
      
      // Step 5
      trainingPurposeIds: data.trainingPurposeIds
    };

    createTraining(transformedData, {
      onSuccess: (response) => {
        setTrainingId(response.training.id);
        setShowSuccessModal(true);
      },
    });
  };

  const handleAssignClick = () => {
    setShowSuccessModal(false);
    setShowInviteModal(true);
  };

  const handleInvite = async (email: string) => {
    if (!trainingId) return;

    inviteUser(trainingId, email, RoleType.CURRICULUM_ADMIN, () => {
      router.push(`/${params.companyId}/training`);
    });
  };

  const handleInviteModalClose = () => {
    setShowInviteModal(false);
    router.push(`/${params.companyId}/training`);
  };

  const handleExit = () => {
    router.back();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push(`/${params.companyId}/training`);
  };

  const handleCancel = () => {
    router.push(`/${params.companyId}/training`);
  };

  return (
    <>
      <FormProvider {...form}>
        <div className="min-h-screen bg-[#FBFBFB]">
          <div className="w-full mx-auto py-8">
            {/* Progress Header */}
            <div className="flex justify-between items-center mb-8 px-10">
              <div className="text-sm text-gray-500">Step {currentStep} of 5</div>
              <button
                onClick={handleExit}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Exit
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-[3px] mb-12">
              <div
                className="h-full bg-brand transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            {/* Form Steps */}
            <div className="w-full mx-auto px-5">
              <MultiStepFormContainer
                onComplete={handleComplete}
                onCancel={handleCancel}
                isSubmitting={isLoading}
                onStepChange={setCurrentStep}
              >
                <CreateTrainingStep1 />
                <CreateTrainingStep2 />
                <CreateTrainingStep3 />
                <CreateTrainingStep4 />
                <CreateTrainingStep5 />
              </MultiStepFormContainer>
            </div>
          </div>
        </div>
      </FormProvider>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onAssignClick={handleAssignClick}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={handleInviteModalClose}
        onInvite={handleInvite}
        isLoading={isInviting}
      />
    </>
  );
}

  