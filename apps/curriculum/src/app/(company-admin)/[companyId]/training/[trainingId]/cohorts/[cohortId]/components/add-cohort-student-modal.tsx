"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Filter, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudents, useAddStudent, StudentFilters } from '@/lib/hooks/useStudents';
import { useSingleCascadingLocation } from '@/lib/hooks/useCascadingLocation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Loading } from '@/components/ui/loading';
import { StudentDataTable } from '../../../components/students/student-data-table';
import { modalStudentColumns } from '../../../components/students/modal-student-columns';
import { RowSelectionState } from '@tanstack/react-table';
import { useAddTraineesToCohort } from '@/lib/hooks/useCohorts';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

// Type definitions for location data
interface Country {
  id: string;
  name: string;
  description: string;
}

interface Region {
  id: string;
  name: string;
  description: string;
  country: Country;
}

interface Zone {
  id: string;
  name: string;
  description: string;
  region: Region;
}

interface Language {
  id: string;
  name: string;
  description: string;
}

interface AcademicLevel {
  id: string;
  name: string;
  description: string;
}

interface AddCohortStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  trainingId: string;
  companyId: string;
  assignedStudentIds: string[];
}

const genderOptions = [
  { id: "MALE", label: "Male" },
  { id: "FEMALE", label: "Female" }
];

// Multiple Select Component for zones, languages, and academic levels
interface MultipleSelectProps {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}

