"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Settings, FileCheck, GraduationCap, UserPlus, Plus, Upload } from "lucide-react"

interface StudentsActionsMenuProps {
  // Student management
  onAddStudent: () => void
  onShowImport: () => void
  
  // Sync permissions
  hasSyncPermission: boolean
  
  // Training-level sync handlers (don't require selection)
  onSyncPreAssessmentTraining: () => void
  onSyncPostAssessmentTraining: () => void
  onSyncEnrollTraineesTraining: () => void
  onSyncCreateTraineesTraining: () => void
  onSyncCompletionTraining: () => void
  isSyncingPreAssessmentTraining: boolean
  isSyncingPostAssessmentTraining: boolean
  isSyncingEnrollTraineesTraining: boolean
  isSyncingCreateTraineesTraining: boolean
  isSyncingCompletionTraining: boolean
  
  // Permissions
  hasEditPermission: boolean
}

export function StudentsActionsMenu({
  onAddStudent,
  onShowImport,
  hasSyncPermission,
  onSyncPreAssessmentTraining,
  onSyncPostAssessmentTraining,
  onSyncEnrollTraineesTraining,
  onSyncCreateTraineesTraining,
  onSyncCompletionTraining,
  isSyncingPreAssessmentTraining,
  isSyncingPostAssessmentTraining,
  isSyncingEnrollTraineesTraining,
  isSyncingCreateTraineesTraining,
  isSyncingCompletionTraining,
  hasEditPermission,
}: StudentsActionsMenuProps) {
  if (!hasEditPermission && !hasSyncPermission) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Settings className="h-4 w-4" />
          <span>Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Student Management Section */}
        {hasEditPermission && (
          <>
            <DropdownMenuLabel>Student Management</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onAddStudent}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Add Student</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onShowImport}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Upload className="h-4 w-4 text-blue-600" />
              <span>Import CSV</span>
            </DropdownMenuItem>
            {hasSyncPermission && <DropdownMenuSeparator />}
          </>
        )}

        {/* Sync Section - All Students (by Training) */}
        {hasSyncPermission && (
          <>
            <DropdownMenuLabel>Sync All Students</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onSyncPreAssessmentTraining}
              disabled={isSyncingPreAssessmentTraining}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingPreAssessmentTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Syncing Pre-Assessment...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <span>Sync Pre-Assessment</span>
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={onSyncPostAssessmentTraining}
              disabled={isSyncingPostAssessmentTraining}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingPostAssessmentTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Syncing Post-Assessment...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <span>Sync Post-Assessment</span>
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={onSyncEnrollTraineesTraining}
              disabled={isSyncingEnrollTraineesTraining}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingEnrollTraineesTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Syncing Enrollment...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span>Sync Enrollment</span>
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={onSyncCreateTraineesTraining}
              disabled={isSyncingCreateTraineesTraining}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingCreateTraineesTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Syncing Created Trainees...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>Sync Created Trainees</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onSyncCompletionTraining}
              disabled={isSyncingCompletionTraining}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingCompletionTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Syncing Completion...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <span>Sync Completion</span>
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
