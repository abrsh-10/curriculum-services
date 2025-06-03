import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { StudentFormValues } from "./formSchemas"
import { useEffect } from "react"

interface EmergencyContactFormProps {
  form: UseFormReturn<StudentFormValues>
}

export function EmergencyContactForm({
  form,
}: EmergencyContactFormProps) {
  // Format emergency phone number to include country code on form submission
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Check if the field being changed is the emergency phone number
      if (name === 'emergencyContactPhone') {
        const phoneValue = values.emergencyContactPhone;
        if (phoneValue && typeof phoneValue === 'string') {
          // If the phone number already includes +251, leave it as is
          if (!phoneValue.startsWith('+251')) {
            // Remove any existing '+251' prefix to avoid duplicates
            const cleanedNumber = phoneValue.replace(/^\+251/, '');
            
            // Save the full number with country code in form data
            form.setValue('emergencyContactPhone', `+251${cleanedNumber}`);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="pb-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency Contact Name */}
        <FormField
          control={form.control}
          name="emergencyContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Emergency Contact Name
              </FormLabel>
              <FormDescription className="text-gray-500 text-sm">
                Enter the name of your emergency contact.
              </FormDescription>
              <FormControl>
                <Input {...field} value={field.value || ""} className="h-12 text-sm md:text-md" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Emergency Contact Phone */}
        <FormField
          control={form.control}
          name="emergencyContactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Emergency Contact Phone
              </FormLabel>
              <FormDescription className="text-gray-500 text-sm">
                Enter their phone number.
              </FormDescription>
              <div className="flex items-center gap-2">
                <div className="w-[142px] h-12 flex items-center px-4 border border-[#E4E4E4] rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">+251</span>
                  </div>
                </div>
                <FormControl>
                  <Input 
                    {...field} 
                    className="h-12 text-sm md:text-md" 
                    placeholder="911436785"
                    // Display only the local part without the +251 prefix
                    value={field.value?.toString().replace(/^\+251/, '') || ''}
                    onChange={(e) => {
                      // Only allow numeric input
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(onlyNums);
                    }}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Emergency Contact Relationship */}
      <FormField
        control={form.control}
        name="emergencyContactRelationship"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Emergency Contact Relationship
            </FormLabel>
            <FormDescription className="text-gray-500 text-sm">
              Specify your relationship with the contact (e.g., Parent, Sibling,
              Friend).
            </FormDescription>
            <FormControl>
              <Input {...field} value={field.value || ""} className="h-12 text-sm md:text-md" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 