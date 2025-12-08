import { TriStateFilter } from "./TriStateFilter"

interface ConsentFormFilterProps {
  hasConsentForm?: boolean
  onChange: (value: boolean | undefined) => void
}

export function ConsentFormFilter({ hasConsentForm, onChange }: ConsentFormFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Consent Form</h4>
      <TriStateFilter
        id="consent-form"
        label="Has Consent Form"
        value={hasConsentForm}
        onChange={onChange}
      />
    </div>
  )
}

