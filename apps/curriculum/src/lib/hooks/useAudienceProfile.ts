/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery} from "@tanstack/react-query"
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

interface AudienceProfileResponse {
  audienceProfile: AudienceProfile | null
  code: string
  message: string
}

export function useAudienceProfile(trainingId: string) {
  return useQuery({
    queryKey: ['audience-profile', trainingId],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const response = await axios.get<any>(
          `${process.env.NEXT_PUBLIC_API}/training/audience-profile/${trainingId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        const audienceProfile = response.data.audienceProfile
        if (!audienceProfile) return null
        
        // Transform the data to handle the naming mismatch
        // API returns specificCoursesList, but frontend expects specificCourseList
        return {
          ...audienceProfile,
          specificCourseList: audienceProfile.specificCoursesList || audienceProfile.specificCourseList || []
        }
      } catch (error: any) {
        return null
      }
    },
    enabled: !!trainingId,
    retry: 1
  })
} 

