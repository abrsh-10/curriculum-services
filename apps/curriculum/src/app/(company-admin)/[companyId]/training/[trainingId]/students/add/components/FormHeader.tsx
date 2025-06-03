import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface FormHeaderProps {
  onCancel: () => void
  isEditing?: boolean
}

export function FormHeader({ onCancel, isEditing = false }: FormHeaderProps) {
  return (
    <div className="flex flex-col mb-6">
      <div className="self-end">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="text-gray-500"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <h2 className="text-xl font-semibold pb-3">
        {isEditing ? "Edit Student" : "Add New Student"}
      </h2>
    </div>
  )
} 