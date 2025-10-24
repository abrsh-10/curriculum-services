"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { useStudents } from '@/lib/hooks/useStudents';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Loading } from '@/components/ui/loading';
import { StudentDataTable } from '../../components/students/student-data-table';
import { modalStudentColumns } from './modal-student-columns';
import { RowSelectionState, Updater } from '@tanstack/react-table';
import { useSubmitCertificate } from '@/lib/hooks/useCertificate';
import { toast } from 'sonner';

interface CreateCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
}

export function CreateCertificateModal({ 
  isOpen,
  onClose,
  trainingId
}: CreateCertificateModalProps) {
  // Student selection state
  const [step, setStep] = useState<'select-student' | 'enter-details'>('select-student');
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const debouncedModalSearch = useDebounce(modalSearchQuery, 500);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Certificate form state
  const [issuingOrganization, setIssuingOrganization] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [description, setDescription] = useState("");
  const [creditHours, setCreditHours] = useState<number>(0);
  const [grade, setGrade] = useState<number>(0);
  
  // Get mutation hook for creating certificate
  const { mutate: submitCertificate, isPending: isSubmitting } = useSubmitCertificate();

  // Fetch students for the training
  const { 
    data: studentData, 
    isLoading: isLoadingStudents, 
    error: studentError 
  } = useStudents(trainingId, modalPage, modalPageSize);

  // Available students
  const availableStudents = useMemo(() => {
    const allFetchedStudents = studentData?.trainees || [];
    
    if (!debouncedModalSearch) {
      return allFetchedStudents;
    }
    
    // Apply search filter
    return allFetchedStudents.filter(student => 
      student?.firstName?.toLowerCase().includes(debouncedModalSearch.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(debouncedModalSearch.toLowerCase()) ||
      student?.email?.toLowerCase().includes(debouncedModalSearch.toLowerCase())
    );
  }, [studentData, debouncedModalSearch]);

  // Pagination
  const totalAvailableElements = availableStudents.length;
  const totalStudentElements = studentData?.totalElements || totalAvailableElements;
  const totalStudentPages = Math.ceil(totalStudentElements / modalPageSize);

  // Handle row selection changes to ensure only one student is selected
  const handleRowSelectionChange = (updaterOrValue: Updater<RowSelectionState>) => {
    // Handle both function updater and direct value
    const newSelection = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection)
      : updaterOrValue;
    
    // Get all selected keys
    const selectedKeys = Object.keys(newSelection).filter(k => newSelection[k]);
    
    // If nothing is selected or only one item, use as is
    if (selectedKeys.length <= 1) {
      setRowSelection(newSelection);
      return;
    }
    
    // If multiple items selected, only keep the last one added
    const currentSelectedKeys = Object.keys(rowSelection).filter(k => rowSelection[k]);
    const newlyAddedKey = selectedKeys.find(key => !currentSelectedKeys.includes(key));
    
    // Create a new selection state with only one item selected
    const singleSelection: RowSelectionState = {};
    // If we can determine the newly added key, select that one
    if (newlyAddedKey) {
      singleSelection[newlyAddedKey] = true;
    } else {
      // Otherwise just keep the first selected key
      singleSelection[selectedKeys[0]] = true;
    }
    
    setRowSelection(singleSelection);
  };

  // Get selected student
  const selectedStudentIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter(index => rowSelection[index])
      .map(index => availableStudents[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, availableStudents]);

  const selectedStudent = useMemo(() => {
    if (selectedStudentIds.length !== 1) return null;
    return availableStudents.find(student => student.id === selectedStudentIds[0]);
  }, [selectedStudentIds, availableStudents]);

  const handleModalPageSizeChange = (newPageSize: number) => {
    setModalPageSize(newPageSize);
    setModalPage(1);
  };

  // Move to certificate details after selecting a student
  const handleContinueToDetails = () => {
    if (selectedStudentIds.length !== 1) {
      toast.error("Please select exactly one student");
      return;
    }
    setStep('enter-details');
  };

  // Handle form submission
  const handleSubmitCertificate = () => {
    if (!selectedStudent) {
      toast.error("No student selected");
      return;
    }
    
    if (!issuingOrganization || !issueDate || !completionDate) {
      toast.error("Please fill all required fields");
      return;
    }
    
    submitCertificate({
     // issuingOrganization,
     // issueDate,
     // completionDate,
     // description,
     // creditHours,
     // grade,
      issueDate,
      traineeIds: [selectedStudent.id]
    }, {
      onSuccess: () => {
        // Reset form and close modal
        setIssuingOrganization("");
        setIssueDate("");
        setCompletionDate("");
        setDescription("");
        setCreditHours(0);
        setGrade(0);
        setRowSelection({});
        setStep('select-student');
        onClose();
      }
    });
  };

  // Go back to student selection
  const handleBackToStudentSelection = () => {
    setStep('select-student');
  };

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRowSelection({});
      setIssuingOrganization("");
      setIssueDate("");
      setCompletionDate("");
      setDescription("");
      setCreditHours(0);
      setGrade(0);
      setStep('select-student');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col max-h-[80vh]">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold text-[#1B2128]">
              {step === 'select-student' ? 'Select Student for Certificate' : 'Certificate Details'}
            </DialogTitle>
          </DialogHeader>
          
          {step === 'select-student' && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-grow">
                <div className="relative md:w-[300px]">
                  <Search className="absolute text-sm left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students..."
                    className="pl-10 h-10 text-sm bg-white border-gray-300 rounded-lg"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2 border-gray-300 text-[#344054] h-10">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </div>
              
              <Button 
                onClick={handleContinueToDetails} 
                disabled={selectedStudentIds.length !== 1} 
                className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
              >
                Continue
              </Button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className='p-6 space-y-4 overflow-y-auto flex-grow'>
          {step === 'select-student' ? (
            <>
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
                  onRowSelectionChange={handleRowSelectionChange}
                />
              )}
            </>
          ) : (
            <div className="space-y-6">
              {selectedStudent && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                  <p className="text-blue-800 font-medium">
                    Creating certificate for: {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-blue-600 text-sm mt-1">{selectedStudent.email}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="issuingOrganization" className="text-sm font-medium">
                    Issuing Organization *
                  </Label>
                  <Input
                    id="issuingOrganization"
                    value={issuingOrganization}
                    onChange={(e) => setIssuingOrganization(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="issueDate" className="text-sm font-medium">
                    Issue Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="issueDate"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="pl-10 w-full"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="completionDate" className="text-sm font-medium">
                    Completion Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="completionDate"
                      type="date"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      className="pl-10 w-full"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="creditHours" className="text-sm font-medium">
                    Credit Hours
                  </Label>
                  <Input
                    id="creditHours"
                    type="number"
                    min="0"
                    value={creditHours}
                    onChange={(e) => setCreditHours(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium">
                    Grade
                  </Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[100px]"
                  />
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleBackToStudentSelection}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmitCertificate}
                  disabled={isSubmitting || !issuingOrganization || !issueDate || !completionDate}
                  className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Certificate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 