"use client"

import { useModuleInformation } from "@/contexts/ModuleInformationContext"
import { EditFormContainer } from "@/components/ui/edit-form-container"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EstimatedDurations() {
  const { formData, updateFormData } = useModuleInformation()

  return (
    <EditFormContainer title="" description="">
      <div className="space-y-8 pr-0 md:pr-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-base md:text-lg font-semibold">Estimated Duration</h2>
            <p className="text-sm text-[#99948E] mb-4">
              Enter a brief overview of this section
            </p>
            <Input
              type="number"
              value={formData.duration || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : 0
                updateFormData('duration', value)
              }}
              className="text-sm"
              min={0}
            />
          </div>

          <div>
            <h2 className="text-base md:text-lg font-semibold">Duration Type</h2>
            <p className="text-sm text-[#99948E] mb-4">
              Enter a brief overview of this section
            </p>
            <Select 
              value={formData.durationType} 
              onValueChange={(value) => updateFormData('durationType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAYS">Days</SelectItem>
                <SelectItem value="WEEKS">Weeks</SelectItem>
                <SelectItem value="MONTHS">Months</SelectItem>
                <SelectItem value="HOURS">Hours</SelectItem>
                <SelectItem value="MINUTES">Minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </EditFormContainer>
  )
}
