"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Training, TrainingUpdateRequest } from "@/types/training"
import axios from "axios"
import { toast } from "sonner"
import { getCookie } from "@curriculum-services/auth"

interface UpdateTrainingResponse {
  code: string
  training: Training
  message: string
}

interface UpdateTrainingData {
  id: string
  data: Record<string, unknown>
}

export function useUpdateTraining() {
  const queryClient = useQueryClient()

  const mutation = useMutation<UpdateTrainingResponse, Error, UpdateTrainingData>({
    mutationFn: async ({ id, data }) => {
      try {
        // Debug the data being sent
        console.log("Training update - sending data:", JSON.stringify(data, null, 2))
        console.log("Disability percentages being sent:", data.disabilityPercentages)
        console.log("Marginalized group percentages being sent:", data.marginalizedGroupPercentages)
        
        const token = getCookie('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_API

        const response = await axios.patch<UpdateTrainingResponse>(
          `${baseUrl}/training/${id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        // Debug the response
        //console.log("Training update - received response:", JSON.stringify(response.data, null, 2))
        
        return response.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || "Failed to update training"
          toast.error("Error", { description: message })
          console.log("Training update - error:", error.response?.data || error.message)
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["trainings"] })
      queryClient.invalidateQueries({ queryKey: ["training", variables.id] })
      toast.success("Training updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update training", {
        description: error.message || "Please try again"
      })
    }
  })
  
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  }
} 