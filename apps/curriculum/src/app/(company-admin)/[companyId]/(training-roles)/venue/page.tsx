"use client"

import { useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useVenues, useDeleteVenue, Venue } from "@/lib/hooks/useVenue";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from 'next/image'
import { useDebounce } from "@/lib/hooks/useDebounce";
import { createVenueColumns } from "./components/venue-columns";
import { VenueDataTable } from "./components/venue-data-table";

// TODO: Implement pagination controls
const DEFAULT_PAGE_SIZE = 20;

export default function VenuePage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params.companyId as string;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [zone, setZone] = useState<string>();

    const { data, isLoading, error } = useVenues(page - 1, pageSize);
    const { deleteVenue, isLoading: isDeleting } = useDeleteVenue();

    const venues = data?.venues || [];

    const handleFilterApply = useCallback(({
        selectedStatus,
    }: {
        selectedStatus?: string
    }) => {
        setZone(selectedStatus);
        setPage(1);
    }, []);

    // Handle page size change
    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(1); // Reset to first page when changing page size
    }, []);

    // Filter venues based on search query
    const filteredVenues = useMemo(() => 
        data?.venues.filter(venue =>
            venue.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
            (!zone || venue.zone === zone)
        ) || [], 
    [data?.venues, debouncedSearch, zone]);

    // Handle venue edit
    const handleEditVenue = useCallback((venue: Venue) => {
        // TODO: Implement edit functionality - navigate to edit route
        console.log("Edit venue:", venue);
    }, []);

    // Handle venue deletion
    const handleDeleteVenue = useCallback((venueId: string) => {
        deleteVenue(venueId, {
            onSuccess: () => {
                router.refresh();
            }
        });
    }, [deleteVenue, router]);

    // Navigate to add venue page
    const handleAddVenue = useCallback(() => {
        router.push(`/${companyId}/venue/add`);
    }, [router, companyId]);

    // Create venue columns with edit and delete handlers
    const venueColumns = useMemo(() => createVenueColumns({
        onEdit: handleEditVenue,
        onDelete: handleDeleteVenue,
    }), [handleEditVenue, handleDeleteVenue]);

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="flex lg:px-16 md:px-14 px-4 w-full">
                <div className="flex-1 py-4 md:pl-12 min-w-0">
                    <h1 className="text-lg font-normal mb-6">Venues</h1>
                    <div className="text-center py-20 bg-gray-50 rounded-lg border">
                        <h3 className="text-lg font-medium mb-2">Error Loading Venues</h3>
                        <p className="text-gray-500 text-sm">
                            There was a problem loading the venues. Please try again later.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoading && venues.length === 0 && searchQuery === "") {
        return (
            <div className="flex lg:px-16 md:px-14 px-4 w-full">
                <div className="flex-1 py-4 md:pl-12 min-w-0">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-lg font-normal">Venues</h1>
                        <Button
                            onClick={handleAddVenue}
                            className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Venue</span>
                        </Button>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center py-40 bg-gray-50 rounded-lg border">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No Venues Added Yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by adding a new training venue.
                        </p>
                        <div className="mt-6">
                            <Button
                                onClick={handleAddVenue}
                                className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add Your First Venue</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex lg:px-16 md:px-14 px-4 w-full">
            <div className="flex-1 py-4 md:pl-12 min-w-0">
                <h1 className="text-lg font-normal mb-6">Venues</h1>

                <div className="flex items-center lg:justify-end gap-3 mb-6">
                    <div className="relative md:w-[300px]">
                        <Image
                            src="/search.svg"
                            alt="Search"
                            width={19}
                            height={19}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 z-10"
                        />
                        <Input
                            placeholder="Search venues..."
                            className="pl-10 h-10 bg-white border-gray-200 rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleAddVenue}
                        className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Venue</span>
                    </Button>
                </div>

                <VenueDataTable
                    columns={venueColumns}
                    data={filteredVenues}
                    isLoading={isLoading}
                    pagination={{
                        totalPages: data?.totalPages || 1,
                        currentPage: page,
                        setPage,
                        pageSize,
                        setPageSize: handlePageSizeChange,
                        totalElements: data?.totalElements || 0,
                    }}
                    onEdit={handleEditVenue}
                    onDelete={handleDeleteVenue}
                />
            </div>
        </div>
    );
}