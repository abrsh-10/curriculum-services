"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Plus } from "lucide-react"

interface EvaluationHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onCreateNew: () => void
  canCreateEvaluations: boolean
}

export function EvaluationHeader({
  searchQuery,
  onSearchChange,
  onCreateNew,
  canCreateEvaluations,
}: EvaluationHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <h1 className="text-lg font-semibold">Evaluation</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-[280px] md:w-[300px]">
            <Image
              src="/search.svg"
              alt="Search"
              width={19}
              height={19}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 z-10"
            />
            <Input
              placeholder="Search evaluations..."
              className="pl-10 h-10 text-sm bg-white border-gray-200 w-full"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        {canCreateEvaluations && (
          <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
            <Button
              onClick={onCreateNew}
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
            >
              <Plus className="h-4 w-4" />
              <span>New Evaluation</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
