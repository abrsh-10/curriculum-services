/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseDataItem, BaseDataType } from '@/types/base-data';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';
import { getCookie } from '@curriculum-services/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get the response data key based on type
const getResponseKey = (type: BaseDataType) => {
  // Special cases for city and country
  if (type === 'city') return 'cities';
  if (type === 'country') return 'countries';
  if (type === 'disability') return 'disabilties';
  if (type === 'academic-level') return 'academicLevels';
  if (type === 'academic-qualification') return 'academicQualifications';
  if (type === 'age-group') return 'ageGroups';
  if (type === 'alignment-standard') return 'alignmentStandards';
  if (type === 'assessment-type') return 'assessmentTypes';
  if (type === 'business-type') return 'businessTypes';
  if (type === 'company-file-type') return 'companyFileTypes';
  if (type === 'delivery-tool') return 'deliveryTools';
  if (type === 'economic-background') return 'economicBackgrounds';
  if (type === 'education-level') return 'educationLevels';
  if (type === 'industry-type') return 'industryTypes';
  if (type === 'instructional-method') return 'instructionalMethods';
  if (type === 'language') return 'languages';
  if (type === 'learner-level') return 'learnerLevels';
  if (type === 'learner-style-preference') return 'learnerStylePreferences';
  if (type === 'learning-resource-type') return 'learningResourceTypes';
  if (type === 'technological-requirement') return 'technologicalRequirements';
  if (type === 'technology-integration') return 'technologyIntegrations';
  if (type === 'training-purpose') return 'trainingPurposes';
  if (type === 'work-experience') return 'workExperiences';
  if (type === 'trainer-requirement') return 'trainerRequirements';
  if (type === 'marginalized-group') return 'marginalizedGroups';
  if (type === 'training-type') return 'trainingTypes';
  if (type === 'training-tag') return 'trainingTags';
  if (type === 'report-file-type') return 'reportFileTypes';
  if (type==="zone") return "zones";
  if (type==="region") return "regions";
  
  // Default case for other types (fallback to the old pattern just in case)
  const typeStr = type as string;
  return typeStr
    .split('-')
    .map((word: string, index: number) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('') + 's';
};

interface BaseDataOptions {
  type?: 'INSTRUCTOR' | 'LEARNER';
  subType?: 'FORMATIVE' | 'SUMMATIVE' | 'OTHER';
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}

interface ApiResponse {
  code: string;
  message: string;
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
  [key: string]: any; // This allows for the dynamic data key
}

export function useBaseData(type: BaseDataType, options?: BaseDataOptions) {
  const queryClient = useQueryClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const queryKey = ['base-data', type, options?.type, options?.subType, page, pageSize];
  const responseKey = getResponseKey(type);

  // Query for fetching base data
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const token = getCookie('token');
        let url = `/${type}`;

        // Add query parameters if they exist
        const queryParams = [];
        if (options?.type) queryParams.push(`type=${options.type}`);
        if (type === 'assessment-type' && options?.subType) {
          queryParams.push(`sub-type=${options.subType}`);
        }
        // Add pagination parameters
        queryParams.push(`page=${page}`);
        queryParams.push(`page-size=${pageSize}`);

        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }

        const response = await api.get<ApiResponse>(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Get the data from the response using the dynamic key
        const data = response.data[responseKey] || [];

        return {
          data,
          totalItems: response.data.totalElements || data.length,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || page,
          pageSize: response.data.pageSize || pageSize
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status;

        if (statusCode === 401) {
          toast.error('Your session has expired. Please log in again.');
        } else if (statusCode === 403) {
          toast.error('You do not have permission to access this data.');
        } else if (statusCode === 404) {
          toast.error(`${type.replace('-', ' ')} data not found.`);
        } else {
          toast.error(`Error fetching ${type.replace('-', ' ')} data: ${axiosError.message}`);
        }

        throw error;
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: options?.enabled !== false
  });

  // Mutation for adding new base data
  const addMutation = useMutation({
    mutationFn: async (data: Omit<BaseDataItem, 'id'> & {
      countryId?: string;
      range?: string;
      technologicalRequirementType?: string;
      assessmentSubType?: string;
    }) => {
      try {
        const token = getCookie('token');
        const response = await api.post(`/${type}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to add data';
        toast.error(errorMessage);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-data', type] });
      toast.success('Data added successfully');
    },
    onError: (error) => {
      console.log('Add error:', error);
    },
  });

  // Mutation for updating base data
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: {
      id: string;
      data: Partial<BaseDataItem> & {
        countryId?: string;
        range?: string;
        technologicalRequirementType?: string;
        assessmentSubType?: string;
      }
    }) => {
      try {
        const token = getCookie('token');
        const response = await api.patch(`/${type}/${id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to update data';
        toast.error(errorMessage);
        throw error;
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['base-data', type] });
      toast.success(response.message || 'Data updated successfully');
    },
    onError: (error: any) => {
      console.log('Update error:', error);
    },
  });

  // Mutation for deleting base data
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const token = getCookie('token');
        const response = await api.delete(`/${type}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to delete data';
        toast.error(errorMessage);
        throw error;
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['base-data', type] });
      toast.success(response.message || 'Data deleted successfully');
    },
    onError: (error: any) => {
      console.log('Delete error:', error);
    },
  });

  return {
    data: query.data?.data,
    pagination: {
      totalItems: query.data?.totalItems || 0,
      totalPages: query.data?.totalPages || 1,
      currentPage: query.data?.currentPage || page,
      pageSize: query.data?.pageSize || pageSize,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    add: addMutation,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isAddLoading: addMutation.isPending,
    isUpdateLoading: updateMutation.isPending,
    isDeleteLoading: deleteMutation.isPending,
  };
}