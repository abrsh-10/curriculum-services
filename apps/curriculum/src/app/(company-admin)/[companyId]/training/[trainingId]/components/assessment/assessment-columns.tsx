"use client"

import { ColumnDef } from "@tanstack/react-table"
import { TrainingAssessment } from "@/lib/hooks/useTrainingAssessment"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Link } from "lucide-react"

export const AssessmentColumns: ColumnDef<TrainingAssessment>[] = [
  {
    id: "name",
    header: "Assessment Name",
    cell: ({ row }) => {
      const assessment = row.original
      return (
        <div className="font-medium text-gray-900">{assessment.name}</div>
      )
    }
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description || "No description"
      // Truncate description if it's too long
      const truncated = description.length > 100 ? `${description.substring(0, 100)}...` : description
      return <span className="text-gray-500">{truncated}</span>
    }
  },
  {
    id: "trainingAssessmentType",
    header: "Type",
    cell: ({ row }) => {
      const assessmentType = row.original.trainingAssessmentType
      
      return (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            assessmentType === 'PRE' 
              ? 'bg-[#EBF4FF] text-[#0B75FF]'
              : 'bg-[#f9f9db] text-[#959713]'
          }`}>
            {assessmentType === 'PRE' ? 'Pre-Training' : 'Post-Training'}
          </span>
        </div>
      )
    }
  },
  {
    id: "fileLink",
    header: "File Link",
    cell: ({ row }) => {
      const fileLink = row.original.fileLink
      
      return (
        <div className="flex items-center gap-2">
          {fileLink ? (
            <a 
              href={fileLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Link className="h-4 w-4" />
              View File
            </a>
          ) : (
            <span className="text-gray-500">No file attached</span>
          )}
        </div>
      )
    }
  },
  {
    id: "session",
    header: "Assigned Session",
    cell: ({ row }) => {
      const sessionName = row.original.sessionName
      
      return (
        <div className="flex items-center gap-2">
          {sessionName ? (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>{sessionName}</span>
            </div>
          ) : (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Not Assigned</span>
            </div>
          )}
        </div>
      )
    }
  }
]

// Creates the actions column with passed-in handler functions
export const createActionsColumn = (
  handleEditAssessment: (assessment: TrainingAssessment) => void,
  handleDeleteAssessment: (assessment: TrainingAssessment) => void,
  handleAssignSession: (assessment: TrainingAssessment) => void,
  hasEditPermission: boolean,
  isTrainingAdmin: boolean = false,
  isCurriculumAdmin: boolean = false
): ColumnDef<TrainingAssessment> => ({
  id: "actions",
  header: "Actions",
  cell: ({ row }) => {
    const assessment = row.original
    
    if (!hasEditPermission) {
      return null
    }
    
    return (
      <div className="flex items-center gap-2">
        {/* Edit button - hidden from Training Admin */}
        {!isTrainingAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleEditAssessment(assessment)}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
        )}
        
        {/* Assign Session button - hidden from Curriculum Admin */}
        {!isCurriculumAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleAssignSession(assessment)}
            className="h-8 w-8 p-0"
            title="Assign Session"
          >
            <Link className="h-4 w-4 text-blue-500" />
          </Button>
        )}
        
        {/* Delete button - hidden from Training Admin */}
        {!isTrainingAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleDeleteAssessment(assessment)}
            className="h-8 w-8 p-0"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>
    )
  }
}) 