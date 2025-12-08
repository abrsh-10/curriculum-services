"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, CheckCircle2, PlusCircle, MoreVertical } from "lucide-react"
import { AssessmentSummary } from "@/lib/hooks/useAssessment"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Base assessment columns
export const assessmentColumns: ColumnDef<AssessmentSummary>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <span 
          className="font-medium text-gray-900 max-w-[220px] truncate block" 
          title={row.original.name}
        >
          {row.original.name}
        </span>
      )
    }
  },
  {
    id: "assessmentType",
    header: "Assessment Type",
    cell: ({ row }) => {
      return (
        <span className=" text-gray-500">Pre and Post Training</span>
      )
    }
  },
  {
    id: "assignedTo", 
    header: "Assigned To",
    cell: ({ row }) => {
      const assessment = row.original
      
      if (assessment.contentDeveloper) {
        const dev = assessment.contentDeveloper as unknown as {
          firstName: string | null
          lastName: string | null
          email: string
          role?: { name: string }
        }
        const displayName = (dev.firstName || dev.lastName)
          ? `${dev.firstName || ''} ${dev.lastName || ''}`.trim()
          : (dev.email?.split('@')[0] || 'Content Developer')
        const roleName = dev.role?.name === 'ROLE_CONTENT_DEVELOPER' ? 'Content Developer' : dev.role?.name || ''
        return (
          <div className="flex flex-col">
            <span className="text-[#1D4ED8] font-semibold text-sm">{displayName}</span>
            <span className=" text-xs text-gray-500">{roleName}</span>
          </div>
        )
      }
      
      return (
        <span className="text-gray-500">
          Not assigned
        </span>
      )
    }
  },
  {
    id: "cohort",
    header: "Cohort", 
    cell: ({ row }) => {
      const assessment = row.original
      
      // Only show cohorts if they actually exist and are not empty
      if (assessment.cohorts && assessment.cohorts.length > 0) {
        const cohortNames = assessment.cohorts.slice(0, 2).map(c => c.name).join(', ')
        const extra = assessment.cohorts.length > 2 ? ` +${assessment.cohorts.length - 2} more` : ''
        return (
          <span className="font-medium text-gray-900 text-sm">{cohortNames}{extra}</span>
        )
      }
      
      // Show "Not assigned" when no cohorts exist
      return (
        <span className="text-gray-400">
          Not assigned
        </span>
      )
    }
  },
  {
    id: "approvalStatus",
    header: "Approval Status",
    cell: ({ row }) => {
      const assessment = row.original
      const status = assessment.approvalStatus
      
      const statusConfig = {
        PENDING: {
          label: "Pending",
        },
        APPROVED: {
          label: "Approved", 
        },
        REJECTED: {
          label: "Rejected",
        }
      }
      
      const config = statusConfig[status] || statusConfig.PENDING
      
      const variant = status === 'APPROVED' 
        ? 'approved' 
        : status === 'REJECTED' 
          ? 'rejected' 
          : 'pending'
      
      const dotClass = status === 'APPROVED'
        ? 'bg-green-700'
        : status === 'REJECTED'
          ? 'bg-red-700'
          : 'bg-[#1D4ED8]' // brand for pending
      
      // Subtle background + brand-aligned text colors
      const bgClass = status === 'APPROVED'
        ? 'bg-green-50'
        : status === 'REJECTED'
          ? 'bg-red-50'
          : 'bg-blue-50'
      
      const textClass = status === 'APPROVED'
        ? 'text-green-700'
        : status === 'REJECTED'
          ? 'text-red-700'
          : 'text-[#1D4ED8]' // brand for pending
      
      return (
        <Badge variant={variant} className={`ring-0 ${bgClass} ${textClass}`}>
          <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {config.label}
        </Badge>
      )
    }
  }
]

// Create actions column
export function createAssessmentActionsColumn(
  onView: (assessment: AssessmentSummary) => void,
  onEdit: (assessment: AssessmentSummary) => void,
  onSettings: (assessment: AssessmentSummary) => void,
  onDelete: (assessment: AssessmentSummary) => void,
  hasEditPermission: boolean,
  onApprove?: (assessment: AssessmentSummary) => void,
  canApprove?: (assessment: AssessmentSummary) => boolean,
  onAddContent?: (assessment: AssessmentSummary) => void,
  canAddContent?: (assessment: AssessmentSummary) => boolean
): ColumnDef<AssessmentSummary> {
  return {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const assessment = row.original

      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onView(assessment)}
              onSelect={(e) => e.preventDefault()}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            
            {hasEditPermission && (
              <>
                {canAddContent?.(assessment) && onAddContent ? (
                  <DropdownMenuItem 
                    onClick={() => onAddContent(assessment)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Content
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => onEdit(assessment)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                
                {onApprove && canApprove?.(assessment) && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      // Small delay to let dropdown close first
                      setTimeout(() => onApprove(assessment), 0)
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault()
                    // Small delay to let dropdown close first
                    setTimeout(() => onDelete(assessment), 0)
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
}

// Create columns with actions
export function createAssessmentColumnsWithActions(
  onView: (assessment: AssessmentSummary) => void,
  onEdit: (assessment: AssessmentSummary) => void,
  onSettings: (assessment: AssessmentSummary) => void,
  onDelete: (assessment: AssessmentSummary) => void,
  hasEditPermission: boolean,
  onApprove?: (assessment: AssessmentSummary) => void,
  canApprove?: (assessment: AssessmentSummary) => boolean,
  onAddContent?: (assessment: AssessmentSummary) => void,
  canAddContent?: (assessment: AssessmentSummary) => boolean
): ColumnDef<AssessmentSummary>[] {
  return [
    ...assessmentColumns,
    createAssessmentActionsColumn(
      onView,
      onEdit,
      onSettings,
      onDelete,
      hasEditPermission,
      onApprove,
      canApprove,
      onAddContent,
      canAddContent,
    )
  ]
}