function MultipleSelect({ options, selected, onChange, placeholder, disabled = false }: MultipleSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (optionId: string) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter(id => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const option = options.find(opt => opt.id === selected[0]);
      return option?.name || '';
    }
    return `${selected.length} selected`;
  };

  const hasSelection = selected.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          hasSelection && "border-blue-500 bg-blue-50 text-blue-700"
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <span className="ml-1">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="max-h-[250px] overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle(option.id);
                  }}
                >
                  <Checkbox
                    id={`select-${option.id}`}
                    checked={selected.includes(option.id)}
                    onCheckedChange={() => handleToggle(option.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label 
                    htmlFor={`select-${option.id}`}
                    className="text-sm font-normal cursor-pointer flex-1 truncate"
                    title={option.name}
                  >
                    {option.name}
                  </Label>
                </div>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-gray-500">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddCohortStudentModalComponent({ 
  isOpen,
  onClose,
  cohortId,
  trainingId,
  companyId,
  assignedStudentIds 
}: AddCohortStudentModalProps) {

  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const debouncedModalSearch = useDebounce(modalSearchQuery, 500);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filters, setFilters] = useState<StudentFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states for inline form
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>([]);
  const [selectedAcademicLevelIds, setSelectedAcademicLevelIds] = useState<string[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  
  // Location cascading states
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  
  // Get mutation hook for adding trainees to cohort
  const { addTrainees, isLoading: isAssigning } = useAddTraineesToCohort();

  // Get base data for filters
  const {
    languages,
    academicLevels,
  } = useAddStudent();
  
  // Get location data from cascading hook
  const {
    countries,
    regions,
    zones
  } = useSingleCascadingLocation(selectedCountryId, selectedRegionId);

  // Remove client-side filtering - we'll get properly filtered data from the hook
  const availableRegions = useMemo(() => {
    return regions || [];
  }, [regions]);

  const availableZones = useMemo(() => {
    return zones || [];
  }, [zones]);

  // Handle cascading selection changes
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    // Clear dependent selections
    setSelectedRegionId("");
    setSelectedZoneIds([]);
  };

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId);
    // Clear dependent selections
    setSelectedZoneIds([]);
  };

  // Fetch students for the training with filters
  const { 
    data: studentData, 
    isLoading: isLoadingStudents, 
    error: studentError 
  } = useStudents(trainingId, modalPage, modalPageSize, undefined, true, debouncedModalSearch, filters);

  // Filter out already assigned students
  const availableStudents = useMemo(() => {
    const allFetchedStudents = studentData?.trainees || [];
    return allFetchedStudents.filter(student => !assignedStudentIds.includes(student.id));
  }, [studentData, assignedStudentIds]);

  // Pagination and Selection Logic
  const totalAvailableElements = availableStudents.length;
  const totalStudentElements = studentData?.totalElements || totalAvailableElements;
  const totalStudentPages = Math.ceil(totalStudentElements / modalPageSize);

  const selectedStudentIds = useMemo(() => {
      // rowSelection keys are already student IDs (not indices) because StudentDataTable uses getRowId
      return Object.keys(rowSelection).filter(id => rowSelection[id]);
  }, [rowSelection]);

  const handleModalPageSizeChange = useCallback((newPageSize: number) => {
      setModalPageSize(newPageSize);
      setModalPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setModalSearchQuery(e.target.value);
  }, []);

  const handleApplyFilters = useCallback(() => {
    const newFilters: StudentFilters = {};
    
    if (selectedGenders.length > 0) newFilters.genders = selectedGenders;
    if (selectedLanguageIds.length > 0) newFilters.languageIds = selectedLanguageIds;
    if (selectedAcademicLevelIds.length > 0) newFilters.academicLevelIds = selectedAcademicLevelIds;
    if (selectedZoneIds.length > 0) newFilters.zoneIds = selectedZoneIds;

    setFilters(newFilters);
    setModalPage(1); // Reset to first page when filters change
    setShowFilters(false); // Collapse filters after applying
  }, [selectedGenders, selectedLanguageIds, selectedAcademicLevelIds, selectedZoneIds]);

  const handleClearFilters = useCallback(() => {
    setSelectedGenders([]);
    setSelectedLanguageIds([]);
    setSelectedAcademicLevelIds([]);
    setSelectedZoneIds([]);
    setSelectedCountryId("");
    setSelectedRegionId("");
    setFilters({});
    setModalPage(1);
    setShowFilters(false);
  }, []);

  const handleGenderToggle = useCallback((checked: boolean, gender: string) => {
    setSelectedGenders(prev =>
      checked ? [...prev, gender] : prev.filter(item => item !== gender)
    );
  }, []);

  // Function to handle assigning selected students to cohort
  const handleAssignStudents = useCallback(async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("No students selected");
      return;
    }
    
    try {
      // Call the API to add trainees to the cohort
      addTrainees({
        cohortId,
        traineeIds: selectedStudentIds,
        trainingId // Pass the trainingId to ensure training-level student queries are invalidated
      }, {
        onSuccess: () => {
          setRowSelection({}); // Clear selection
          onClose(); // Close modal on success - this will trigger refetch in parent
        }
      });
    } catch (err) {
      console.error("Failed to assign students to cohort:", err);
    }
  }, [selectedStudentIds, addTrainees, cohortId, trainingId, onClose]);

  // Effect to clear selection when modal closes/reopens
  useEffect(() => {
      if (isOpen) {
        setRowSelection({});
      }
  }, [isOpen])

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ).length;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col max-h-[80vh]">
        {/* Header Section (Fixed) */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
           <DialogHeader className="mb-4">
             <DialogTitle className="text-lg font-semibold text-[#1B2128]">Add Students to Cohort</DialogTitle>
           </DialogHeader>
           
           {/* Search, Filter, and Add Button Row */} 
           <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4 flex-grow">
               <div className="relative md:w-[300px]">
                 <Search className="absolute text-sm left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                 <Input
                     placeholder="Search students..."
                     className="pl-10 h-10 text-sm bg-white border-gray-300 rounded-lg"
                     value={modalSearchQuery}
                     onChange={handleSearchChange}
                 />
               </div>
               <Button
                 variant="outline"
                 onClick={() => setShowFilters(!showFilters)}
                 className={cn(
                   "flex items-center gap-2 border-gray-300 text-[#344054] h-10 whitespace-nowrap",
                   activeFiltersCount > 0 && "border-blue-500 text-blue-600 bg-blue-50"
                 )}
               >
                 <Filter className="h-4 w-4" />
                 <span>
                   Filters
                   {activeFiltersCount > 0 && <span className="ml-1">({activeFiltersCount})</span>}
                 </span>
                 {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
             </div>
             {/* Add Button */}
             <Button 
               type="button" 
               onClick={handleAssignStudents} 
               disabled={selectedStudentIds.length === 0 || isAssigning} 
               className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10 flex-shrink-0"
             >
               {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               Add {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} ` : ''}Student{selectedStudentIds.length === 1 ? '' : 's'}
             </Button>
           </div>

           {/* Collapsible Filter Section */}
           {showFilters && (
             <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 
                 {/* Gender Filter */}
                 <div className="space-y-2">
                   <Label className="text-sm font-medium">Gender</Label>
                   <div className="space-y-2">
                     {genderOptions.map((gender) => (
                       <div key={gender.id} className="flex items-center space-x-2">
                         <Checkbox
                           id={`modal-${gender.id}`}
                           checked={selectedGenders.includes(gender.id)}
                           onCheckedChange={(checked) => 
                             handleGenderToggle(checked as boolean, gender.id)
                           }
                           className="h-4 w-4 rounded border-gray-300"
                         />
                         <Label 
                           htmlFor={`modal-${gender.id}`}
                           className="text-sm font-normal"
                         >
                           {gender.label}
                         </Label>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Location Filters */}
                 <div className="space-y-2">
                   <Label className="text-sm font-medium">Location</Label>
                   
                   {/* Country Selection */}
                   <Select 
                     value={selectedCountryId} 
                     onValueChange={handleCountryChange}
                   >
                     <SelectTrigger className="h-9 text-sm">
                       <SelectValue placeholder="Select country" />
                     </SelectTrigger>
                     <SelectContent>
                       {countries && (countries as Country[]).map((country: Country) => (
                         <SelectItem key={country.id} value={country.id}>
                           {country.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   {/* Region Selection */}
                   <Select 
                     value={selectedRegionId} 
                     onValueChange={handleRegionChange}
                     disabled={!selectedCountryId}
                   >
                     <SelectTrigger className="h-9 text-sm">
                       <SelectValue placeholder={!selectedCountryId ? "Select country first" : "Select region"}>
                         <span className="truncate block">{selectedRegionId ? availableRegions.find(r => r.id === selectedRegionId)?.name : ""}</span>
                       </SelectValue>
                     </SelectTrigger>
                     <SelectContent>
                       {availableRegions.map((region: Region) => (
                         <SelectItem key={region.id} value={region.id}>
                           <span className="truncate block">{region.name}</span>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   {/* Zone Multiple Select */}
                   {selectedRegionId && (
                     <MultipleSelect
                       options={availableZones.map((zone: Zone) => ({ id: zone.id, name: zone.name }))}
                       selected={selectedZoneIds}
                       onChange={setSelectedZoneIds}
                       placeholder="Select zones..."
                     />
                   )}
                 </div>

                 {/* Languages Filter */}
                 {languages && languages.length > 0 && (
                   <div className="space-y-2">
                     <Label className="text-sm font-medium">Languages</Label>
                     <MultipleSelect
                       options={(languages as Language[]).map((lang: Language) => ({ id: lang.id, name: lang.name }))}
                       selected={selectedLanguageIds}
                       onChange={setSelectedLanguageIds}
                       placeholder="Select languages..."
                     />
                   </div>
                 )}

                 {/* Academic Levels Filter */}
                 {academicLevels && academicLevels.length > 0 && (
                   <div className="space-y-2">
                     <Label className="text-sm font-medium">Academic Levels</Label>
                     <MultipleSelect
                       options={(academicLevels as AcademicLevel[]).map((level: AcademicLevel) => ({ id: level.id, name: level.name }))}
                       selected={selectedAcademicLevelIds}
                       onChange={setSelectedAcademicLevelIds}
                       placeholder="Select levels..."
                     />
                   </div>
                 )}
               </div>

               {/* Filter Actions */}
               <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleClearFilters}
                   className="border-gray-300"
                 >
                   Clear All
                 </Button>
                 <Button
                   size="sm"
                   onClick={handleApplyFilters}
                   className="bg-blue-600 hover:bg-blue-700 text-white"
                 >
                   Apply Filters
                 </Button>
               </div>
             </div>
           )}
        </div>

        {/* Content Section - Table (Scrollable) */}
        <div className='p-6 space-y-4 overflow-y-auto flex-grow'>
          {/* Student Table */}
          {isLoadingStudents ? (
              <div className="flex justify-center items-center h-60">
                  <Loading />
              </div>
          ) : studentError ? (
              <div className="text-center text-red-600 py-10">Error loading students.</div>
          ) : (
              <StudentDataTable
                  columns={modalStudentColumns}
                  data={availableStudents}
                  isLoading={isLoadingStudents}
                  pagination={{
                      totalPages: totalStudentPages,
                      currentPage: modalPage,
                      setPage: setModalPage,
                      pageSize: modalPageSize,
                      setPageSize: handleModalPageSizeChange,
                      totalElements: totalStudentElements,
                  }}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
              />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const AddCohortStudentModal = memo(AddCohortStudentModalComponent); 