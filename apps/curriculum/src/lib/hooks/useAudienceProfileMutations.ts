"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"

interface BaseItem {
  id: string
  name: string
  description: string
}

interface AudienceProfile {
  id: string
  trainingId: string
  learnerLevel: BaseItem
  language?: BaseItem
  educationLevel?: BaseItem
  specificCourseList?: string[]
  certifications?: string
  licenses?: string
  workExperience?: BaseItem
  specificPrerequisites?: string[]
}

interface AudienceProfileRequest {
  learnerLevelId: string
  languageId?: string
  educationLevelId?: string
  specificCourseList?: string[]
  certifications?: string
  licenses?: string
  workExperienceId?: string
  specificPrerequisites?: string[]
}

interface AudienceProfileResponse {
  audienceProfile: AudienceProfile | null
  code: string
  message: string
}

export function useCreateAudienceProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AudienceProfileRequest) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training/add-audience-profile`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['audience-profile'] 
      })
    }
  })
}

export function useUpdateAudienceProfile(audienceProfileId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: AudienceProfileRequest) => {
      const token = getCookie('token')
      const response = await axios.put<AudienceProfileResponse>(
        `${process.env.NEXT_PUBLIC_API}/training/edit-audience-profile/${audienceProfileId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific audience profile
      queryClient.invalidateQueries({ 
        queryKey: ['audience-profile'] 
      })
      
    },
    onError: (error) => {
      console.log('Failed to update audience profile:', error)
    },
    retry: 1, // Retry once on failure
    retryDelay: 1000 // Wait 1 second before retry
  })
} 