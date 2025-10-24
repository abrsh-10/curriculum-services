/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getCookie } from "@curriculum-services/auth";

interface SyncResponse {
  code?: string;
  message?: string;
}

export function useSyncTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, void>({
    mutationFn: async () => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/training/sync-with-edge`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Training sync triggered successfully");
      // Invalidate lists that may be affected
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      queryClient.invalidateQueries({ queryKey: ["training"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync trainings");
    },
  });

  return {
    syncTraining: mutation.mutate,
    isLoading: mutation.isPending,
  };
}


