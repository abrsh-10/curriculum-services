/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"
import { toast } from "sonner"
import { Student } from "./useStudents"

export type DeliveryMethod = "OFFLINE" | "ONLINE" | "SELF_PACED"
export type CompensationType = "PER_HOUR" | "PER_TRAINEES" | "PER_SESSION" 
export type SessionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" | "POSTPONED"
export type DurationType = "HOURS" | "DAYS" | "WEEKS" | "MONTHS"

export interface Lesson {
  id: string
  name: string
  objective: string
  description: string
  duration: number
  durationType: DurationType
  moduleId?: string
}

export interface City {
  id: string
  name: string
  description: string
  country: {
    id: string
    name: string
    description: string
  }
}

export interface TrainingVenue {
  id: string
  name: string
  location: string
  city: City
  zone: string
  woreda: string
  latitude: number
  longitude: number
}

export interface Trainer {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  gender?: string
  dateOfBirth?: string
  language?: { id: string; name: string; description?: string }
  location?: string
  academicLevel?: { id: string; name: string; description?: string }
  trainingTags?: Array<{ id: string; name: string; description?: string }>
  experienceYears?: number
  coursesTaught?: Array<any>
  certifications?: Array<any>
}

export interface Session {
  id: string
  name: string
  cohort?: {
    id: string
    name: string
    description: string
    tags: string[]
    trainingTitle: string
    parentCohortName: string | null
  }
  lessons: Lesson[]
  deliveryMethod: DeliveryMethod
  startDate: string
  endDate: string
  numberOfStudents: number
  trainingVenue: TrainingVenue | null
  meetsRequirement: boolean
  requirementRemark: string
  trainerCompensationType: CompensationType
  trainerCompensationAmount: number
  numberOfAssistantTrainers: number
  assistantTrainerCompensationType: CompensationType
  assistantTrainerCompensationAmount: number
  status: SessionStatus
  incompletionReason: string | null
  fileUrls: string[]
  trainingLink: string | null
  first: boolean
  last: boolean
}

export interface CreateSessionData {
  name: string
  lessonIds: string[]
  deliveryMethod: DeliveryMethod
  startDate: string
  endDate: string
  numberOfStudents: number
  trainingVenueId: string
  meetsRequirement: boolean
  requirementRemark: string
  trainerCompensationType: CompensationType
  trainerCompensationAmount: number
  numberOfAssistantTrainer: number
  assistantTrainerCompensationType: CompensationType
  assistantTrainerCompensationAmount: number
  trainingLink?: string
  isFirst: boolean
  isLast: boolean
}

interface SessionsResponse {
  sessions: Session[]
  code: string
  totalPages: number
  message: string
  totalElements: number
}

interface StudentsResponse {
  code: string
  trainees: Student[]
  totalPages: number
  pageSize: number
  message: string
  currentPage: number
  totalElements: number
}

interface SessionResponse {
  code: string
  session: Session
  message: string
}

interface SessionQueryParams {
  trainingIds?: string[]
  cohortIds?: string[]
  deliveryMethod?: DeliveryMethod
  trainerCompensationType?: CompensationType
  status?: SessionStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

interface CohortSessionQueryParams {
  cohortId: string
  deliveryMethod?: DeliveryMethod
  trainerCompensationType?: CompensationType
  status?: SessionStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

interface SessionTrainersResponse {
  code: string
  trainers: Trainer[]
  message: string
}

interface CreateCohortSessionData extends Omit<CreateSessionData, 'trainingVenueId'> {
  cohortId: string
  trainingVenueId?: string
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const response = await axios.get<SessionResponse>(
          `${process.env.NEXT_PUBLIC_API}/session/${sessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        return response.data.session
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load session details')
      }
    },
    enabled: !!sessionId
  })
}

export function useSessionTrainers(sessionId: string, trainerType: 'MAIN' | 'ASSISTANT') {
  return useQuery({
    queryKey: ['sessionTrainers', sessionId, trainerType],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const response = await axios.get<SessionTrainersResponse>(
          `${process.env.NEXT_PUBLIC_API}/session/${sessionId}/trainers`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { 'trainer-type': trainerType }
          }
        )
        return response.data.trainers
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || `Failed to load ${trainerType.toLowerCase().replace('_', ' ')}s`)
      }
    },
    enabled: !!sessionId && !!trainerType,
    retry: 2
  })
}

export function useSessions(params: SessionQueryParams) {
  return useQuery<SessionsResponse, Error>({
    queryKey: ['sessions', params],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        // Build URL with query parameters
        const url = `${process.env.NEXT_PUBLIC_API}/session`
        
        // Add query parameters
        const queryParams = new URLSearchParams()
        
        // --- Add trainingIds and cohortIds --- 
        params.trainingIds?.forEach(id => {
          queryParams.append('trainingIds', id)
        })
        
        params.cohortIds?.forEach(id => {
          queryParams.append('cohortIds', id)
        })
        
        // Add other optional parameters if provided
        if (params.deliveryMethod) queryParams.append('deliveryMethod', params.deliveryMethod)
        if (params.trainerCompensationType) queryParams.append('trainerCompensationType', params.trainerCompensationType)
        if (params.status) queryParams.append('status', params.status)
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        
        // Make sure page is at least 1 (backend uses 1-based indexing)
        if (params.page !== undefined) {
          const pageNumber = Math.max(1, params.page)
          queryParams.append('page', pageNumber.toString())
        }
        
        if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString())
        
        const response = await axios.get<SessionsResponse>(
          `${url}?${queryParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        return response.data
      } catch (error: any) {
        // Improve error handling
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load sessions';
        console.log("Error fetching sessions:", error);
        throw new Error(errorMessage);
      }
    },
    // Updated enabled logic: Run if either trainingIds or cohortIds are provided
    enabled: (params.trainingIds && params.trainingIds.length > 0) || (params.cohortIds && params.cohortIds.length > 0), 
    retry: 1,
    staleTime: 1000 * 60 * 2, // Cache sessions for 2 minutes
    refetchOnWindowFocus: false,
  })
}

