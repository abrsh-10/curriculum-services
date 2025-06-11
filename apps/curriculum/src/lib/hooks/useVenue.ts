import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getCookie } from "@curriculum-services/auth";
import { toast } from "sonner";
import { useBaseData } from "./useBaseData";
import { City } from "./useStudents"; // Reusing City from useStudents



export interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  question: string;
  equipmentItemType: "QUANTITATIVE" | "QUALITATIVE"; // Assuming these are the only types
  needStatusPercentage: number;
  mandatoryPercentage: number;
}

interface VenueRequirementDetail {
  equipmentItem: EquipmentItem;
  numericValue: number;
  remark: string;
  available: boolean;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  city: City;
  zone: string | { id?: string; name?: string }; // Zone can be string or object
  woreda: string;
  latitude: number;
  longitude: number;
  venueRequirementList?: VenueRequirementDetail[]; // Optional for list view
  
  // Step 3: Venue Capacity fields
  seatingCapacity?: number;
  standingCapacity?: number;
  roomCount?: number;
  totalArea?: number;
  hasAccessibility?: boolean;
  accessibilityFeatures?: string;
  hasParkingSpace?: boolean;
  parkingCapacity?: number;
  
  isActive?: boolean;
}

interface VenuesResponse {
  code: string;
  venues: Venue[];
  message: string;

  totalPages?: number;
  pageSize?: number;
  currentPage?: number;
  totalElements?: number;
}

export interface VenueResponse {
    code: string;
    venue: Venue;
    message: string;
}

// New interface for the equipment items list response
interface EquipmentItemsResponse {
  code: string;
  equipmentItems: EquipmentItem[];
  message: string;
}


// --- Interfaces for Mutations ---

export interface VenueRequirementInput {
  equipmentItemId: string;
  numericValue?: number;
  remark?: string;
  available?: boolean;
}

export interface CreateVenueData {
  name: string;
  location: string;
  zoneId: string;
  cityId?: string;
  woreda: string;
  latitude?: number; 
  longitude?: number; 
  venueRequirements?: VenueRequirementInput[];
  
  // Step 3: Venue Capacity fields
  seatingCapacity?: number;
  standingCapacity?: number;
  roomCount?: number;
  totalArea?: number;
  hasAccessibility?: boolean;
  accessibilityFeatures?: string;
  hasParkingSpace?: boolean;
  parkingCapacity?: number;
  
  isActive?: boolean;
}

export type UpdateVenueData = CreateVenueData;


const venueQueryKey = "venues";
const equipmentItemQueryKey = "equipmentItems"; // New query key

