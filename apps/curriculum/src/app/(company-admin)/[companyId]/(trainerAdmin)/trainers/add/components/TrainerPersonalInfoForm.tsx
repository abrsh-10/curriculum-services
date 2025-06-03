"use client"

import { UseFormReturn } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TrainerFormValues } from "../page" // Import the form values type
import { Language } from "@/lib/hooks/useTrainers" // Import Language type if needed separately

interface TrainerPersonalInfoFormProps {
  form: UseFormReturn<TrainerFormValues>
  languages: Language[] // Assuming languages are passed from the main page
  disabled?: boolean
}

export function TrainerPersonalInfoForm({ form, languages, disabled = false }: TrainerPersonalInfoFormProps) {
  return (
    <div className="space-y-8">
      {/* First Section - First Name and Last Name */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-10">
          {/* First Name */}
          <div className="flex-1">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[16px] font-medium text-gray-700">First Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter first name" 
                      {...field} 
                      className="h-12 border-[#E4E4E4] rounded-md"
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Last Name */}
          <div className="flex-1">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[16px] font-medium text-gray-700">Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter last name" 
                      {...field} 
                      className="h-12 border-[#E4E4E4] rounded-md"
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Fayda ID */}
        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="faydaId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[16px] font-medium text-gray-700">Fayda ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter Fayda ID" 
                      {...field} 
                      className="h-12 border-[#E4E4E4] rounded-md"
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex-1"></div> {/* Empty div to maintain layout */}
        </div>
      </div>

      {/* Date of Birth and Gender */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Date of Birth Field */}
          <div className="flex-1">
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[16px] font-medium text-gray-700">Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild disabled={disabled}>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-12 w-full border-[#E4E4E4] rounded-md justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PP")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Gender Field */}
          <div className="flex-1">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[16px] font-medium text-gray-700">Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                    <FormControl>
                      <SelectTrigger className="h-12 border-[#E4E4E4] rounded-md">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* Second Section - Email and Phone */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Email Field */}
          <div className="flex-1">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[16px] font-medium text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Enter email address" 
                      {...field} 
                      className="h-12 border-[#E4E4E4] rounded-md"
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Phone Number with Country Code */}
          <div className="flex-1">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[16px] font-medium text-gray-700">Contact Phone</FormLabel>
                  <div className="flex gap-1.5">
                    <div className="w-[142px]">
                      <div className="flex items-center h-12 px-4 border border-[#E4E4E4] rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center">
                            {/* Ethiopian flag or placeholder icon would go here */}
                            🇪🇹
                          </span>
                          <span className="text-gray-400">+251</span>
                        </div>
                      </div>
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="Enter phone number" 
                        {...field} 
                        className="h-12 border-[#E4E4E4] rounded-md"
                        disabled={disabled}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* We're leaving out other fields like dateOfBirth, gender, and languageId that were in the original form
          but aren't in the current Figma design */}
    </div>
  )
} 