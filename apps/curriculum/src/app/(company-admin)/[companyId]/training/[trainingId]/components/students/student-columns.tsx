"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import { Student, useUploadConsentForm } from "@/lib/hooks/useStudents"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Upload, FileText, Loader2 } from "lucide-react"
export type { ColumnDef } from "@tanstack/react-table"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Base student columns without selection - for when selection is not needed
export const studentColumnsBase: ColumnDef<Student>[] = [
  {
    id: "name",
    header: "Full Name",
    cell: ({ row }) => {
      const student = row.original
      
      // Get display name including middle name if it exists
      const nameParts = [
        student?.firstName || '',
        student?.middleName || '',
        student?.lastName || ''
      ].filter(Boolean) // Remove empty parts
      
      const name = nameParts.join(' ').trim()
      
      // Get initials for the avatar from first and last name primarily
      const initials = [
        student?.firstName?.[0] || '',
        student?.lastName?.[0] || student?.middleName?.[0] || ''
      ].filter(Boolean)
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
    accessorKey: "contactPhone",
    header: "Phone Number",
    cell: ({ row }) => {
      return <span className="text-gray-500">{row.original.contactPhone || "N/A"}</span>
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
      } catch {
        return <span className="text-gray-500">Invalid date</span>
      }
    }
  },

  {
    accessorKey: "cohortName",
    header: "Cohort Name",
    cell: ({ row }) => {
        return <span className="text-gray-500">{row.original.cohortName || "N/A"}</span>
      }
  },
  {
    id: "certificate",
    header: "Certificate",
    cell: ({ row }) => {
      const certificateUrl = row.original.certificateUrl
      
      if (!certificateUrl) {
        return <span className="text-gray-400 text-sm">No Certificate</span>
      }
      
      return (
        <a 
          href={certificateUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-xs gap-1.5 text-green-600 hover:text-green-800 underline"
        >
          <FileText className="h-4 w-4" />
          <span>View Certificate</span>
        </a>
      )
    }
  },

]

// Student columns with selection checkbox
export const createStudentColumnsWithSelection = (): ColumnDef<Student>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        aria-label="Select all students"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
      />
    ),
  },
  ...studentColumnsBase
]

// Default export maintains backward compatibility
export const studentColumns = studentColumnsBase

// Creates the actions column with passed-in handler functions
export const createActionsColumn = (
  handleEditStudent: (_: Student) => void,
  handleDeleteStudent: (_: Student) => void,
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
// ConsentFormCell component for handling upload and display
interface ConsentFormCellProps {
  student: Student;
}

export const ConsentFormCell = ({ student }: ConsentFormCellProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadConsentForm } = useUploadConsentForm();
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image or PDF
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('Please upload an image or PDF file');
      return;
    }

    try {
      setIsUploading(true);
      await uploadConsentForm({ id: student.id, consentFormFile: file });
      // Show a refreshing state until the parent table refetches and provides the updated URL
      setIsRefreshing(true);
      // Proactively refetch the students list (and this student) to reflect the change ASAP
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', student.id] });
      await queryClient.refetchQueries({ queryKey: ['students'] });
    } catch (error) {
      console.error('Error uploading consent form:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Turn off refreshing once the consentFormUrl becomes available from parent data
  useEffect(() => {
    if (student.consentFormUrl) {
      setIsRefreshing(false);
    }
  }, [student.consentFormUrl]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Determine which URL to use - prioritize signatureUrl, then consentFormUrl
  const formUrl = student.signatureUrl || student.consentFormUrl;

  // If student already has a consent form or signature
  if (formUrl) {
    return (
      <div className="flex items-center gap-1">
        <a 
          href={formUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-xs gap-1.5 text-blue-600 hover:text-blue-800 underline"
        >
          <FileText className="h-4 w-4" />
          <span>View Form</span>
        </a>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,application/pdf"
          className="hidden"
          aria-label="Edit consent form" 
          title="Edit consent form"
        />
        {isRefreshing ? (
          <div className="h-8 w-8 flex items-center justify-center" title="Refreshing">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="h-8 w-8 p-0"
            title="Edit Consent Form"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-2 w-2 text-gray-500" />
            )}
          </Button>
        )}
      </div>
    );
  }

  // If no consent form uploaded yet
  return (
    <div className="flex items-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*,application/pdf"
        className="hidden"
        aria-label="Upload consent form" 
        title="Upload consent form"
      />
      {isRefreshing ? (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
          className={cn(
            "flex items-center gap-1.5 text-gray-600 hover:text-blue-600",
            isUploading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload Consent</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

// Create a column for the consent form
export const createConsentFormColumn = (): ColumnDef<Student> => ({
  id: "consentForm",
  header: "Consent Form",
  cell: ({ row }) => {
    return <ConsentFormCell student={row.original} />;
  }
});

export const createRemoveFromCohortColumn = (
  handleRemoveStudent: (_: Student) => void,
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