export function useAddSession() {
  // Get query client instance
  const queryClient = useQueryClient()

  // Mutation for adding a session to a training
  const addSessionMutation = useMutation({
    mutationFn: async ({ 
      trainingId, 
      sessionData 
    }: { 
      trainingId: string, 
      sessionData: CreateSessionData 
    }) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/session`,
        sessionData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, trainingId }
    },
    onSuccess: ({ trainingId }) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', { trainingIds: [trainingId] }] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add session')
    }
  })

  return {
    addSession: addSessionMutation.mutate,
    isLoading: addSessionMutation.isPending
  }
}

// New hook for adding sessions to cohorts
export function useAddCohortSession() {
  const queryClient = useQueryClient()

  const addCohortSessionMutation = useMutation({
    mutationFn: async ({ 
      cohortId, 
      sessionData 
    }: { 
      cohortId: string, 
      sessionData: CreateCohortSessionData 
    }) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/session`,
        sessionData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, cohortId }
    },
    onSuccess: ({ cohortId }) => {
      queryClient.invalidateQueries({ queryKey: ['cohortSessions', { cohortId }] })
      queryClient.invalidateQueries({ queryKey: ['sessions', { cohortIds: [cohortId] }] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add session')
    }
  })

  return {
    addCohortSession: addCohortSessionMutation.mutate,
    isLoading: addCohortSessionMutation.isPending
  }
}

// Update session
export function useUpdateSession() {
  const queryClient = useQueryClient()

  const updateSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      sessionData 
    }: { 
      sessionId: string, 
      sessionData: Partial<CreateSessionData> | Partial<CreateCohortSessionData>
    }) => {
      const token = getCookie('token')
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/session/${sessionId}`,
        sessionData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, sessionId }
    },
    onSuccess: ({ sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohortSessions'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update session')
    }
  })

  return {
    updateSession: updateSessionMutation.mutate,
    isLoading: updateSessionMutation.isPending
  }
}

// New hook specifically for cohort sessions
export function useCohortSessions(params: CohortSessionQueryParams) {
  return useQuery<SessionsResponse, Error>({
    queryKey: ['cohortSessions', params],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        // Use the new endpoint format: /api/session/{cohortId}
        const url = `${process.env.NEXT_PUBLIC_API}/session/cohort/${params.cohortId}`
        
        // Add query parameters
        const queryParams = new URLSearchParams()
        
        // Add other optional parameters if provided
        if (params.deliveryMethod) queryParams.append('deliveryMethod', params.deliveryMethod)
        if (params.trainerCompensationType) queryParams.append('trainerCompensationType', params.trainerCompensationType)
        if (params.status) queryParams.append('status', params.status)
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        
        // Make sure page is at least 1 (backend uses 1-based indexing)
        if (params.page !== undefined) {
          const pageNumber = Math.max(1, params.page)
          queryParams.append('page', pageNumber.toString())
        }
        
        if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString())
        
        // Append query parameters if any exist
        const finalUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url
        
        const response = await axios.get<SessionsResponse>(
          finalUrl,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        return response.data
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load cohort sessions';
        console.log("Error fetching cohort sessions:", error);
        throw new Error(errorMessage);
      }
    },
    enabled: !!params.cohortId, 
    retry: 1,
    staleTime: 1000 * 60 * 2, // Cache sessions for 2 minutes
    refetchOnWindowFocus: false,
  })
}

// Delete session hook
export function useDeleteSession() {
  const queryClient = useQueryClient()

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const token = getCookie('token')
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/session/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, sessionId }
    },
    onSuccess: ({ sessionId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohortSessions'] })
      
      toast.success('Session deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete session')
    }
  })

  return {
    deleteSession: deleteSessionMutation.mutate,
    isDeleting: deleteSessionMutation.isPending
  }
}

// Assign trainer to session(s) hook
export interface AssignTrainerData {
  assignmentType: 'MAIN' | 'ASSISTANT'
  sessionIds: string[]
  trainerId: string
}

interface AssignTrainerResponse {
  code: string
  message: string
}

export function useAssignTrainerToSession() {
  const queryClient = useQueryClient()

  const assignTrainerMutation = useMutation({
    mutationFn: async (data: AssignTrainerData) => {
      const token = getCookie('token')
      const response = await axios.post<AssignTrainerResponse>(
        `${process.env.NEXT_PUBLIC_API}/session/assign-trainer`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, sessionIds: data.sessionIds }
    },
    onSuccess: ({ sessionIds }) => {
      // Invalidate session trainers queries for all affected sessions
      sessionIds.forEach(sessionId => {
        queryClient.invalidateQueries({ queryKey: ['sessionTrainers', sessionId] })
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      })
      
      // Invalidate sessions list queries
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohortSessions'] })
      
      toast.success(`Trainer assigned successfully to ${sessionIds.length} session${sessionIds.length > 1 ? 's' : ''}`)
    },
    onError: (error: any) => {
      console.log("Error assigning trainer:", error)
      toast.error(error.response?.data?.message || 'Failed to assign trainer to session')
    }
  })

  return {
    assignTrainer: assignTrainerMutation.mutate,
    assignTrainerAsync: assignTrainerMutation.mutateAsync,
    isLoading: assignTrainerMutation.isPending,
    isSuccess: assignTrainerMutation.isSuccess,
    isError: assignTrainerMutation.isError,
    error: assignTrainerMutation.error,
  }
}

