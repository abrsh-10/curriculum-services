/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"

interface TrainingProfile {
  trainingId: string
  keywords: string[]
  scope: string
  rationale: string
  alignmentsWithStandard: string
  executiveSummary: string | null
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
        const token = localStorage.getItem('auth_token')
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