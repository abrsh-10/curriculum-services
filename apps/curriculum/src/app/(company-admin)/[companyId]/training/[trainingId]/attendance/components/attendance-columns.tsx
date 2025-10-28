"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Check, X, MessageSquare, X as CloseIcon, CheckCircle, AlertCircle, Edit2, Save, XCircle, CreditCard } from "lucide-react"
import { formatDateToDisplay } from "@/lib/utils"
import { useState } from "react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Session } from "@/lib/hooks/useSession"
import { IdUploadModal } from "./id-upload-modal"


// Define the student type for attendance
export interface AttendanceStudent {
  id: string
  firstName: string
  lastName: string
  contactPhone: string
  attendance?: 'present' | 'absent'
  comment?: string
  attendanceId?: string
  sessionDate: string
  answerFileLink?: string | null
  idType?: string | null
  frontIdUrl?: string | null
  backIdUrl?: string | null
  signatureUrl?: string | null
  consentFormUrl?: string | null
  pendingTraineeId?: string | null
  _onAttendanceChange?: (id: string, status: 'present' | 'absent') => void
  _onCommentChange?: (id: string, comment: string) => void
  _isProcessing?: boolean
  _isSelected?: boolean // Track if student is selected for bulk operations
  _onSelectionChange?: (id: string, selected: boolean) => void
  _isEditing?: boolean // Track if this student is in edit mode
  _onEditModeChange?: (id: string, editing: boolean) => void
  _hasUnsavedChanges?: boolean // Track if this student has unsaved changes
  [key: string]: string | 'present' | 'absent' | null | undefined | ((id: string, value: string) => void) | ((id: string, status: 'present' | 'absent') => void) | ((id: string, selected: boolean) => void) | ((id: string, editing: boolean) => void) | boolean
}

