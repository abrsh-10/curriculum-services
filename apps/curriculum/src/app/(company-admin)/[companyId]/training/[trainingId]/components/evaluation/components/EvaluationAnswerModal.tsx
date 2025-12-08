 "use client"
 
import { useMemo, useState, useEffect } from "react"
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
 import { Button } from "@/components/ui/button"
 import { Badge } from "@/components/ui/badge"
 import { ArrowLeft, ArrowRight } from "lucide-react"
 import { EvaluationSummary, EvaluationQuestionType } from "@/lib/hooks/evaluation-types"
 import { useGetEvaluationDetail, useAnswerEvaluationEntry } from "@/lib/hooks/useEvaluation"
 import { Loading } from "@/components/ui/loading"
 import { Checkbox } from "@/components/ui/checkbox"
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
 import { Label } from "@/components/ui/label"
 import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"
 
 interface EvaluationAnswerModalProps {
   evaluation: EvaluationSummary | null
   isOpen: boolean
   onClose: () => void
 }
 
 export function EvaluationAnswerModal({ evaluation, isOpen, onClose }: EvaluationAnswerModalProps) {
  const { data: evaluationDetail, isLoading } = useGetEvaluationDetail(evaluation?.id || "")
   const [currentIndex, setCurrentIndex] = useState(0)
 
   // Local answer state per entry id
   const [selectedChoicesByEntryId, setSelectedChoicesByEntryId] = useState<Record<string, Set<string>>>({})
   const [textAnswersByEntryId, setTextAnswersByEntryId] = useState<Record<string, string>>({})
  const [answeredByEntryId, setAnsweredByEntryId] = useState<Record<string, string[]>>({})
 
   const answerMutation = useAnswerEvaluationEntry()
 
   // Flatten questions with follow-ups grouped under triggering choices
   const processedQuestions = useMemo(() => {
     const list = evaluationDetail?.sections?.flatMap(section => {
       const questions = section.questions || []
       const mains = questions.filter(q => !q.isFollowUp)
       const follows = questions.filter(q => q.isFollowUp)
       return mains.map(main => ({
         ...main,
         sectionTitle: section.title,
         sectionDescription: section.description,
         choices: (main.choices || []).map(choice => ({
           ...choice,
           followUps: follows.filter(f => f.parentQuestionId === main.id && f.triggerChoiceIds?.includes(choice.id))
         }))
       }))
     }).flat() || []
     return list
   }, [evaluationDetail])
 
  const total = processedQuestions.length
  const current = processedQuestions[currentIndex]
 
  const isAnsweredEntry = (entry: any) => {
    if (!entry?.id) return false
    const selected = answeredByEntryId[entry.id]
    return Array.isArray(selected) && selected.length > 0
  }

  // Fetch answered state for current entry + its follow-ups when slide changes
  useEffect(() => {
    const fetchAnsweredForCurrent = async () => {
      if (!current) return
      const token = getCookie('token')
      if (!token) return

      const ids: string[] = [current.id]
      // collect potential follow-up ids (we don't know which are triggered yet, fetch all that exist)
      ;(current.choices || []).forEach((c: any) => {
        (c.followUps || []).forEach((f: any) => {
          if (f?.id) ids.push(f.id)
        })
      })

      try {
        const results = await Promise.all(ids.map(async (id) => {
          const resp = await axios.get(
            `${process.env.NEXT_PUBLIC_API}/monitoring-form-entry/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          const entry = resp?.data?.entry
          const selectedIds = (entry?.choices || []).filter((ch: any) => ch?.isSelected).map((ch: any) => ch.id)
          return { id, selectedIds }
        }))

        // Update answered map and initialize local selected choices accordingly
        setAnsweredByEntryId(prev => {
          const next = { ...prev }
          results.forEach(({ id, selectedIds }) => {
            next[id] = selectedIds
          })
          return next
        })
        setSelectedChoicesByEntryId(prev => {
          const next = { ...prev }
          results.forEach(({ id, selectedIds }) => {
            if (selectedIds.length > 0) next[id] = new Set(selectedIds)
          })
          return next
        })
      } catch {
        // swallow for now
      }
    }
    fetchAnsweredForCurrent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, evaluationDetail])
 
   const toggleCheckbox = (entryId: string, choiceId: string) => {
     setSelectedChoicesByEntryId(prev => {
       const next = new Set(prev[entryId] || [])
       if (next.has(choiceId)) next.delete(choiceId)
       else next.add(choiceId)
       return { ...prev, [entryId]: next }
     })
   }
 
   const setRadio = (entryId: string, choiceId: string) => {
     setSelectedChoicesByEntryId(prev => ({ ...prev, [entryId]: new Set([choiceId]) }))
   }
 
   const handleSubmitAnswers = async () => {
     if (!current) return
 
     const ops: Array<Promise<any>> = []
 
     // Submit main
     const mainSelected = Array.from(selectedChoicesByEntryId[current.id] || [])
     const mainText = textAnswersByEntryId[current.id]
     if ((current.questionType === "TEXT" && mainText?.trim()) || (current.questionType !== "TEXT" && mainSelected.length > 0)) {
       ops.push(answerMutation.mutateAsync({
         entryId: current.id,
         data: {
           selectedChoiceIds: current.questionType === "TEXT" ? undefined : mainSelected,
           textAnswer: current.questionType === "TEXT" ? mainText : undefined
         }
       }))
      // reflect answered state locally
      if (current.questionType !== "TEXT" && mainSelected.length > 0) {
        setAnsweredByEntryId(prev => ({ ...prev, [current.id]: mainSelected }))
      }
     }
 
     // Submit follow-ups for the selected choice (RADIO/CHECKBOX)
     if (current.questionType !== "TEXT") {
       const selectedForFollowUps = new Set(mainSelected)
       const selectedChoiceObjects = (current.choices || []).filter((c: any) => selectedForFollowUps.has(c.id))
       for (const choice of selectedChoiceObjects) {
         const followUps = (choice as any).followUps || []
         for (const f of followUps) {
           const fSelected = Array.from(selectedChoicesByEntryId[f.id] || [])
           const fText = textAnswersByEntryId[f.id]
           if ((f.questionType === "TEXT" && fText?.trim()) || (f.questionType !== "TEXT" && fSelected.length > 0)) {
             ops.push(answerMutation.mutateAsync({
               entryId: f.id,
               data: {
                 selectedChoiceIds: f.questionType === "TEXT" ? undefined : fSelected,
                 textAnswer: f.questionType === "TEXT" ? fText : undefined
               }
             }))
            if (f.questionType !== "TEXT" && fSelected.length > 0) {
              setAnsweredByEntryId(prev => ({ ...prev, [f.id]: fSelected }))
            }
           }
         }
       }
     }
 
     if (ops.length > 0) {
       await Promise.all(ops)
     }
   }
 
   const disabledMain = current ? isAnsweredEntry(current) : false
 
   const renderEntry = (entry: any, isFollowUp = false) => {
     const currentSelected = selectedChoicesByEntryId[entry.id] || new Set<string>()
     const isAnswered = isAnsweredEntry(entry)
     const disabled = isAnswered || answerMutation.isPending
 
     return (
       <div className={`${isFollowUp ? 'mt-3 pl-4 border-l-2 border-amber-200' : ''}`}>
         <div className="flex items-start justify-between mb-2">
           <div className="flex-1 min-w-0">
             <p className={`text-sm ${isFollowUp ? 'font-medium' : 'text-base font-medium'} text-slate-800 break-words`}>
               {entry.question}
             </p>
           </div>
           <Badge variant="secondary" className="text-[10px] md:text-xs whitespace-nowrap">
             {entry.questionType === 'RADIO' ? 'Single Choice' : entry.questionType === 'CHECKBOX' ? 'Multiple Choice' : 'Text Response'}
           </Badge>
         </div>
 
         {entry.questionImageUrl && (
           <div className="mb-2">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={entry.questionImageUrl} alt="question" className="w-48 h-32 object-cover rounded border" />
           </div>
         )}
 
         {entry.questionType === "TEXT" ? (
           <div>
             <Label className="sr-only">Text answer</Label>
             <Textarea
               value={textAnswersByEntryId[entry.id] || ""}
               onChange={(e) => setTextAnswersByEntryId(prev => ({ ...prev, [entry.id]: e.target.value }))}
               placeholder="Type your answer..."
               disabled={disabled}
               className="min-h-[88px]"
             />
           </div>
         ) : entry.questionType === "RADIO" ? (
           <RadioGroup className="space-y-2 mt-1" value={Array.from(currentSelected)[0]} onValueChange={(v) => setRadio(entry.id, v)} disabled={disabled}>
             {(entry.choices || []).map((c: any, idx: number) => (
               <div key={c.id} className="flex items-center gap-2 min-w-0">
                 <RadioGroupItem id={`entry-${entry.id}-${c.id}`} value={c.id} />
                 <Label htmlFor={`entry-${entry.id}-${c.id}`} className="text-sm font-normal flex items-center gap-2 w-full min-w-0">
                   <span className="truncate" title={c.choiceText}>{c.choiceText}</span>
                   {c.choiceImageUrl && (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={c.choiceImageUrl} alt="" className="h-6 w-6 object-cover rounded border flex-shrink-0" />
                   )}
                 </Label>
               </div>
             ))}
           </RadioGroup>
         ) : (
           <div className="space-y-2 mt-1">
             {(entry.choices || []).map((c: any) => (
               <div key={c.id} className="flex items-center gap-2 min-w-0">
                 <Checkbox
                   id={`entry-${entry.id}-${c.id}`}
                   checked={currentSelected.has(c.id)}
                   onCheckedChange={() => toggleCheckbox(entry.id, c.id)}
                   disabled={disabled}
                 />
                 <Label htmlFor={`entry-${entry.id}-${c.id}`} className="text-sm font-normal flex items-center gap-2 w-full min-w-0">
                   <span className="truncate" title={c.choiceText}>{c.choiceText}</span>
                   {c.choiceImageUrl && (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={c.choiceImageUrl} alt="" className="h-6 w-6 object-cover rounded border flex-shrink-0" />
                   )}
                 </Label>
               </div>
             ))}
           </div>
         )}
 
         {/* Follow-ups for selected choices */}
         {entry.questionType !== "TEXT" && (entry.choices || []).some((c: any) => currentSelected.has(c.id) && (c.followUps || []).length > 0) && (
           <div className="mt-4 space-y-3">
             {(entry.choices || []).filter((c: any) => currentSelected.has(c.id)).map((c: any) => (
               <div key={c.id}>
                 {(c.followUps || []).map((f: any) => (
                   <div key={f.id}>
                     {renderEntry(f, true)}
                   </div>
                 ))}
               </div>
             ))}
           </div>
         )}
 
         {isAnswered && (
           <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 inline-block">
             Answered
           </div>
         )}
       </div>
     )
   }
 
   const handleClose = () => {
     setCurrentIndex(0)
     setSelectedChoicesByEntryId({})
     setTextAnswersByEntryId({})
     onClose()
   }
 
   return (
     <Dialog open={isOpen} onOpenChange={handleClose}>
       <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
         <DialogHeader className="flex-shrink-0">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={handleClose} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
               <ArrowLeft className="h-4 w-4" />
               Back
             </Button>
             <DialogTitle className="text-lg font-semibold">
               Answer Evaluation
             </DialogTitle>
           </div>
         </DialogHeader>
 
         {isLoading ? (
           <div className="flex-1 flex items-center justify-center py-12">
             <Loading />
           </div>
         ) : !current ? (
           <div className="flex-1 flex items-center justify-center py-12">
             <p className="text-gray-500">No questions available.</p>
           </div>
         ) : (
           <div className="flex-1 overflow-y-auto pr-2 md:pr-4">
             {/* Section */}
             <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded">
               <h2 className="text-sm font-semibold text-slate-800 truncate">{current.sectionTitle}</h2>
               {current.sectionDescription && (
                 <p className="text-xs text-slate-600 mt-1 line-clamp-2">{current.sectionDescription}</p>
               )}
             </div>
 
             {/* Main entry */}
             {renderEntry(current)}
 
             {/* Actions */}
             <div className="flex items-center justify-between pt-4 border-t mt-6">
               <div className="flex items-center gap-2">
                 <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
                   <ArrowLeft className="h-4 w-4 mr-1" />
                   Previous
                 </Button>
                 <span className="text-sm text-gray-600">
                   {currentIndex + 1} of {total}
                 </span>
                 <Button variant="outline" onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))} disabled={currentIndex === total - 1}>
                   Next
                   <ArrowRight className="h-4 w-4 ml-1" />
                 </Button>
               </div>
               <div className="flex items-center gap-2">
                 <Button onClick={handleSubmitAnswers} disabled={answerMutation.isPending || disabledMain} className="bg-blue-600 text-white hover:bg-blue-700">
                   {answerMutation.isPending ? "Submitting..." : disabledMain ? "Already answered" : "Submit Answer"}
                 </Button>
               </div>
             </div>
           </div>
         )}
       </DialogContent>
     </Dialog>
   )
 }
 

