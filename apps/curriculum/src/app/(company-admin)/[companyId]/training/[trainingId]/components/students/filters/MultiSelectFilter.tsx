import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"

interface Option {
  id: string
  name: string
}

interface MultiSelectFilterProps {
  title: string
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  noResultsText?: string
}

export function MultiSelectFilter({
  title,
  options,
  selected,
  onChange,
  placeholder = "Search and select...",
  searchPlaceholder = "Search...",
  noResultsText = "No results found."
}: MultiSelectFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">{title}</h4>
      <MultiSelectCombobox
        options={options.map(opt => ({ value: opt.id, label: opt.name }))}
        selected={selected}
        onChange={onChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        noResultsText={noResultsText}
        className="w-full"
      />
    </div>
  )
}

