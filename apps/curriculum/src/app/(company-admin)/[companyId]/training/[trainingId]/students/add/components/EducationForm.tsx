import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"
import { AcademicLevel } from "@/lib/hooks/useStudents"
import { StudentFormValues } from "./formSchemas"

interface EducationFormProps {
  form: UseFormReturn<StudentFormValues>
  academicLevels?: AcademicLevel[]
}

export function EducationForm({
  form,
  academicLevels,
}: EducationFormProps) {
  return (
    <div className="pb-8 space-y-6">
      {/* Academic Level & Field of Study */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="academicLevelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Highest Qualification
              </FormLabel>
              <FormDescription className="text-gray-500 text-sm">
                Select your highest qualification.
              </FormDescription>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger className="h-12 text-sm md:text-md select-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {academicLevels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fieldOfStudy"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Field of Study
              </FormLabel>
              <FormDescription className="text-gray-500 text-sm">
                Enter your field of study.
              </FormDescription>
              <FormControl>
                <Input {...field} value={field.value || ""} className="h-12 text-sm md:text-md" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Prior Training Experience */}
      <FormField
        control={form.control}
        name="hasTrainingExperience"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-sm font-medium">
              Prior Training Experience?
            </FormLabel>
            <FormDescription className="text-gray-500 text-sm">
              Do you have any relevant training or experience?
            </FormDescription>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => field.onChange(value === "true")}
                value={field.value ? "true" : "false"}
                className="flex flex-row gap-4 pt-2"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="true" />
                  </FormControl>
                  <FormLabel className="font-normal">Yes</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="false" />
                  </FormControl>
                  <FormLabel className="font-normal">No</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Conditional Training Experience Description */}
      {form.watch("hasTrainingExperience") && (
        <FormField
          control={form.control}
          name="trainingExperienceDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Details of Experience
              </FormLabel>
              <FormDescription className="text-gray-500 text-sm">
                Provide details about your relevant training or experience.
              </FormDescription>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Describe your experience..."
                  className="min-h-[100px] text-sm md:text-md"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
} 