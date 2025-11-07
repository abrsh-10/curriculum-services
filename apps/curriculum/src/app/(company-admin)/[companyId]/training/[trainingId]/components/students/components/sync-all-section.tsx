"use client"

import { Button } from "@/components/ui/button"
import { FileCheck, GraduationCap, UserPlus } from "lucide-react"

interface SyncAllSectionProps {
  onSyncPreAssessment: () => void
  onSyncPostAssessment: () => void
  onSyncEnrollTrainees: () => void
  onSyncCreateTrainees: () => void
  isSyncingPreAssessment: boolean
  isSyncingPostAssessment: boolean
  isSyncingEnrollTrainees: boolean
  isSyncingCreateTrainees: boolean
}

export function SyncAllSection({
  onSyncPreAssessment,
  onSyncPostAssessment,
  onSyncEnrollTrainees,
  onSyncCreateTrainees,
  isSyncingPreAssessment,
  isSyncingPostAssessment,
  isSyncingEnrollTrainees,
  isSyncingCreateTrainees,
}: SyncAllSectionProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Sync All Students in Training</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          variant="outline"
          onClick={onSyncPreAssessment}
          disabled={isSyncingPreAssessment}
          className="flex items-center gap-2 justify-start"
        >
          {isSyncingPreAssessment ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>Sync Pre-Assessment</span>
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onSyncPostAssessment}
          disabled={isSyncingPostAssessment}
          className="flex items-center gap-2 justify-start"
        >
          {isSyncingPostAssessment ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>Sync Post-Assessment</span>
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onSyncEnrollTrainees}
          disabled={isSyncingEnrollTrainees}
          className="flex items-center gap-2 justify-start"
        >
          {isSyncingEnrollTrainees ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span>Sync Enrollment</span>
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onSyncCreateTrainees}
          disabled={isSyncingCreateTrainees}
          className="flex items-center gap-2 justify-start"
        >
          {isSyncingCreateTrainees ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 text-blue-600" />
              <span>Sync Create Trainees</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

