import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EvaluationFormType } from "@/lib/hooks/evaluation-types"

interface EvaluationSettingsProps {
  formType: EvaluationFormType
  setFormType: (value: EvaluationFormType) => void
  onNext: () => void
}

export function EvaluationSettings({
  formType,
  setFormType,
  onNext
}: EvaluationSettingsProps) {
  return (
    <Card className="p-0">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Evaluation Settings</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Evaluation Type</label>
            <p className="text-sm text-gray-500">
              Select when this evaluation should be administered during the training lifecycle.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div 
                className={`flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all ${
                  formType === 'PRE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormType('PRE')}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    formType === 'PRE' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {formType === 'PRE' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Pre-Training</div>
                    <p className="text-xs text-gray-500">Before training starts</p>
                  </div>
                </div>
              </div>

              <div 
                className={`flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all ${
                  formType === 'MID' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormType('MID')}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    formType === 'MID' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {formType === 'MID' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Mid-Training</div>
                    <p className="text-xs text-gray-500">During training</p>
                  </div>
                </div>
              </div>

              <div 
                className={`flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all ${
                  formType === 'POST' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormType('POST')}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    formType === 'POST' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {formType === 'POST' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Post-Training</div>
                    <p className="text-xs text-gray-500">After completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white">
            Continue to Questions
          </Button>
        </div>
      </div>
    </Card>
  )
}
