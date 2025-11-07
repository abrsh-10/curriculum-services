import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface CertificateFilterProps {
  isCertified?: boolean
  isCertificateSmsSent?: boolean
  onCertifiedChange: (checked: boolean) => void
  onSmsSentChange: (checked: boolean) => void
}

export function CertificateFilter({ 
  isCertified, 
  isCertificateSmsSent,
  onCertifiedChange,
  onSmsSentChange
}: CertificateFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Certificate</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="certificate"
            checked={isCertified === true}
            onCheckedChange={(checked) => 
              onCertifiedChange(checked ? true : false)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="certificate"
            className="text-base font-normal"
          >
            Is Certified?
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="certificate-sms-sent"
            checked={isCertificateSmsSent === true}
            onCheckedChange={(checked) => 
              onSmsSentChange(checked ? true : false)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="certificate-sms-sent"
            className="text-base font-normal"
          >
            Is Certificate SMS Sent?
          </Label>
        </div>
      </div>
    </div>
  )
}

