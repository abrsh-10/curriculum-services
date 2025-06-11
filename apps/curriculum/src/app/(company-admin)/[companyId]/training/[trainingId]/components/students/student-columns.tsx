"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Student } from "@/lib/hooks/useStudents"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export const studentColumns: ColumnDef<Student>[] = [
  {
    id: "name",
    header: "Full Name",
    cell: ({ row }) => {
      const student = row.original
      
      // Get display name
      const name = `${student?.firstName || ''} ${student?.lastName || ''}`.trim()
      
      // Get initials for the avatar
      const initials = name
        .split(' ')
        .map(n => n?.[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2)
      
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100/60 text-blue-600 flex items-center justify-center text-sm font-medium">
            {initials}
          </div>
          <span className="font-medium text-gray-900">{name}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <span className="text-gray-500">{row.original.email || "N/A"}</span>
    }
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date",
    cell: ({ row }) => {
      const dob = row.original.dateOfBirth
      if (!dob) return <span className="text-gray-500">N/A</span>
      
      try {
        return <span className="text-gray-500">{format(new Date(dob), "dd MMM yyyy")}</span>
      } catch (error) {
        return <span className="text-gray-500">Invalid date</span>
      }
    }
  },
  {
    id: "language",
    header: "Language",
    cell: ({ row }) => {
      const language = row.original.language?.name
      
      return (
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1
            bg-blue-50 text-blue-700`}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{language || "Not specified"}</span>
          </div>
        </div>
      )
    }
  },
  {
    id: "trainingExperience",
    header: "Training Experience",
    cell: ({ row }) => {
      const hasExperience = row.original.hasTrainingExperience
      const experienceStatus = hasExperience ? "experienced" : "new"
      
      return (
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1
            ${hasExperience ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            <div className={`w-1.5 h-1.5 rounded-full 
              ${hasExperience ? "bg-green-500" : "bg-amber-500"}`} />
            <span className="capitalize">{experienceStatus}</span>
          </div>
        </div>
      )
    }
  }
]

// Creates the actions column with passed-in handler functions
export const createActionsColumn = (
  handleEditStudent: (student: Student) => void,
  handleDeleteStudent: (student: Student) => void,
  hasEditPermission: boolean
): ColumnDef<Student> => ({
  id: "actions",
  header: "Actions",
  cell: ({ row }) => {
    const student = row.original;
    
    if (!hasEditPermission) {
      return null;
    }
    
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleEditStudent(student)}
          className="h-8 w-8 p-0"
          title="Edit"
        >
          <Pencil className="h-4 w-4 text-gray-500" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleDeleteStudent(student)}
          className="h-8 w-8 p-0"
          title="Delete"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    )
  }
})

// Creates a remove column specifically for removing students from cohorts
export const createRemoveFromCohortColumn = (
  handleRemoveStudent: (student: Student) => void,
  hasRemovePermission: boolean,
  isRemoving?: boolean
): ColumnDef<Student> => ({
  id: "remove",
  header: "Actions",
  cell: ({ row }) => {
    const student = row.original;
    
    if (!hasRemovePermission) {
      return null;
    }
    
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleRemoveStudent(student)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          title="Remove from Cohort"
          disabled={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }
}) 