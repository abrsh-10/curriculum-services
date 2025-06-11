"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Loading } from "@/components/ui/loading"
import { useCohortSessions } from "@/lib/hooks/useSession"
import { useCohorts, useCohortTrainees } from "@/lib/hooks/useCohorts"
import { createAttendanceColumns } from "../attendance/components/attendance-columns"
import { AttendanceDataTable } from "../attendance/components/attendance-data-table"
import { CohortSessionTabs } from "../attendance/components/cohort-session-tabs"
import { useSubmitAttendance } from "@/lib/hooks/useAttendance"
import { Student } from "@/lib/hooks/useStudents"
import { toast } from "sonner"

// Extended Student type to include attendance information from API
interface StudentWithAttendance extends Student {
  isPresent: boolean | null;
  comment?: string;
  attendanceId?: string;
  answerFileLink?: string | null;
}

interface AttendanceComponentProps {
  trainingId: string
}

export function AttendanceComponent({ trainingId }: AttendanceComponentProps) {
  const { isProjectManager, isTrainingAdmin, isTrainer, isLoading: isLoadingAuth } = useUserRole()
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false)
  const canEditAssessment = !isLoadingAuth && (isTrainer || isTrainingAdmin || isProjectManager) && isInitialLoadComplete
  const [activeCohortId, setActiveCohortId] = useState<string>("")
  const [activeSessionId, setActiveSessionId] = useState<string>("")
  const [studentPage, setStudentPage] = useState(1)
  const [studentPageSize, setStudentPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: 'present' | 'absent', comment: string, attendanceId?: string }>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const previousSessionIdRef = useRef<string>("");
  const [unsavedStudentId, setUnsavedStudentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false)
  const [pendingSubmissions, setPendingSubmissions] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch cohorts for this training
  const { 
    data: cohortsData, 
    isLoading: isLoadingCohorts, 
    error: cohortsError 
  } = useCohorts({
    trainingId,
    pageSize: 20,
    page: 1
  })
  
  const cohorts = cohortsData?.cohorts || []

  // Fetch sessions for the active cohort
  const { 
    data: sessionsData, 
    isLoading: isLoadingSessions, 
    error: sessionsError 
  } = useCohortSessions({
    cohortId: activeCohortId,
    pageSize: 20,
    page: 1
  })
  
  const sessions = sessionsData?.sessions || []

  // Initialize first cohort and session - only once when data is available
  useEffect(() => {
    if (!isInitialized && cohorts.length > 0) {
      setActiveCohortId(cohorts[0].id)
      setIsInitialized(true)
    }
  }, [cohorts, isInitialized])

  // Set first session when sessions load for the active cohort
  useEffect(() => {
    if (activeCohortId && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id)
      setIsInitialLoadComplete(true)  // Mark initial load as complete
    }
  }, [activeCohortId, sessions, activeSessionId])

  // Handle cohort change - reset session and clear data
  const handleCohortChange = useCallback((newCohortId: string) => {
    if (newCohortId !== activeCohortId) {
      setActiveCohortId(newCohortId)
      setActiveSessionId("") // Reset session when cohort changes
      setAttendanceData({})
      setHasUnsavedChanges(false)
      setUnsavedStudentId(null)
    }
  }, [activeCohortId])

  // Handle session change
  const handleSessionChange = useCallback((newSessionId: string) => {
    if (newSessionId !== activeSessionId) {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm("You have unsaved attendance changes for a student. Do you want to discard them?");
        if (confirmed) {
          setActiveSessionId(newSessionId)
          setAttendanceData({})
          setHasUnsavedChanges(false)
          setUnsavedStudentId(null)
        }
      } else {
        setActiveSessionId(newSessionId)
        setAttendanceData({})
        setUnsavedStudentId(null)
      }
    }
  }, [activeSessionId, hasUnsavedChanges])

  // Fetch students for the active cohort (not session)
  const { 
    data: studentData, 
    isLoading: isLoadingStudents, 
    error: studentError,
    refetch: refetchStudents
  } = useCohortTrainees(
    activeCohortId,
    studentPage,
    studentPageSize,
    { noCohorts: true }
  )

  // Initialize attendance data from student records
  useEffect(() => {
    if (studentData?.trainees && studentData.trainees.length > 0) {
      const newAttendanceData: Record<string, { status: 'present' | 'absent', comment: string, attendanceId?: string }> = {};
      
      studentData.trainees.forEach(student => {
        // Check if the student has attendance data
        const typedStudent = student as unknown as StudentWithAttendance;
        
        if (student.id && typedStudent.isPresent !== null && typedStudent.isPresent !== undefined) {
          newAttendanceData[student.id] = {
            status: typedStudent.isPresent ? 'present' : 'absent',
            comment: typedStudent.comment || '',
            attendanceId: typedStudent.attendanceId
          };
        }
      });
      
      // Set initial data without comparing, as we want to load fresh data
      setAttendanceData(newAttendanceData);
      
      setHasUnsavedChanges(false); // Reset change tracking after loading data
      setUnsavedStudentId(null); // Reset unsaved student on data load
    } else {
      // Clear data if no trainees
      setAttendanceData({});
      setHasUnsavedChanges(false);
      setUnsavedStudentId(null);
    }
  }, [studentData]); 

  const students = studentData?.trainees || [];
  
  // Handle attendance change - modified for single student edits
  const handleAttendanceChange = useCallback((studentId: string, status: 'present' | 'absent') => {
    // Prevent changing another student if one already has unsaved changes
    if (hasUnsavedChanges && unsavedStudentId !== studentId) {
      toast.error("Unsaved Changes", {
        description: "Please save the current student's attendance before modifying another."
      });
      return;
    }
    
    let previousStatus: 'present' | 'absent' | undefined;
    let statusChanged = false;
    
    setAttendanceData(prev => {
      const existingRecord = prev[studentId];
      previousStatus = existingRecord?.status;
      
      // Update only if status actually changed
      if (existingRecord?.status === status) return prev;
      
      statusChanged = true;
      return {
        ...prev,
        [studentId]: {
          ...(existingRecord || { comment: '' }), // Ensure comment exists if creating new record
          status: status
        }
      };
    });
    
    // Mark changes and track the student if status changed
    if (statusChanged) {
      setHasUnsavedChanges(true);
      setUnsavedStudentId(studentId);
    }
  }, [hasUnsavedChanges, unsavedStudentId]);

  // Handle comment change - modified for single student edits
  const handleCommentChange = useCallback((studentId: string, comment: string) => {
    // Prevent changing another student if one already has unsaved changes
    if (hasUnsavedChanges && unsavedStudentId !== studentId) {
      toast.error("Unsaved Changes", {
        description: "Please save the current student's attendance before modifying another."
      });
      return;
    }
    
    let commentChanged = false;

    setAttendanceData(prev => {
      const existingRecord = prev[studentId] || { status: undefined, comment: '' }; // Provide default status if needed
      
      // Only update if comment actually changed
      if (existingRecord.comment === comment) return prev;

      commentChanged = true;
      return {
        ...prev,
        [studentId]: {
          ...existingRecord,
          comment
        }
      };
    });
    
    // Mark changes and track the student if comment changed
    if (commentChanged) {
      setHasUnsavedChanges(true);
      setUnsavedStudentId(studentId);
    }
  }, [hasUnsavedChanges, unsavedStudentId]);
  
  // Map the student data to AttendanceStudent format - memoized to prevent recalculation
  const attendanceStudents = useMemo(() => students.map(student => {
    const studentAttendance = attendanceData[student.id];
    const typedStudent = student as unknown as StudentWithAttendance;
    const hasRecordedAttendance = typedStudent.isPresent !== null && typedStudent.isPresent !== undefined;
    
    // Determine the effective attendance and comment based on unsaved state
    let effectiveAttendance: 'present' | 'absent' | undefined;
    let effectiveComment: string = typedStudent.comment || '';

    if (hasUnsavedChanges && unsavedStudentId === student.id && studentAttendance) {
      // Use local state if this student has unsaved changes
      effectiveAttendance = studentAttendance.status;
      effectiveComment = studentAttendance.comment || '';
    } else if (hasRecordedAttendance) {
      // Use API data if no unsaved changes for this student
      effectiveAttendance = typedStudent.isPresent ? 'present' : 'absent';
    } else if (studentAttendance) {
       // Use local state if it exists (e.g., comment added without changing status)
       effectiveAttendance = studentAttendance.status;
       effectiveComment = studentAttendance.comment || '';
    }
    
    return {
      id: student.id,
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      sessionDate: sessions.find(s => s.id === activeSessionId)?.startDate || '',
      attendance: effectiveAttendance,
      comment: effectiveComment,
      attendanceId: typedStudent.attendanceId,
      answerFileLink: typedStudent.answerFileLink,
      _onAttendanceChange: handleAttendanceChange,
      _onCommentChange: handleCommentChange,
      _isProcessing: pendingSubmissions.includes(student.id),
      _isDisabled: hasUnsavedChanges && unsavedStudentId !== student.id 
    }
  }), [
    students, 
    attendanceData, 
    activeSessionId, 
    sessions, 
    handleAttendanceChange, 
    handleCommentChange, 
    hasUnsavedChanges, 
    pendingSubmissions,
    unsavedStudentId
  ]);
  
  // Filter students based on search query - memoized to prevent recalculation
  const filteredStudents = useMemo(() => 
    searchQuery 
      ? attendanceStudents.filter(student => 
          student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : attendanceStudents,
    [attendanceStudents, searchQuery]
  );

  // Pagination data - memoized to prevent recalculation
  const totalStudentElements = useMemo(() => 
    studentData?.totalElements || filteredStudents.length,
    [studentData?.totalElements, filteredStudents.length]
  );
  
  const totalStudentPages = useMemo(() => 
    studentData?.totalPages || Math.ceil(totalStudentElements / studentPageSize),
    [studentData?.totalPages, totalStudentElements, studentPageSize]
  );

  // Handle page size change
  const handleStudentPageSizeChange = useCallback((newPageSize: number) => {
    setStudentPageSize(newPageSize)
    setStudentPage(1) // Reset to first page when changing page size
  }, []);

  // Replace bulk mutation with single attendance mutation
  const { mutate: submitAttendance, isPending: isSavingAttendance } = useSubmitAttendance();

  // Handle save attendance for the single student with unsaved changes
  const handleSaveAttendance = useCallback(async () => {
    if (!activeSessionId || !unsavedStudentId || !hasUnsavedChanges) return;

    const attendanceToSave = attendanceData[unsavedStudentId];
    if (!attendanceToSave) {
      console.error("Could not find attendance data for unsaved student:", unsavedStudentId);
      toast.error("Error saving attendance", { description: "Could not find data to save." });
      return;
    }

    // Check if status is defined before saving
    if (attendanceToSave.status === undefined) {
       toast.error("Cannot Save", {
         description: "Please mark the student as 'Present' or 'Absent' before saving."
       });
       return;
    }

    setIsSaving(true);
    const studentToSave = students.find(s => s.id === unsavedStudentId); // For toast message
    const studentName = studentToSave ? `${studentToSave.firstName} ${studentToSave.lastName}` : `Student ID ${unsavedStudentId}`;
    
    submitAttendance(
      {
        traineeId: unsavedStudentId,
        sessionId: activeSessionId,
        present: attendanceToSave.status === 'present',
        comment: attendanceToSave.comment || ''
      },
      {
        onSuccess: async () => {
          toast.success(`Attendance saved for ${studentName}`);
          setHasUnsavedChanges(false);
          setUnsavedStudentId(null);
          await refetchStudents(); // Refresh data after saving
        },
        onError: (error) => {
          console.log("Error saving attendance:", error);
          toast.error("Error saving attendance", {
            description: `Could not save attendance for ${studentName}. Please try again.`
          });
        },
        onSettled: () => {
          setIsSaving(false);
        }
      }
    );
  }, [activeSessionId, unsavedStudentId, hasUnsavedChanges, attendanceData, submitAttendance, refetchStudents, students]);

  // Find the current session object
  const currentSession = sessions.find(session => session.id === activeSessionId);

  // Memoize the attendance columns to prevent recreation on each render
  const memoizedColumns = useMemo(() => 
    createAttendanceColumns(activeSessionId, canEditAssessment, currentSession, trainingId),
    [activeSessionId, canEditAssessment, currentSession, trainingId, isLoadingAuth]
  );

  // Comprehensive loading states
  const isInitialLoadingCohorts = isLoadingCohorts && cohorts.length === 0
  const isInitialLoadingSessions = isLoadingSessions && sessions.length === 0 && activeCohortId
  const isLoadingStudentsData = isLoadingStudents && !studentData
  const isTableTransitioning = isLoadingStudents && studentData // When switching sessions/cohorts

  // Header section with title
  const headerSection = (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-xl font-semibold">Attendance</h1>
    </div>
  )

  // Show main loading during initial load
  if (isInitialLoadingCohorts) {
    return (
      <div className="px-[7%] py-10">
        {headerSection}
        <Loading />
      </div>
    )
  }

  if (cohortsError) {
    return (
      <div className="px-[7%] py-10">
        {headerSection}

        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">Error Loading Cohorts</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the cohorts. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (cohorts.length === 0) {
    return (
      <div className="px-[7%] py-10">
        {headerSection}

        <div className="text-center py-40 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">No Cohorts Available</h3>
          <p className="text-gray-500 text-sm">
            No cohorts are available for attendance tracking. Please add cohorts to the training program first.
          </p>
        </div>
      </div>
    )
  }

  if (sessionsError) {
    return (
      <div className="px-[7%] py-10">
        {headerSection}

        {/* Show cohort tabs even on session error */}
        <CohortSessionTabs 
          cohorts={cohorts}
          sessions={[]}
          activeCohortId={activeCohortId}
          activeSessionId=""
          setActiveCohortId={handleCohortChange}
          setActiveSessionId={handleSessionChange}
          trainingId={trainingId}
        />

        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">Error Loading Sessions</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the sessions for this cohort. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (activeCohortId && sessions.length === 0 && !isInitialLoadingSessions) {
    return (
      <div className="px-[7%] py-10">
        {headerSection}
        
        {/* Cohort tabs even when no sessions */}
        <CohortSessionTabs 
          cohorts={cohorts}
          sessions={sessions}
          activeCohortId={activeCohortId}
          activeSessionId={activeSessionId}
          setActiveCohortId={handleCohortChange}
          setActiveSessionId={handleSessionChange}
          trainingId={trainingId}
        />

        <div className="text-center py-40 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">No Sessions Available</h3>
          <p className="text-gray-500 text-sm">
            No sessions are available in this cohort for attendance tracking. Please add sessions to this cohort first.
          </p>
        </div>
      </div>
    )
  }

  // Show loading while sessions are loading for initial load
  if (isInitialLoadingSessions) {
    return (
      <div className="px-[7%] py-10">
        {headerSection}
        
        {/* Show cohort tabs */}
        <CohortSessionTabs 
          cohorts={cohorts}
          sessions={[]}
          activeCohortId={activeCohortId}
          activeSessionId=""
          setActiveCohortId={handleCohortChange}
          setActiveSessionId={handleSessionChange}
          trainingId={trainingId}
        />
        
        <div className="mt-8">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div className="px-[7%] py-10">
      {headerSection}
      
      {/* Cohort and Session tabs component */}
      <CohortSessionTabs 
        cohorts={cohorts}
        sessions={sessions}
        activeCohortId={activeCohortId}
        activeSessionId={activeSessionId}
        setActiveCohortId={handleCohortChange}
        setActiveSessionId={handleSessionChange}
        trainingId={trainingId}
      />
      
      {/* Student Attendance Table */}
      {studentError ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border border-[#EAECF0]">
          <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the required data. Please try again later.
          </p>
        </div>
      ) : !activeSessionId ? (
        <div className="mt-8">
          <Loading />
        </div>
      ) : students.length === 0 && !isLoadingStudentsData && !isTableTransitioning ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border border-[#EAECF0]">
          <h3 className="text-lg font-medium mb-2">No Students Assigned</h3>
          <p className="text-gray-500 text-sm">
            No students are available for this cohort. Add students to the cohort to track attendance.
          </p>
        </div>
      ) : isLoadingStudentsData && !studentData ? (
        // Initial load of students
        <div className="mt-8">
          <Loading />
        </div>
      ) : (
        <AttendanceDataTable
          columns={memoizedColumns}
          data={filteredStudents}
          isLoading={isTableTransitioning}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pagination={{
            totalPages: totalStudentPages,
            currentPage: studentPage,
            setPage: setStudentPage,
            pageSize: studentPageSize,
            setPageSize: handleStudentPageSizeChange,
            totalElements: totalStudentElements
          }}
          isSaving={isSaving || isSavingAttendance}
          onSaveAttendance={handleSaveAttendance}
          hasUnsavedChanges={hasUnsavedChanges}
          sessionId={activeSessionId}
          unsavedStudentId={unsavedStudentId}
          isInitialLoadComplete={isInitialLoadComplete}
          canEditAttendance={canEditAssessment}
        />
      )}
    </div>
  )
} 