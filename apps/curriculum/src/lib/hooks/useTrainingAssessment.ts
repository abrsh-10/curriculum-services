/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"
import { toast } from "sonner"

// Type definitions
export interface TrainingAssessment {
  id: string
  name: string
  description: string
  fileLink: string
  trainingAssessmentType: 'PRE' | 'POST'
  answerFileLink?: string | null
  comment?: string | null
  sessionId: string | null
  sessionName: string | null
  createdAt?: string
  updatedAt?: string
}

// Add a new type for assessment with student-specific answer data
export interface TrainingAssessmentWithAnswer extends TrainingAssessment {
  answerFileLink: string | null
  comment: string | null
}

export interface CreateTrainingAssessmentData {
  name: string
  description: string
  fileLink: string
  trainingAssessmentType: 'PRE' | 'POST'
}

export interface UpdateTrainingAssessmentData {
  name: string
  description: string
  fileLink: string
  trainingAssessmentType: 'PRE' | 'POST'
}

export interface SubmitAssessmentAnswerData {
  answerFileLink: string
  comment?: string
  traineeId: string
}

export interface AssignSessionData {
  sessionId: string
}

interface TrainingAssessmentsResponse {
  code: string
  trainingAssessment: TrainingAssessment[]
  message: string
}

interface TrainingAssessmentResponse {
  code: string
  trainingAssessment: TrainingAssessment
  message: string
}

/**
 * Hook for fetching training assessments for a specific training
 */
export function useTrainingAssessments(
  trainingId: string, 
  filters?: { type?: string, traineeId?: string },
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true // Default to true if not specified

  return useQuery({
    queryKey: ['training-assessments', trainingId, filters],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const params = new URLSearchParams()
        
        if (filters?.type) {
          params.append('type', filters.type)
        }
        
        if (filters?.traineeId) {
          params.append('traineeId', filters.traineeId)
        }
        
        const queryString = params.toString()
        const url = `${process.env.NEXT_PUBLIC_API}/training-assessment/training/${trainingId}${queryString ? `?${queryString}` : ''}`
        
        const response = await axios.get<TrainingAssessmentsResponse>(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load training assessments')
      }
    },
    enabled: enabled && !!trainingId
  })
}

/**
 * Hook for fetching a single training assessment by ID
 */
export function useTrainingAssessment(assessmentId: string) {
  return useQuery({
    queryKey: ['training-assessment', assessmentId],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const response = await axios.get<TrainingAssessmentResponse>(
          `${process.env.NEXT_PUBLIC_API}/training-assessment/${assessmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        return response.data
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load training assessment')
      }
    },
    enabled: !!assessmentId
  })
}

/**
 * Hook for creating a new training assessment
 */
export function useCreateTrainingAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      trainingId,
      assessmentData
    }: {
      trainingId: string,
      assessmentData: CreateTrainingAssessmentData
    }) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training-assessment/training/${trainingId}`,
        assessmentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, trainingId }
    },
    onSuccess: ({ trainingId }) => {
      toast.success('Training assessment created successfully')
      queryClient.invalidateQueries({ queryKey: ['training-assessments', trainingId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create training assessment')
    }
  })
}

/**
 * Hook for updating an existing training assessment
 */
export function useUpdateTrainingAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      assessmentId,
      assessmentData
    }: {
      assessmentId: string,
      assessmentData: UpdateTrainingAssessmentData
    }) => {
      const token = getCookie('token')
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API}/training-assessment/${assessmentId}`,
        assessmentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, assessmentId }
    },
    onSuccess: ({ assessmentId }) => {
      toast.success('Training assessment updated successfully')
      queryClient.invalidateQueries({ queryKey: ['training-assessment', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['training-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['session-assessments'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update training assessment')
    }
  })
}

/**
 * Hook for deleting a training assessment
 */
export function useDeleteTrainingAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const token = getCookie('token')
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/training-assessment/${assessmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, assessmentId }
    },
    onSuccess: ({ assessmentId }) => {
      toast.success('Training assessment deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['training-assessment', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['training-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['session-assessments'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete training assessment')
    }
  })
}

/**
 * Hook for submitting an assessment answer
 */
export function useSubmitAssessmentAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      assessmentId,
      answerData
    }: {
      assessmentId: string,
      answerData: SubmitAssessmentAnswerData
    }) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training-assessment/${assessmentId}/answer`,
        answerData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, assessmentId, answerData }
    },
    onSuccess: ({ assessmentId, answerData }) => {
      toast.success('Assessment answer submitted successfully')
      // Invalidate all related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['assessment-answers', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['training-assessment', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['training-assessments'] })
      // Also invalidate any queries that might include this trainee's data
      if (answerData.traineeId) {
        queryClient.invalidateQueries({ 
          queryKey: ['training-assessments'],
          predicate: (query) => {
            const filters = query.queryKey[2] as any
            return filters?.traineeId === answerData.traineeId
          }
        })
      }
    },
    onError: (error: any) => {
      console.error('Assessment answer submission error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to submit assessment answer'
      toast.error(errorMessage)
    }
  })
}

/**
 * Hook for assigning an assessment to a session
 */
export function useAssignAssessmentToSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      assessmentId,
      assignData
    }: {
      assessmentId: string,
      assignData: AssignSessionData
    }) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training-assessment/${assessmentId}/assign-session`,
        assignData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, assessmentId, sessionId: assignData.sessionId }
    },
    onSuccess: ({ assessmentId, sessionId }) => {
      toast.success('Assessment assigned to session successfully')
      queryClient.invalidateQueries({ queryKey: ['training-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['session-assessments', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['training-assessment', assessmentId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign assessment to session')
    }
  })
} 