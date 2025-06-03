"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useGetContents } from "@/lib/hooks/useContent"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { ContentRequestModal } from "./content/contentRequestModal"
import { columns } from "./content/columns"
import { DataTable } from "./content/data-table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useUserRole } from "@/lib/hooks/useUserRole"

export function Content() {
  const params = useParams()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  
  const debouncedSearch = useDebounce(searchQuery, 500)
  const { isContentDeveloper, isIcogAdmin } = useUserRole()
  const canRequestContent = !isContentDeveloper && !isIcogAdmin

  const { data, isLoading } = useGetContents({
    trainingId: params.trainingId as string,
    page,
    pageSize,
    searchQuery: debouncedSearch
  })

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="px-[7%] py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Content</h1>
        {canRequestContent && (
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            onClick={() => setShowRequestModal(true)}
          >
            <span>+</span>
            <span>Request Content</span>
          </Button>
        )}
      </div>

      {!data?.contents.length && !searchQuery ? (
        <div className="text-center py-40 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">No Content Found</h3>
          <p className="text-gray-500 text-sm">
            This specifies the core teaching methods used to deliver content and facilitate learning.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center lg:justify-end gap-3 mb-6">
            <div className="relative md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by Name"
                className="pl-10 h-10 bg-white border-gray-200 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* <Button 
              variant="outline" 
              size="default"
              className="h-10 px-4 border-gray-200 rounded-lg font-medium"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
            </Button> */}
          </div>

          <DataTable
            data={data?.contents || []}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              pageCount: data?.totalPages || 1,
              page,
              setPage,
              pageSize,
              setPageSize,
              showingText: `Showing ${data?.contents.length || 0} of ${data?.totalElements || 0} results`
            }}
          />
        </>
      )}

      <ContentRequestModal 
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </div>
  )
}
