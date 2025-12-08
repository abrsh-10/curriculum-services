import { TriStateFilter } from "./TriStateFilter"

interface CertificateFilterProps {
  isCertified?: boolean
  isCertificateSmsSent?: boolean
  onCertifiedChange: (value: boolean | undefined) => void
  onSmsSentChange: (value: boolean | undefined) => void
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
      <div className="space-y-4">
        <TriStateFilter
          id="certificate"
          label="Is Certified?"
          value={isCertified}
          onChange={onCertifiedChange}
        />
        <TriStateFilter
          id="certificate-sms-sent"
          label="Is Certificate SMS Sent?"
          value={isCertificateSmsSent}
          onChange={onSmsSentChange}
        />
      </div>
    </div>
  )
}

