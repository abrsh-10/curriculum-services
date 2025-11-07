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
import { MoreVertical, Award, Trash2, FileCheck, GraduationCap, UserPlus } from "lucide-react"

interface BulkActionsMenuProps {
  selectedCount: number
  hasSyncPermission: boolean
  hasEditPermission: boolean
  isCompanyAdmin: boolean
  isProjectManager: boolean
  onGenerateCertificates: () => void
  onSyncPreAssessment: () => void
  onSyncPostAssessment: () => void
  onSyncEnrollTrainees: () => void
  onSyncCreateTrainees: () => void
  onBulkDelete: () => void
  isGeneratingCertificates: boolean
  isSyncingPreAssessment: boolean
  isSyncingPostAssessment: boolean
  isSyncingEnrollTrainees: boolean
  isSyncingCreateTrainees: boolean
  isBulkDeleting: boolean
}

export function BulkActionsMenu({
  selectedCount,
  hasSyncPermission,
  hasEditPermission,
  isCompanyAdmin,
  isProjectManager,
  onGenerateCertificates,
  onSyncPreAssessment,
  onSyncPostAssessment,
  onSyncEnrollTrainees,
  onSyncCreateTrainees,
  onBulkDelete,
  isGeneratingCertificates,
  isSyncingPreAssessment,
  isSyncingPostAssessment,
  isSyncingEnrollTrainees,
  isSyncingCreateTrainees,
  isBulkDeleting,
}: BulkActionsMenuProps) {
  if (selectedCount === 0 || !hasEditPermission) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto bg-[#1D4ED8] hover:bg-[#0A2342] text-white hover:text-white"
        >
          <MoreVertical className="h-4 w-4" />
          <span>Bulk Actions ({selectedCount})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Generate Certificate */}
        {(isCompanyAdmin || isProjectManager) && selectedCount <= 10 && (
          <DropdownMenuItem
            onClick={onGenerateCertificates}
            disabled={isGeneratingCertificates}
            className="flex items-center gap-2 cursor-pointer"
          >
            {isGeneratingCertificates ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Generating Certificates...</span>
              </>
            ) : (
              <>
                <Award className="h-4 w-4 text-green-600" />
                <span>Generate Certificate{selectedCount > 1 ? 's' : ''}</span>
              </>
            )}
          </DropdownMenuItem>
        )}
        
        {/* Delete */}
        {selectedCount > 1 && (
          <DropdownMenuItem
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
          >
            {isBulkDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete {selectedCount} Students</span>
              </>
            )}
          </DropdownMenuItem>
        )}
        
        {/* Sync by Trainee ID - Only show if sync permission */}
        {hasSyncPermission && (
          <>
            {((isCompanyAdmin || isProjectManager) && selectedCount <= 10) || selectedCount > 1 ? (
              <DropdownMenuSeparator />
            ) : null}
            <DropdownMenuLabel>Sync Selected ({selectedCount})</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onSyncPreAssessment}
              disabled={isSyncingPreAssessment}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingPreAssessment ? (
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
              onClick={onSyncPostAssessment}
              disabled={isSyncingPostAssessment}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingPostAssessment ? (
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
              onClick={onSyncEnrollTrainees}
              disabled={isSyncingEnrollTrainees}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingEnrollTrainees ? (
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
              onClick={onSyncCreateTrainees}
              disabled={isSyncingCreateTrainees}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isSyncingCreateTrainees ? (
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
