/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"

interface ObjectiveResponse {
  code: string
  message: string
  generalObjective: {
    id: string
    definition: string
    outcomes: null
  } | null
  specificObjectives: Array<{
    id: string
    definition: string
    outcomes: Array<{
      id: string
      definition: string
    }>
  }>
}

interface ObjectiveData {
  definition: string
  trainingId: string
}

// New bulk create interface
interface BulkCreateObjectiveData {
  trainingId: string
  generalObjective: string
  specificObjectives: Array<{
    specificObjective: string
    outcomes: string[]
  }>
}

// New bulk update interface
interface BulkUpdateObjectiveData {
  generalObjectiveId: string
  generalObjective: string
  specificObjectives: Array<{
    id: string
    specificObjective: string
    outcomes: Array<{
      id: string
      definition: string
    }>
  }>
}

// Hook to fetch objectives
export function useObjective(trainingId: string) {
  return useQuery({
    queryKey: ['objective', trainingId],
    queryFn: async () => {
      const token = getCookie('token')
      const response = await axios.get<ObjectiveResponse>(
        `${process.env.NEXT_PUBLIC_API}/training/objective/${trainingId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      return response.data ? {
        generalObjective: response.data.generalObjective ? {
          id: response.data.generalObjective.id,
          definition: response.data.generalObjective.definition
        } : undefined,
        specificObjectives: response.data.specificObjectives.map(obj => ({
          id: obj.id,
          definition: obj.definition,
          outcomes: obj.outcomes || []
        }))
      } : null
    }
  })
}

export function useBulkCreateObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BulkCreateObjectiveData) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training/add-objective-bulk`,
        data,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['objective', variables.trainingId] 
      })
    }
  })
}

export function useBulkUpdateObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, trainingId }: { data: BulkUpdateObjectiveData, trainingId: string }) => {
      const token = getCookie('token')
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API}/training/edit-objective-bulk`,
        data,
        {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['objective', variables.trainingId] 
      })
    }
  })
}

// Delete objective hook
export function useDeleteObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ objectiveId, trainingId }: { objectiveId: string, trainingId: string }) => {
      const token = getCookie('token')
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/training/delete-objective/${objectiveId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['objective', variables.trainingId] 
      })
    }
  })
}

// Keep the old hooks for backward compatibility if needed elsewhere
export function useCreateObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, isGeneral }: { data: ObjectiveData, isGeneral: boolean }) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training/add-objective?is-objective-general=${isGeneral}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['objective', variables.data.trainingId] 
      })
    }
  })
}

export function useUpdateObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      objectiveId, 
      data, 
      isGeneral 
    }: { 
      objectiveId: string
      data: ObjectiveData
      isGeneral: boolean 
    }) => {
      const token = getCookie('token')
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/training/objective/${objectiveId}?is-objective-general=${isGeneral}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['objective', variables.data.trainingId] 
      })
    }
  })
} 