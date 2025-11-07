import { useState, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Check, ChevronsUpDown, Search } from "lucide-react"

interface Country {
  id: string
  name: string
  description: string
}

interface Region {
  id: string
  name: string
  description: string
  country: Country
}

interface Zone {
  id: string
  name: string
  description: string
  region: Region
}

interface LocationFilterProps {
  countries: Country[]
  regions: Region[]
  zones: Zone[]
  selectedCountryId: string
  selectedRegionId: string
  selectedZoneIds: string[]
  onCountryChange: (countryId: string) => void
  onRegionChange: (regionId: string) => void
  onZoneIdsChange: (zoneIds: string[]) => void
}

export function LocationFilter({
  countries,
  regions,
  zones,
  selectedCountryId,
  selectedRegionId,
  selectedZoneIds,
  onCountryChange,
  onRegionChange,
  onZoneIdsChange
}: LocationFilterProps) {
  // Popover states
  const [openCountries, setOpenCountries] = useState(false)
  const [openRegions, setOpenRegions] = useState(false)
  
  // Search states
  const [countrySearch, setCountrySearch] = useState('')
  const [regionSearch, setRegionSearch] = useState('')
  
  // Debounced search values
  const debouncedCountrySearch = useDebounce(countrySearch, 300)
  const debouncedRegionSearch = useDebounce(regionSearch, 300)

  // Filter available options based on selections
  const availableCountries = useMemo(() => {
    if (!regions || regions.length === 0) return countries || []
    const countryMap = new Map<string, Country>()
    regions.forEach((r) => {
      if (r?.country) countryMap.set(r.country.id, r.country)
    })
    const regionCountries = Array.from(countryMap.values())
    if (!countries || countries.length === 0) return regionCountries
    const countriesById = new Map(countries.map((c: Country) => [c.id, c]))
    return regionCountries.map(rc => countriesById.get(rc.id) || rc)
  }, [countries, regions])

  const availableRegions = useMemo(() => {
    if (!selectedCountryId || !regions) return []
    return regions.filter((region: Region) => 
      region.country.id === selectedCountryId
    )
  }, [regions, selectedCountryId])

  const availableZones = useMemo(() => {
    if (!selectedRegionId || !zones) return []
    return zones.filter((zone: Zone) => 
      zone.region.id === selectedRegionId
    )
  }, [zones, selectedRegionId])

  // Filter data based on search
  const filteredCountries = useMemo(() => {
    return availableCountries.filter((country: Country) =>
      country.name.toLowerCase().includes(debouncedCountrySearch.toLowerCase())
    )
  }, [availableCountries, debouncedCountrySearch])
  
  const filteredRegions = useMemo(() => {
    return availableRegions.filter((region) =>
      region.name.toLowerCase().includes(debouncedRegionSearch.toLowerCase())
    )
  }, [availableRegions, debouncedRegionSearch])

  // Get display names
  const getSelectedCountryName = () => {
    if (!selectedCountryId || !countries) return ""
    const country = countries.find((c: Country) => c.id === selectedCountryId)
    return country?.name || ""
  }

  const getSelectedRegionName = () => {
    if (!selectedRegionId || !availableRegions) return ""
    const region = availableRegions.find(r => r.id === selectedRegionId)
    return region?.name || ""
  }

  // Handle popover state changes
  const handleCountriesOpenChange = (open: boolean) => {
    setOpenCountries(open)
    if (!open) setCountrySearch('')
  }

  const handleRegionsOpenChange = (open: boolean) => {
    setOpenRegions(open)
    if (!open) setRegionSearch('')
  }

  // Handle selection changes
  const handleCountrySelect = (countryId: string) => {
    onCountryChange(countryId)
    setOpenCountries(false)
  }

  const handleRegionSelect = (regionId: string) => {
    onRegionChange(regionId)
    setOpenRegions(false)
  }

  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Location</h4>
      
      {/* Country Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Country</Label>
        <Popover open={openCountries} onOpenChange={handleCountriesOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-10"
              type="button"
            >
              <span className="truncate">
                {getSelectedCountryName() || "Select a country"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country: Country) => (
                  <div
                    key={country.id}
                    className={cn(
                      "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                      selectedCountryId === country.id && "bg-gray-100"
                    )}
                    onClick={() => handleCountrySelect(country.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCountryId === country.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {country.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No countries found
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Region Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Region</Label>
        <Popover open={openRegions} onOpenChange={handleRegionsOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-10"
              disabled={!selectedCountryId}
              type="button"
            >
              <span className="truncate">
                {getSelectedRegionName() || (!selectedCountryId ? "Select country first" : "Select a region")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search regions..."
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredRegions.length > 0 ? (
                filteredRegions.map((region) => (
                  <div
                    key={region.id}
                    className={cn(
                      "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                      selectedRegionId === region.id && "bg-gray-100"
                    )}
                    onClick={() => handleRegionSelect(region.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedRegionId === region.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {region.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  {selectedCountryId ? "No regions found" : "Select country first"}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Zone Multi-Select - Only show when region is selected */}
      {selectedRegionId && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Zones</Label>
          <MultiSelectCombobox
            options={availableZones.map(zone => ({ value: zone.id, label: zone.name }))}
            selected={selectedZoneIds}
            onChange={onZoneIdsChange}
            placeholder="Search and select zones..."
            searchPlaceholder="Search zones..."
            noResultsText="No zones found."
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