// Hook to fetch a list of venues with optional pagination.
export function useVenues(page?: number, pageSize?: number) {
  return useQuery({
    queryKey: [venueQueryKey, page, pageSize],
    queryFn: async (): Promise<VenuesResponse> => {
      try {
        const token = getCookie("token");
        let url = `${process.env.NEXT_PUBLIC_API}/venue`;

        const params = new URLSearchParams();
        if (page !== undefined) {
          const apiPage = page >= 0 ? page + 1 : 1;
          params.append("page", apiPage.toString());
        }
        if (pageSize !== undefined && pageSize > 0) {
          params.append("page-size", pageSize.toString());
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await axios.get<VenuesResponse>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Ensure venues array exists
        if (!response.data.venues) {
          response.data.venues = [];
        }

        // Ensure pagination data exists
        response.data.totalPages = response.data.totalPages || 1;
        response.data.pageSize = response.data.pageSize || pageSize || 10;
        response.data.currentPage = response.data.currentPage || 1;
        response.data.totalElements = response.data.totalElements || response.data.venues.length;

        return response.data;
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        throw new Error(error?.response?.data?.message || "Failed to load venues");
      }
    },
  });
}

// Hook to fetch a single venue by its ID.
export function useVenue(venueId?: string) {
  return useQuery({
    queryKey: [venueQueryKey, venueId],
    queryFn: async (): Promise<VenueResponse> => {
      if (!venueId) {
        throw new Error("Venue ID is required");
      }
      try {
        const token = getCookie("token");
        const response = await axios.get<VenueResponse>(
          `${process.env.NEXT_PUBLIC_API}/venue/${venueId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        throw new Error(error?.response?.data?.message || "Failed to load venue details");
      }
    },
    enabled: !!venueId, // Only run query if venueId is provided
  });
}

/**
 * Hook to fetch a list of equipment items.
 */
export function useEquipmentItems() {
  return useQuery({
    queryKey: [equipmentItemQueryKey],
    queryFn: async (): Promise<EquipmentItem[]> => { // Return just the array
      try {
        const token = getCookie("token");
        const response = await axios.get<EquipmentItemsResponse>(
          `${process.env.NEXT_PUBLIC_API}/equipment-item`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Return only the items array, or an empty array if null/undefined
        return response.data.equipmentItems || [];
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        throw new Error(error?.response?.data?.message || "Failed to load equipment items");
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

// Hook for adding a new venue.
export function useVenueOperations() {
  const queryClient = useQueryClient();
  const { data: cities } = useBaseData("city");
  const { data: equipmentItems } = useEquipmentItems();
  
  // Add venue mutation
  const addVenueMutation = useMutation({
    mutationFn: async (venueData: CreateVenueData) => {
      const token = getCookie("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/venue`,
        venueData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Venue added successfully");
      queryClient.invalidateQueries({ queryKey: [venueQueryKey] });
    },
    onError: (error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.response?.data?.message || "Failed to add venue");
    },
  });

  // Update venue mutation
  const updateVenueMutation = useMutation({
    mutationFn: async ({
      venueId,
      venueData,
    }: {
      venueId: string;
      venueData: UpdateVenueData;
    }) => {
      const token = getCookie("token");
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/venue/${venueId}`,
        venueData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { responseData: response.data, venueId };
    },
    onSuccess: ({ venueId }) => {
      toast.success("Venue updated successfully");
      queryClient.invalidateQueries({ queryKey: [venueQueryKey] });
      queryClient.invalidateQueries({ queryKey: [venueQueryKey, venueId] });
    },
    onError: (error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.response?.data?.message || "Failed to update venue");
    },
  });

  // Delete venue mutation
  const deleteVenueMutation = useMutation({
    mutationFn: async (venueId: string) => {
      const token = getCookie("token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API}/venue/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return venueId;
    },
    onSuccess: (venueId) => {
      toast.success("Venue deleted successfully");
      queryClient.invalidateQueries({ queryKey: [venueQueryKey] });
      queryClient.removeQueries({ queryKey: [venueQueryKey, venueId] });
    },
    onError: (error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.response?.data?.message || "Failed to delete venue");
    },
  });

  // Helper functions that support custom callbacks
  const addVenueWithCallbacks = (
    venueData: CreateVenueData, 
    options?: { onSuccess?: () => void; onError?: (error: unknown) => void }
  ) => {
    addVenueMutation.mutate(venueData, {
      onSuccess: (data) => {
        // Built-in success handling is already done by the mutation's onSuccess
        // Call custom success handler
        options?.onSuccess?.();
      },
      onError: (error) => {
        // Built-in error handling is already done by the mutation's onError
        // Call custom error handler
        options?.onError?.(error);
      }
    });
  };

  const updateVenueWithCallbacks = (
    data: { venueId: string; venueData: UpdateVenueData },
    options?: { onSuccess?: () => void; onError?: (error: unknown) => void }
  ) => {
    updateVenueMutation.mutate(data, {
      onSuccess: (result) => {
        // Built-in success handling is already done by the mutation's onSuccess
        // Call custom success handler
        options?.onSuccess?.();
      },
      onError: (error) => {
        // Built-in error handling is already done by the mutation's onError
        // Call custom error handler
        options?.onError?.(error);
      }
    });
  };

  return {
    cities,
    equipmentItems,
    addVenue: addVenueWithCallbacks,
    updateVenue: updateVenueWithCallbacks,
    deleteVenue: deleteVenueMutation.mutate,
    isAddingVenue: addVenueMutation.isPending,
    isUpdatingVenue: updateVenueMutation.isPending,
    isDeletingVenue: deleteVenueMutation.isPending,
    isLoading: addVenueMutation.isPending || updateVenueMutation.isPending,
    isSuccess: addVenueMutation.isSuccess || updateVenueMutation.isSuccess,
    isError: addVenueMutation.isError || updateVenueMutation.isError,
    error: addVenueMutation.error || updateVenueMutation.error,
  };
}

// Legacy hooks for backward compatibility
export function useAddVenue() {
  const venueOps = useVenueOperations();
  
  return {
    cities: venueOps.cities,
    equipmentItems: venueOps.equipmentItems,
    addVenue: venueOps.addVenue,
    isLoading: venueOps.isAddingVenue,
    isSuccess: venueOps.isSuccess,
    isError: venueOps.isError,
    error: venueOps.error,
  };
}

export function useUpdateVenue() {
  const venueOps = useVenueOperations();
  
  return {
    updateVenue: venueOps.updateVenue,
    isLoading: venueOps.isUpdatingVenue,
    isSuccess: venueOps.isSuccess,
    isError: venueOps.isError,
    error: venueOps.error,
  };
}

export function useDeleteVenue() {
  const venueOps = useVenueOperations();
  
  return {
    deleteVenue: venueOps.deleteVenue,
    isLoading: venueOps.isDeletingVenue,
    isSuccess: venueOps.isSuccess,
    isError: venueOps.isError,
    error: venueOps.error,
  };
}