// CommentDialog component
function CommentDialog({ 
  student, 
  comment, 
  onCommentChange,
  disabled = false
}: { 
  student: AttendanceStudent,
  comment?: string,
  onCommentChange: (comment: string) => void,
  disabled?: boolean
}) {
  const [localComment, setLocalComment] = useState(comment || "")
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSave = () => {
    onCommentChange(localComment)
    setIsOpen(false)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          className={`w-6 h-6 rounded-full flex items-center justify-center ml-2 ${
            comment 
              ? student.attendance === 'present' 
                ? 'text-[#037847] bg-[#ECFDF3] ring-1 ring-[#037847]' 
                : student.attendance === 'absent'
                ? 'text-[#D03710] bg-[rgba(243,88,88,0.47)] ring-1 ring-[#D03710]'
                : 'text-[#0B75FF] bg-blue-50 ring-1 ring-[#0B75FF]'
              : 'text-gray-400 bg-gray-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
          aria-label={`Add comment for ${student.firstName} ${student.lastName}`}
          disabled={disabled}
        >
          <MessageSquare size={12} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Attendance Comment</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={localComment}
            onChange={(e) => setLocalComment(e.target.value)}
            placeholder="Add a comment about this student's attendance..."
            className="min-h-[120px]"
          />
        </div>
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#0B75FF] hover:bg-blue-700 text-white"
          >
            Save Comment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const createAttendanceColumns = (
  sessionId: string,
  session?: Session,
  trainingId?: string,
  extras: ColumnDef<AttendanceStudent>[] = [],
  hasUnsavedChanges: boolean = false,
  submittedAttendanceIds: Set<string> = new Set(),
  onSaveIndividualAttendance?: (studentId: string) => void
) => {
  const columns: ColumnDef<AttendanceStudent>[] = [
    {
      id: "select",
      header: ({ table }) => {
        // Check if any students have submitted attendance to disable select all
        const hasAnySubmittedAttendance = table.getRowModel().rows.some(row => 
          submittedAttendanceIds.has((row.original as AttendanceStudent).id)
        );
        
        return (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={hasUnsavedChanges || hasAnySubmittedAttendance}
            aria-label="Select all students"
          />
        );
      },
      cell: ({ row }) => {
        const student = row.original
        const hasSubmittedAttendance = submittedAttendanceIds.has(student.id)
        const isSelectionDisabled = hasUnsavedChanges || hasSubmittedAttendance
        
        return (
          <input
            type="checkbox"
            checked={student._isSelected || false}
            onChange={(e) => {
              if (!hasSubmittedAttendance && student._onSelectionChange) {
                student._onSelectionChange(student.id, e.target.checked)
              }
            }}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isSelectionDisabled}
            aria-label={`Select ${student.firstName} ${student.lastName}`}
          />
        )
      },
    },
    {
      accessorKey: "name",
      header: "Full Name",
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="flex items-center gap-3">
            {/* <div className="w-8 h-8 rounded-full bg-[rgba(11,117,255,0.6)] flex items-center justify-center text-white">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div> */}
            <span className="text-sm">{student.firstName} {student.lastName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "contactPhone",
      header: "Phone Number",
      cell: ({ row }) => {
        return <span className="text-sm text-[#667085]">{row.original.contactPhone}</span>
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        return (
          <span className="text-sm text-[#667085]">
            {formatDateToDisplay(row.original.sessionDate || '')}
          </span>
        )
      },
    },
    {
      accessorKey: "attendance",
      header: "Attendance",
      cell: ({ row }) => {
        const student = row.original
        const hasAttendance = student.attendance !== undefined
        const isProcessing = student._isProcessing === true
        const hasSubmittedAttendance = submittedAttendanceIds.has(student.id)
        const isEditing = student._isEditing === true
        const isDisabled = isProcessing || (hasSubmittedAttendance && !isEditing)
        
        // Visual enhancement - container for attendance buttons
        const attendanceContainerClass = hasAttendance 
          ? "rounded-md bg-opacity-20 border border-gray-200" 
          : ""
        
        return (
          <div className={`flex items-center gap-1 ${hasSubmittedAttendance && !isEditing ? 'w-52 px-2 py-1' : isEditing ? 'w-80 px-3 py-2' : 'w-64 px-3 py-2'} ${attendanceContainerClass} ${hasSubmittedAttendance && !isEditing ? 'opacity-90' : ''} ${isEditing ? 'ring-2 ring-blue-300 bg-blue-50 rounded-lg' : ''}`}>
            {/* Submitted attendance is shown in a more compact format */}
            {hasSubmittedAttendance && !isEditing ? (
              <>
                {/* Compact view for submitted attendance */}
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center
                  ${student.attendance === 'present' 
                    ? 'bg-[#ECFDF3] ring-1 ring-[#037847]' 
                    : 'bg-[rgba(243,88,88,0.35)] ring-1 ring-[#D03710]'}`
                }>
                  {student.attendance === 'present' 
                    ? <Check size={12} className="text-[#037847]" />
                    : <X size={12} className="text-[#D03710]" />
                  }
                </div>
                <span className={`text-xs font-medium ml-1 ${student.attendance === 'present' ? 'text-green-700' : 'text-red-700'}`}>
                  {student.attendance === 'present' ? 'Present' : 'Absent'}
                </span>

                {/* Comment indicator if exists */}
                {student.comment && (
                  <span className="ml-1 text-xs flex-shrink-0 text-gray-500 border border-gray-200 rounded-full px-1.5 py-0.5">
                    <MessageSquare size={10} className="inline mr-1" /> Has note
                  </span>
                )}
                
                {/* Extra space */}
                <div className="flex-grow"></div>
                
                {/* Edit button */}
                {row.original._onEditModeChange && (
                  <button
                    className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors flex-shrink-0"
                    aria-label={`Edit attendance for ${student.firstName} ${student.lastName}`}
                    onClick={() => {
                      row.original._onEditModeChange?.(student.id, true)
                    }}
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Regular expanded view for editing or initial marking */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    className={`w-7 h-7 rounded-full ${
                      student.attendance === 'present' 
                        ? 'bg-[#ECFDF3] ring-2 ring-[#037847] shadow-sm' 
                        : 'bg-[#F2F4F7]'
                    } flex items-center justify-center transition-all flex-shrink-0 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                    aria-label={`Mark ${student.firstName} ${student.lastName} as present`}
                    onClick={() => {
                      if (!isDisabled && row.original._onAttendanceChange) {
                        row.original._onAttendanceChange(student.id, 'present')
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Check size={14} className={`${student.attendance === 'present' ? 'text-[#037847] font-bold' : 'text-gray-400'}`} />
                  </button>
                  <button 
                    className={`w-7 h-7 rounded-full ${
                      student.attendance === 'absent' 
                        ? 'bg-[rgba(243,88,88,0.47)] ring-2 ring-[#D03710] shadow-sm' 
                        : 'bg-[#F2F4F7]'
                    } flex items-center justify-center transition-all flex-shrink-0 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                    aria-label={`Mark ${student.firstName} ${student.lastName} as absent`}
                    onClick={() => {
                      if (!isDisabled && row.original._onAttendanceChange) {
                        row.original._onAttendanceChange(student.id, 'absent')
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <X size={14} className={`${student.attendance === 'absent' ? 'text-[#D03710] font-bold' : 'text-gray-400'}`} />
                  </button>
                </div>
                
                {/* Status indicator */}
                {hasAttendance && (
                  <div className="ml-1 text-xs font-medium flex items-center gap-1.5">
                    {student.attendance === 'present' ? (
                      <span className="text-green-700 text-xs font-medium whitespace-nowrap">Present</span>
                    ) : (
                      <span className="text-red-700 text-xs font-medium whitespace-nowrap">Absent</span>
                    )}
                    {isEditing && (
                      <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full leading-none font-medium whitespace-nowrap">
                        Editing
                      </span>
                    )}
                  </div>
                )}
                
                {/* Right side controls */}
                <div className={`flex items-center gap-1 ${hasAttendance ? 'ml-auto' : 'ml-2'}`}>
                  {/* Comment button with dialog */}
                  {row.original._onCommentChange && (
                    <CommentDialog 
                      student={student} 
                      comment={student.comment}
                      onCommentChange={(comment) => {
                        row.original._onCommentChange?.(student.id, comment)
                      }}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {/* Edit/Cancel/Save buttons - only show in edit mode */}
                  {isEditing && onSaveIndividualAttendance && (
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Save button - only show if there are unsaved changes */}
                      {student._hasUnsavedChanges && (
                        <button
                          className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors flex-shrink-0"
                          aria-label={`Save changes for ${student.firstName} ${student.lastName}`}
                          onClick={() => {
                            onSaveIndividualAttendance(student.id)
                          }}
                        >
                          <Save size={12} />
                        </button>
                      )}
                      {/* Cancel button */}
                      <button
                        className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                        aria-label={`Cancel editing ${student.firstName} ${student.lastName}`}
                        onClick={() => {
                          row.original._onEditModeChange?.(student.id, false)
                        }}
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "id",
      header: "ID & Consent Form",
      cell: ({ row }) => {
        const student = row.original;
        const fullName = `${student.firstName} ${student.lastName}`;
        const hasId = student.idType && student.frontIdUrl;
        
        return (
          <div className="flex flex-col gap-1 min-w-36">
            {hasId ? (
              <>
                {/* Document Links and Edit Button */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {student.frontIdUrl && (
                      <a
                        href={student.frontIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        📄 Front
                      </a>
                    )}
                    {student.backIdUrl && (
                      <a
                        href={student.backIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        📄 Back
                      </a>
                    )}
                    {student.signatureUrl && (
                      <a
                        href={student.signatureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        ✍️ Signature
                      </a>
                    )}
                  </div>
                  <IdUploadModal
                    studentId={student.pendingTraineeId || student.id}
                    studentName={fullName}
                    idType={student.idType}
                    frontIdUrl={student.frontIdUrl}
                    backIdUrl={student.backIdUrl}
                    signatureUrl={student.signatureUrl}
                    consentFormUrl={student.consentFormUrl}
                    trigger={
                      <button className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors">
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    }
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-start">
                <IdUploadModal
                  studentId={student.pendingTraineeId || student.id}
                  studentName={fullName}
                  idType={student.idType}
                  frontIdUrl={student.frontIdUrl}
                  backIdUrl={student.backIdUrl}
                  signatureUrl={student.signatureUrl}
                  consentFormUrl={student.consentFormUrl}
                  trigger={
                    <Button 
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      size="sm"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Add ID & Consent
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        );
    },
 
    },


  ];

  
  // Append any extra columns provided (future-proofing for new inline forms)
  if (extras.length) {
    columns.push(...extras);
  }
  
  return columns;
};



// Create survey completion column
export const createSurveyStatusColumn = (
  surveyAnsweredIds: Set<string>,
  isLoading: boolean = false
): ColumnDef<AttendanceStudent> => ({
  id: "surveyStatus",
  header: () => <div className="text-center">Survey Status</div>,
  cell: ({ row }) => {
    const student = row.original
    if (isLoading) {
      return (
        <div className="flex items-center justify-center text-gray-400 text-xs">Loading...</div>
      )
    }
    const hasCompleted = surveyAnsweredIds.has(student.id)
    
    return (
      <div className="flex items-center justify-center">
        {hasCompleted ? (
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle size={16} />
            <span className="text-xs font-medium">Completed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400">
            <XCircle size={16} />
            <span className="text-xs font-medium">Not completed</span>
          </div>
        )}
      </div>
    )
  },
})

// Create assessment score column
export const createAssessmentScoreColumn = (
  traineeScores: Map<string, { postScore: number | null; hasPassed: boolean | null; totalAttempts: number }>,
  maxAttempts: number | null,
  isLoading: boolean = false
): ColumnDef<AttendanceStudent> => ({
  id: "assessmentScore",
  header: () => <div className="text-center">Post Assessment Score</div>,
  cell: ({ row }) => {
    const student = row.original
    if (isLoading) {
      return (
        <div className="flex items-center justify-center text-gray-400 text-xs">Loading...</div>
      )
    }
    const scoreData = traineeScores.get(student.id)
    
    if (!scoreData || scoreData.postScore === null) {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-xs text-gray-400">Not taken</span>
          {maxAttempts && (
            <span className="text-xs text-gray-400">0 / {maxAttempts} attempts</span>
          )}
        </div>
      )
    }
    
    const score = scoreData.postScore
    const hasPassed = scoreData.hasPassed
    const totalAttempts = scoreData.totalAttempts
    
    // Color coding based on score
    let colorClass = "text-gray-600"
    let bgClass = "bg-gray-100"
    if (hasPassed === true) {
      colorClass = "text-green-700"
      bgClass = "bg-green-100"
    } else if (hasPassed === false) {
      colorClass = "text-red-700"
      bgClass = "bg-red-100"
    }
    
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className={`px-3 py-1 rounded-full ${bgClass} ${colorClass}`}>
          <span className="text-sm font-semibold">{score.toFixed(1)}%</span>
        </div>
        {maxAttempts && (
          <span className="text-xs text-gray-500">
            Attempt {totalAttempts} / {maxAttempts}
          </span>
        )}
      </div>
    )
  },
})

// Create assessment score column
export const createPreAssessmentScoreColumn = (
  traineeScores: Map<string, { preScore: number | null }>,
  isLoading: boolean = false
): ColumnDef<AttendanceStudent> => ({
  id: "preAssessmentScore",
  header: () => <div className="text-center">Pre Assessment Score</div>,
  cell: ({ row }) => {
    const student = row.original
    if (isLoading) {
      return (
        <div className="flex items-center justify-center text-gray-400 text-xs">Loading...</div>
      )
    }
    const scoreData = traineeScores.get(student.id)
    
    if (!scoreData || scoreData.preScore === null) {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-xs text-gray-400">Not taken</span>
        </div>
      )
    }
    
    const score = scoreData.preScore
  
    

    
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className={`px-3 py-1 rounded-full bg-gray-100 text-gray-600`}>
          <span className="text-sm font-semibold">{score.toFixed(1)}%</span>
        </div>
      </div>
    )
  },
})

// Export a static version for compatibility with existing code
export const attendanceColumns = createAttendanceColumns(""); 
