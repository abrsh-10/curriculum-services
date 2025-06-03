"use client"

import { useState } from "react"
import { useAudienceProfile } from "@/lib/hooks/useAudienceProfile"
import { DefaultCreate } from "./defaultCreate"
import { AudienceProfileEdit } from "./audience-profile/audience-profile-edit"
import { AudienceProfileView } from "./audience-profile/audience-profile-view"
import { Loading } from "@/components/ui/loading"
import { useBaseData } from "@/lib/hooks/useBaseData"
import { useUserRole } from "@/lib/hooks/useUserRole"

interface BaseItem {
  id: string
  name: string
  description: string
}



interface AudienceProfileProps {
  trainingId: string
}

export function AudienceProfile({ trainingId }: AudienceProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { data: audienceProfile, isLoading } = useAudienceProfile(trainingId)
  const { data: learnerLevels, isLoading: isLoadingLearnerLevels } = useBaseData('learner-level')
  
  // Fetch data for prerequisites
  const { data: educationLevels, isLoading: isLoadingEducationLevels } = useBaseData('education-level')
  const { data: languages, isLoading: isLoadingLanguages } = useBaseData('language')
  const { data: workExperiences, isLoading: isLoadingWorkExperiences } = useBaseData('work-experience')
  
  const { canEdit } = useUserRole()

  const isEmptyProfile = !audienceProfile || !audienceProfile.learnerLevel?.id

  if (isLoading || isLoadingLearnerLevels || isLoadingEducationLevels || 
      isLoadingLanguages || isLoadingWorkExperiences) {
    return <Loading />
  }

  if (isEditing && canEdit) {
    return (
      <AudienceProfileEdit
        trainingId={trainingId}
        initialData={audienceProfile || null}
        learnerLevels={learnerLevels || []}
        educationLevels={educationLevels || []}
        languages={languages || []}
        workExperiences={workExperiences || []}
        onSave={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  if (isEmptyProfile && canEdit) {
    return (
      <DefaultCreate 
        title="Create Audience Profile"
        trainingId={trainingId}
        onCreateClick={() => setIsEditing(true)}
      />
    )
  }

  if (isEmptyProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-gray-500">No audience profile available yet.</p>
      </div>
    )
  }

  return (
    <AudienceProfileView 
      audienceProfile={audienceProfile}
      onEdit={() => setIsEditing(true)}
      showEditButton={canEdit}
    />
  )
}