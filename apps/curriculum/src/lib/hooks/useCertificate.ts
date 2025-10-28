/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"
import { toast } from "sonner"
import { useMutation, useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query"
import { getCookie } from "@curriculum-services/auth"

// Update interface for creating a certificate
interface CertificateInput {
  issueDate: string;
  traineeIds: string[] // Changed from traineeId to traineeIds to support bulk generation
}

// Full certificate interface including received data
export interface Certificate {
  id: string
  issuingOrganization: string
  issueDate: string
  completionDate: string
  description: string
  creditHours: number
  grade: number
  fileUrl?: string
  trainee?: {
    id: string
    firstName: string
    lastName: string
    email: string
    contactPhone?: string
  }
}

interface CertificateResponse {
  code: string
  certificates: Certificate[]
  message: string
  totalElements?: number
  totalPages?: number
  currentPage?: number
}

interface CertificateQueryParams {
  page?: number
  pageSize?: number
}

// Single certificate response for view page
export interface SingleCertificateResponse {
  code: string
  certificate: {
    id: string
    trainingId: string
    trainingTitle: string
    traineeId: string
    traineeName: string
    traineeContactPhone: string
    fileUrl: string
    issueDate: string
  }
  message: string
}

export function useSubmitCertificate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CertificateInput) => {
      const token = getCookie('token')
      
      // Send all trainee IDs in a single request
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/certificate`,
        {
          issueDate: data.issueDate,
          traineeIds: data.traineeIds
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      return {
        success: true,
        count: data.traineeIds.length,
        data: response.data
      }
    },
    onSuccess: (result, variables) => {
      const count = variables.traineeIds.length
      toast.success(
        count === 1 
          ? 'Certificate generated successfully' 
          : `${count} certificates generated successfully`
      )
      // Invalidate certificates query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['certificates']
      })
      // Invalidate students query to refresh certificate URLs in the table
      queryClient.invalidateQueries({
        queryKey: ['students']
      })
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to generate certificate(s)')
      } else {
        toast.error('Failed to generate certificate(s)')
      }
    }
  })
}

export function useGetCertificates(
  trainingId: string,
  params?: CertificateQueryParams,
  options?: UseQueryOptions<CertificateResponse, Error>
) {
  return useQuery<CertificateResponse, Error>({
    queryKey: ['certificates', trainingId, params],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        if (!token) {
          console.log("No auth token found for certificates fetch");
          throw new Error("Authentication required");
        }
        
        // Build query parameters for pagination
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) {
          queryParams.append('page', params.page.toString());
        }
        if (params?.pageSize !== undefined) {
          queryParams.append('page-size', params.pageSize.toString());
        }
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        
        console.log(`Fetching certificates for training: ${trainingId} with params: ${queryString}`);
        const response = await axios.get<CertificateResponse>(
          `${process.env.NEXT_PUBLIC_API}/certificate/training/${trainingId}${queryString}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        console.log("Certificate API Response:", response.data);
        
        // Add validation to ensure expected data structure
        if (response.data.code !== "OK") {
          console.warn("Certificate API returned non-OK status:", response.data);
        }
        
        return response.data;
      } catch (error) {
        console.log("Error fetching certificates:", error);
        // Still throw the error so React Query can handle it
        throw error;
      }
    },
    ...options,
    // Improve retry behavior
    retry: (failureCount, error) => {
      console.log(`Retry attempt ${failureCount} for certificates`);
      // Only retry network errors, not 404s or other API errors
      if (axios.isAxiosError(error) && !error.response) {
        return failureCount < 3;
      }
      return false;
    }
  })
}

export function useGetCertificateById(
  certificateId: string,
  options?: UseQueryOptions<SingleCertificateResponse, Error>
) {
  return useQuery<SingleCertificateResponse, Error>({
    queryKey: ['certificate', certificateId],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        if (!token) {
          console.log("No auth token found for certificate fetch");
          throw new Error("Authentication required");
        }
        
        console.log(`Fetching certificate: ${certificateId}`);
        const response = await axios.get<SingleCertificateResponse>(
          `${process.env.NEXT_PUBLIC_API}/certificate/${certificateId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        console.log("Certificate API Response:", response.data);
        
        // Validate response structure
        if (response.data.code !== "OK") {
          console.warn("Certificate API returned non-OK status:", response.data);
        }
        
        return response.data;
      } catch (error) {
        console.log("Error fetching certificate:", error);
        throw error;
      }
    },
    enabled: !!certificateId, // Only run query if certificateId exists
    ...options,
    // Retry behavior for network errors only
    retry: (failureCount, error) => {
      console.log(`Retry attempt ${failureCount} for certificate`);
      if (axios.isAxiosError(error) && !error.response) {
        return failureCount < 3;
      }
      return false;
    }
  })
}