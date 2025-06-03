"use client";

import { useState } from "react";
import { useTrainingProfile } from "@/lib/hooks/useTrainingProfile";
import { DefaultCreate } from "./defaultCreate";
import { TrainingProfileEdit } from "./training-profile/training-profile-edit";
import { TrainingProfileView } from "./training-profile/training-profile-view";
import { Loading } from "@/components/ui/loading";
import { useUserRole } from "@/lib/hooks/useUserRole";

interface TrainingProfileProps {
  trainingId: string;
}

export function TrainingProfile({ trainingId }: TrainingProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: trainingProfile, isLoading } = useTrainingProfile(trainingId);
  const { canEdit, isCompanyAdmin } = useUserRole();

  // Updated empty profile check to account for all possible empty fields
  const isEmptyProfile = !trainingProfile || (
    (Array.isArray(trainingProfile.keywords) && trainingProfile.keywords.length === 0) &&
    (!trainingProfile.scope || trainingProfile.scope === null) &&
    (!trainingProfile.attendanceRequirementPercentage || trainingProfile.attendanceRequirementPercentage === null) &&
    (!trainingProfile.rationale || trainingProfile.rationale === null) &&
    (
      !trainingProfile.alignmentsWithStandard || 
      trainingProfile.alignmentsWithStandard === null ||
      (Array.isArray(trainingProfile.alignmentsWithStandard) && trainingProfile.alignmentsWithStandard.length === 0)
    ) &&
    (!trainingProfile.executiveSummary || trainingProfile.executiveSummary === null) &&
    (
      !trainingProfile.deliveryTools || 
      (Array.isArray(trainingProfile.deliveryTools) && trainingProfile.deliveryTools.length === 0)
    ) &&
    (
      !trainingProfile.learnerTechnologicalRequirements || 
      (Array.isArray(trainingProfile.learnerTechnologicalRequirements) && trainingProfile.learnerTechnologicalRequirements.length === 0)
    ) &&
    (
      !trainingProfile.instructorTechnologicalRequirements || 
      (Array.isArray(trainingProfile.instructorTechnologicalRequirements) && trainingProfile.instructorTechnologicalRequirements.length === 0)
    ) &&
    (
      !trainingProfile.priorKnowledgeList || 
      (Array.isArray(trainingProfile.priorKnowledgeList) && trainingProfile.priorKnowledgeList.length === 0)
    ) &&
    (
      !trainingProfile.learnerStylePreferences || 
      (Array.isArray(trainingProfile.learnerStylePreferences) && trainingProfile.learnerStylePreferences.length === 0)
    ) &&
    (!trainingProfile.professionalBackground || trainingProfile.professionalBackground === null)
  );

  if (isLoading) {
    return <Loading />;
  }

  if (isEditing && canEdit) {
    return (
      <TrainingProfileEdit
        trainingId={trainingId}
        initialData={trainingProfile || null}
        onSave={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  if (isEmptyProfile && canEdit) {
    return (
      <DefaultCreate 
        title="Create Training Profile"
        trainingId={trainingId}
        onCreateClick={() => setIsEditing(true)}
      />
    );
  }

  if (isEmptyProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-gray-500">No training profile available yet.</p>
      </div>
    );
  }

  return (
    <TrainingProfileView 
      trainingProfile={trainingProfile}
      onEdit={() => setIsEditing(true)}
    />
  );
}
