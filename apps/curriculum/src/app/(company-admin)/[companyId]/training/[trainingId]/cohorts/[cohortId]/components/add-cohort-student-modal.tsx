"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Filter, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudents } from '@/lib/hooks/useStudents';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Loading } from '@/components/ui/loading';
import { StudentDataTable } from '../../../components/students/student-data-table';
import { modalStudentColumns } from '../../../components/students/modal-student-columns';
import { RowSelectionState } from '@tanstack/react-table';
import { useAddTraineesToCohort } from '@/lib/hooks/useCohorts';
import { toast } from 'sonner';

interface AddCohortStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  trainingId: string;
  companyId: string;
  assignedStudentIds: string[];
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
  
  // Get mutation hook for adding trainees to cohort
  const { addTrainees, isLoading: isAssigning } = useAddTraineesToCohort();

  // Fetch students for the training
  const { 
    data: studentData, 
    isLoading: isLoadingStudents, 
    error: studentError 
  } = useStudents(trainingId, modalPage, modalPageSize);

  // Filter out already assigned students AND apply search client-side
  const availableStudents = useMemo(() => {
    const allFetchedStudents = studentData?.trainees || [];
    const unassigned = allFetchedStudents.filter(student => !assignedStudentIds.includes(student.id));
    if (!debouncedModalSearch) {
      return unassigned;
    }
    // Apply search filter
    return unassigned.filter(student => 
      student?.firstName?.toLowerCase().includes(debouncedModalSearch.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(debouncedModalSearch.toLowerCase()) ||
      student?.email?.toLowerCase().includes(debouncedModalSearch.toLowerCase())
    );
  }, [studentData, assignedStudentIds, debouncedModalSearch]);

  // Pagination and Selection Logic
  const totalAvailableElements = availableStudents.length;
  const totalStudentElements = studentData?.totalElements || totalAvailableElements;
  const totalStudentPages = Math.ceil(totalStudentElements / modalPageSize);

  const selectedStudentIds = useMemo(() => {
      return Object.keys(rowSelection)
          .filter(index => rowSelection[index])
          .map(index => availableStudents[parseInt(index, 10)]?.id)
          .filter((id): id is string => !!id);
  }, [rowSelection, availableStudents]);

  const handleModalPageSizeChange = useCallback((newPageSize: number) => {
      setModalPageSize(newPageSize);
      setModalPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setModalSearchQuery(e.target.value);
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

  // Effect to clear selection when modal reopens or available students change
  useEffect(() => {
      setRowSelection({});
  }, [isOpen, availableStudents])

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
               <Button variant="outline" className="flex items-center gap-2 border-gray-300 text-[#344054] h-10 whitespace-nowrap">
                 <Filter className="h-4 w-4" />
                 <span>Filters</span>
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