/* eslint-disable @typescript-eslint/no-explicit-any */


import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"

interface GenderRangeCount {
  Female: number
  Male: number
  Unknown: number
}

interface AgeRangeCount {
  "46+": number
  "26-35": number
  "<18": number
  "36-45": number
  "18-25": number
}

export interface TrainingAnalytics {
  trainingId: string
  trainingName: string
  totalTraineeCount: number
  completedTraineeCount: number
  genderRangeCount: GenderRangeCount
  ageRangeCount: AgeRangeCount
}

interface DeliveryMethodCount {
  OFFLINE: number
  ONLINE: number
  SELF_PACED: number
}

export interface SessionAnalytics {
  trainingId: string
  trainingName: string
  totalSessionCount: number
  activeSessionCount: number
  cancelledSessionCount: number
  completedSessionCount: number
  deliveryMethodCount: DeliveryMethodCount
}

interface AnalyticsResponse {
  code: string
  traineeCountPerTraining: TrainingAnalytics[]
  message: string
}

interface SessionAnalyticsResponse {
  code: string
  sessionCountPerTraining: SessionAnalytics[]
  message: string
}

export interface CombinedAnalyticsData {
  traineeCountPerTraining: TrainingAnalytics[]
  sessionCountPerTraining: SessionAnalytics[]
}

export function useAnalytics() {
  const traineeQuery = useQuery({
    queryKey: ['analytics', 'trainee-count'],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        const url = `${process.env.NEXT_PUBLIC_API}/analytics/trainee-count-per-training`
        
        const response = await axios.get<AnalyticsResponse>(
          url,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        return response.data
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load trainee analytics data')
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - analytics don't change frequently
    refetchOnWindowFocus: false, // Don't refetch when user switches tabs
    refetchOnMount: false, // Don't refetch if data is still fresh
  });

  const sessionQuery = useQuery({
    queryKey: ['analytics', 'session-count'],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        const url = `${process.env.NEXT_PUBLIC_API}/analytics/session-count-per-training`
        
        const response = await axios.get<SessionAnalyticsResponse>(
          url,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        return response.data
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load session analytics data')
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - analytics don't change frequently
    refetchOnWindowFocus: false, // Don't refetch when user switches tabs
    refetchOnMount: false, // Don't refetch if data is still fresh
  });

  return {
    data: traineeQuery.data && sessionQuery.data ? {
      traineeCountPerTraining: traineeQuery.data.traineeCountPerTraining,
      sessionCountPerTraining: sessionQuery.data.sessionCountPerTraining,
    } : undefined,
    isLoading: traineeQuery.isLoading || sessionQuery.isLoading,
    error: traineeQuery.error || sessionQuery.error
  };
}
