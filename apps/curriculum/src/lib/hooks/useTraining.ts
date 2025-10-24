/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Training } from "@/types/training";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getCookie } from "@curriculum-services/auth";

interface TrainingResponse {
  code: string;
  message: string;
  training: Training;
}

export function useTraining(trainingId: string) {
  return useQuery({
    queryKey: ["training", trainingId],
    queryFn: async () => {
      try {
        const token = getCookie('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await axios.get<TrainingResponse>(
          `${process.env.NEXT_PUBLIC_API}/training/${trainingId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const training = response.data.training;
        // Ensure new DTO fields are present for existing trainings
        return {
          ...training,
          productKey: training.productKey ?? null,
          edgeProduct: training.edgeProduct ?? false,
        };
      } catch (error: any) {
        console.log("Error fetching training:", error);
        throw new Error(
          error?.response?.data?.message || "Failed to load training"
        );
      }
    },
    enabled: !!trainingId,
    retry: 1, 
  });
}
