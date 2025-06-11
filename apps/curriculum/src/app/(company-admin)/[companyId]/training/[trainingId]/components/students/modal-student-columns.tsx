"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Student } from "@/lib/hooks/useStudents"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

// Define columns for the modal student selection table
export const modalStudentColumns: ColumnDef<Student>[] = [
  // Selection Column
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Full Name Column
  {
    accessorKey: "fullName",
    header: "Full Name",
    cell: ({ row }) => {
      const student = row.original
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim()
      return (
        <div className="flex items-center gap-3">
          <span className="font-medium truncate">{fullName || "Unnamed Student"}</span>
        </div>
      )
    }
  },
  // Email Column
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="truncate">{row.original.email || "-"}</div>,
  },
  // Status Column
  {
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }) => {
      const isActive = true; // Placeholder: Assume active for now
      return (
        <Badge variant={isActive ? "active" : "deactivated"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
] 