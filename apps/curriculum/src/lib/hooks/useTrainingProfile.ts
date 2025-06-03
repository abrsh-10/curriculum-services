/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"

export interface TrainingProfile {
  trainingId: string
  keywords: string[]
  scope: string | null
  attendanceRequirementPercentage?: number | null
  rationale?: string | null
  alignmentsWithStandard?: Array<{id: string, name: string, description: string}> | string[] | string | null
  alignmentStandardIds?: string[] | null
  executiveSummary?: string | null
  deliveryTools?: Array<{id: string, name: string, description: string}> | string[] | null
  deliveryToolIds?: string[] | null
  learnerTechnologicalRequirements?: Array<{id: string, name: string, description: string, technologicalRequirementType?: string}> | string[] | null
  instructorTechnologicalRequirements?: Array<{id: string, name: string, description: string, technologicalRequirementType?: string}> | string[] | null
  technologicalRequirementIds?: string[] | null
  priorKnowledgeList: string[] | null
  learnerStylePreferences?: Array<{id: string, name: string, description: string}> | string[] | null
  learnerStylePreferenceIds?: string[] | null
  professionalBackground: string | null
}

interface TrainingProfileResponse {
  trainingProfile: TrainingProfile | null
  code: string
  message: string
}

export function useTrainingProfile(trainingId: string) {
  return useQuery({
    queryKey: ['training-profile', trainingId],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const response = await axios.get<TrainingProfileResponse>(
          `${process.env.NEXT_PUBLIC_API}/training/training-profile/${trainingId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        return response.data.trainingProfile
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load training profile')
      }
    },
    enabled: !!trainingId
  })
} 