
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, MoreVertical } from "lucide-react"
import { EvaluationSummary } from "@/lib/hooks/evaluation-types"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

export const evaluationColumns: ColumnDef<EvaluationSummary>[] = [
  {
    id: "name",
    header: "Form Name",
    cell: ({ row }) => {
        const form = row.original;
        const typeLabel = form.formType === 'PRE' ? 'Pre-Training' 
                        : form.formType === 'MID' ? 'Mid-Training' 
                        : 'Post-Training';
      return (
        <div className="flex flex-col">
            <span className="font-medium text-gray-900">
                {`${typeLabel} Evaluation`}
            </span>
            <span className="text-xs text-gray-500">
                Created on {format(new Date(form.createdAt), 'MMM dd, yyyy')}
            </span>
        </div>
      )
    }
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => {
      const form = row.original
      const type = form.formType
      
      const config = {
        PRE: { label: "Pre-Training", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-700" },
        MID: { label: "Mid-Training", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-700" },
        POST: { label: "Post-Training", bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-700" }
      }[type] || { label: type, bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" }
      
      return (
        <Badge variant="secondary" className={`ring-0 border-0 ${config.bg} ${config.text}`}>
          <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </Badge>
      )
    }
  },
  {
    id: "sections",
    header: "Sections",
    cell: ({ row }) => {
      return (
        <span className="text-gray-600">
          {row.original.sectionCount || 0} {row.original.sectionCount === 1 ? 'Section' : 'Sections'}
        </span>
      )
    }
  },
  {
    id: "created",
    header: "Created",
    cell: ({ row }) => {
       return (
        <span className="text-gray-600">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
       )
    }
  }
]

export function createEvaluationActionsColumn(
  onView: (form: EvaluationSummary) => void,
  onEdit: (form: EvaluationSummary) => void,
  onDelete: (form: EvaluationSummary) => void,
  options?: {
    showView?: boolean
    showEdit?: boolean
    showDelete?: boolean
    showAnswer?: boolean
    onAnswer?: (form: EvaluationSummary) => void
  }
): ColumnDef<EvaluationSummary> {
  return {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const form = row.original
      const showView = options?.showView ?? true
      const showEdit = options?.showEdit ?? true
      const showDelete = options?.showDelete ?? true
      const showAnswer = options?.showAnswer ?? false

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
            {showView && (
              <DropdownMenuItem onClick={() => onView(form)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            )}
            
            {showEdit && (
              <DropdownMenuItem onClick={() => onEdit(form)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}

            {showAnswer && options?.onAnswer && (
              <DropdownMenuItem onClick={() => options.onAnswer!(form)}>
                <Eye className="mr-2 h-4 w-4" />
                Answer
              </DropdownMenuItem>
            )}
            
            {showDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(form)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
}

