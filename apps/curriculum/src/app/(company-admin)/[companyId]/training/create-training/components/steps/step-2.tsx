"use client"

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'
import { useBaseData } from '@/lib/hooks/useBaseData'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { StepProps } from '../types'
import { TrainingFormData } from '@/types/training-form'

interface BaseItem {
  id: string;
  name: string;
  description: string;
}

interface Region extends BaseItem {
  country: BaseItem;
}

interface Zone extends BaseItem {
  region: BaseItem;
}

interface City extends BaseItem {
  zone?: BaseItem;
}

export function CreateTrainingStep2({ onNext, onBack, onCancel, isEditing = false }: StepProps) {
  const [openCountries, setOpenCountries] = useState(false);
  const [openRegions, setOpenRegions] = useState(false);
  const [openZones, setOpenZones] = useState(false);
  const [openCities, setOpenCities] = useState(false);
  
  // Search states
  const [countrySearch, setCountrySearch] = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [zoneSearch, setZoneSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  
  // Debounced search values
  const debouncedCountrySearch = useDebounce(countrySearch, 300);
  const debouncedRegionSearch = useDebounce(regionSearch, 300);
  const debouncedZoneSearch = useDebounce(zoneSearch, 300);
  const debouncedCitySearch = useDebounce(citySearch, 300);
  
  const { 
    watch, 
    setValue, 
    formState: { errors } 
  } = useFormContext<TrainingFormData>();
  
  const selectedCountryIds = watch('countryIds') || [];
  const selectedRegionIds = watch('regionIds') || [];
  const selectedZoneIds = watch('zoneIds') || [];
  const selectedCityIds = watch('cityIds') || [];
  
  // Fetch all available countries (no pagination for forms)
  const { data: allCountries, isLoading: isLoadingCountries } = useBaseData('country', { 
    enabled: true,
    disablePagination: true 
  });
  
  // Fetch all regions only when countries are selected
  const { data: allRegions, isLoading: isLoadingRegions } = useBaseData('region', { 
    enabled: selectedCountryIds.length > 0,
    disablePagination: true
  });
  
  // Fetch all zones only when regions are selected
  const { data: allZones, isLoading: isLoadingZones } = useBaseData('zone', { 
    enabled: selectedRegionIds.length > 0,
    disablePagination: true
  });
  
  // Fetch all cities only when zones are selected
  const { data: allCities, isLoading: isLoadingCities } = useBaseData('city', { 
    enabled: selectedZoneIds.length > 0,
    disablePagination: true
  });

  // Filter data based on selections (client-side filtering for hierarchical relationships)
  const availableRegions = (allRegions || []).filter((region: Region) => 
    selectedCountryIds.includes(region.country.id)
  );
  
  const availableZones = (allZones || []).filter((zone: Zone) => 
    selectedRegionIds.includes(zone.region.id)
  );
  
  const availableCities = (allCities || []).filter((city: City) => 
    city.zone && selectedZoneIds.includes(city.zone.id)
  );

  // Filter data based on search
  const filteredCountries = (allCountries || []).filter((country: BaseItem) =>
    country.name.toLowerCase().includes(debouncedCountrySearch.toLowerCase())
  );
  
  const filteredRegions = availableRegions.filter((region: Region) =>
    region.name.toLowerCase().includes(debouncedRegionSearch.toLowerCase())
  );
  
  const filteredZones = availableZones.filter((zone: Zone) =>
    zone.name.toLowerCase().includes(debouncedZoneSearch.toLowerCase())
  );
  
  const filteredCities = availableCities.filter((city: City) =>
    city.name.toLowerCase().includes(debouncedCitySearch.toLowerCase())
  );

  const handleSelectCountry = (countryId: string) => {
    const isSelected = selectedCountryIds.includes(countryId);
    let newCountryIds: string[];
    
    if (isSelected) {
      newCountryIds = selectedCountryIds.filter(id => id !== countryId);
      // Clear dependent selections
      setValue('regionIds', [], { shouldValidate: true });
      setValue('zoneIds', [], { shouldValidate: true });
      setValue('cityIds', [], { shouldValidate: true });
    } else {
      newCountryIds = [...selectedCountryIds, countryId];
    }
    
    setValue('countryIds', newCountryIds, { shouldValidate: true });
  };

  const handleSelectRegion = (regionId: string) => {
    const isSelected = selectedRegionIds.includes(regionId);
    let newRegionIds: string[];
    
    if (isSelected) {
      newRegionIds = selectedRegionIds.filter(id => id !== regionId);
      // Clear dependent selections
      setValue('zoneIds', [], { shouldValidate: true });
      setValue('cityIds', [], { shouldValidate: true });
    } else {
      newRegionIds = [...selectedRegionIds, regionId];
    }
    
    setValue('regionIds', newRegionIds, { shouldValidate: true });
  };

  const handleSelectZone = (zoneId: string) => {
    const isSelected = selectedZoneIds.includes(zoneId);
    let newZoneIds: string[];
    
    if (isSelected) {
      newZoneIds = selectedZoneIds.filter(id => id !== zoneId);
      // Clear dependent selections
      setValue('cityIds', [], { shouldValidate: true });
    } else {
      newZoneIds = [...selectedZoneIds, zoneId];
    }
    
    setValue('zoneIds', newZoneIds, { shouldValidate: true });
  };

  const handleSelectCity = (cityId: string) => {
    const isSelected = selectedCityIds.includes(cityId);
    const newCityIds = isSelected
      ? selectedCityIds.filter(id => id !== cityId)
      : [...selectedCityIds, cityId];
    
    setValue('cityIds', newCityIds, { shouldValidate: true });
  };

  // Clear search when popovers close
  const handleCountriesOpenChange = (open: boolean) => {
    setOpenCountries(open);
    if (!open) setCountrySearch('');
  };

  const handleRegionsOpenChange = (open: boolean) => {
    setOpenRegions(open);
    if (!open) setRegionSearch('');
  };

  const handleZonesOpenChange = (open: boolean) => {
    setOpenZones(open);
    if (!open) setZoneSearch('');
  };

  const handleCitiesOpenChange = (open: boolean) => {
    setOpenCities(open);
    if (!open) setCitySearch('');
  };

  return (
    <div className="space-y-8 min-h-0">
      <div>
        <h2 className="lg:text-2xl md:text-xl text-lg font-semibold mb-2 text-center">
          Where will the training take place?
        </h2>
        <p className="lg:text-sm md:text-xs text-xs text-gray-500 text-center mb-8">
          Select the countries, regions, zones, and optionally cities
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6 relative">
        {/* Countries */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Countries <span className="text-red-500">*</span></label>
          <Popover open={openCountries} onOpenChange={handleCountriesOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingCountries}
                type="button"
              >
                <div className="flex flex-wrap gap-1 max-w-[calc(100%-2rem)] overflow-hidden">
                  {selectedCountryIds.length > 0 ? (
                    selectedCountryIds.map(countryId => {
                      const country = allCountries?.find((c: BaseItem) => c.id === countryId);
                      return (
                        <Badge key={countryId} variant="pending" className="text-xs">
                          {country?.name}
                        </Badge>
                      );
                    })
                  ) : (
                    "Select countries..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
              {/* Search Input */}
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
              <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country: BaseItem) => (
                    <div
                      key={country.id}
                      className={cn(
                        "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100",
                        selectedCountryIds.includes(country.id) && "bg-gray-100"
                      )}
                      onClick={() => handleSelectCountry(country.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountryIds.includes(country.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {country.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {countrySearch ? "No countries found" : "No countries available"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {errors.countryIds && (
            <p className="text-sm text-red-500">{errors.countryIds.message}</p>
          )}
        </div>

        {/* Regions */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Regions <span className="text-red-500">*</span></label>
          <Popover open={openRegions} onOpenChange={handleRegionsOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingRegions || !selectedCountryIds.length}
                type="button"
              >
                <div className="flex flex-wrap gap-1 max-w-[calc(100%-2rem)] overflow-hidden">
                  {selectedRegionIds.length > 0 ? (
                    selectedRegionIds.map(regionId => {
                      const region = availableRegions.find((r: Region) => r.id === regionId);
                      return (
                        <Badge key={regionId} variant="pending" className="text-xs">
                          {region?.name}
                        </Badge>
                      );
                    })
                  ) : (
                    "Select regions..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
              {/* Search Input */}
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
              <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto">
                {filteredRegions.length > 0 ? (
                  filteredRegions.map((region: Region) => (
                    <div
                      key={region.id}
                      className={cn(
                        "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100",
                        selectedRegionIds.includes(region.id) && "bg-gray-100"
                      )}
                      onClick={() => handleSelectRegion(region.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRegionIds.includes(region.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {region.name} ({region.country.name})
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {regionSearch ? "No regions found" : selectedCountryIds.length ? "No regions available for selected countries" : "Please select countries first"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Zones */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Zones <span className="text-red-500">*</span></label>
          <Popover open={openZones} onOpenChange={handleZonesOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingZones || !selectedRegionIds.length}
                type="button"
              >
                <div className="flex flex-wrap gap-1 max-w-[calc(100%-2rem)] overflow-hidden">
                  {selectedZoneIds.length > 0 ? (
                    selectedZoneIds.map(zoneId => {
                      const zone = availableZones.find((z: Zone) => z.id === zoneId);
                      return (
                        <Badge key={zoneId} variant="pending" className="text-xs">
                          {zone?.name}
                        </Badge>
                      );
                    })
                  ) : (
                    "Select zones..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
              {/* Search Input */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search zones..."
                    value={zoneSearch}
                    onChange={(e) => setZoneSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto">
                {filteredZones.length > 0 ? (
                  filteredZones.map((zone: Zone) => (
                    <div
                      key={zone.id}
                      className={cn(
                        "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100",
                        selectedZoneIds.includes(zone.id) && "bg-gray-100"
                      )}
                      onClick={() => handleSelectZone(zone.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedZoneIds.includes(zone.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {zone.name} ({zone.region.name})
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {zoneSearch ? "No zones found" : selectedRegionIds.length ? "No zones available for selected regions" : "Please select regions first"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cities (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cities <span className="text-xs">(Optional)</span></label>
          <Popover open={openCities} onOpenChange={handleCitiesOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingCities || !selectedZoneIds.length}
                type="button"
              >
                <div className="flex flex-wrap gap-1 max-w-[calc(100%-2rem)] overflow-hidden">
                  {selectedCityIds.length > 0 ? (
                    selectedCityIds.map(cityId => {
                      const city = availableCities.find((c: City) => c.id === cityId);
                      return (
                        <Badge key={cityId} variant="pending" className="text-xs">
                          {city?.name}
                        </Badge>
                      );
                    })
                  ) : (
                    "Select cities (optional)..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
              {/* Search Input */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cities..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city: City) => (
                    <div
                      key={city.id}
                      className={cn(
                        "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100",
                        selectedCityIds.includes(city.id) && "bg-gray-100"
                      )}
                      onClick={() => handleSelectCity(city.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCityIds.includes(city.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {city.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {citySearch ? "No cities found" : selectedZoneIds.length ? "No cities available for selected zones" : "Please select zones first"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex justify-between pt-8">
          {isEditing ? (
            <>
              <Button onClick={onBack} variant="outline" type="button">
                Back
              </Button>
              <div className="flex gap-2">
                {onCancel && (
                  <Button onClick={onCancel} variant="outline" type="button">
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={onNext}
                  className="bg-blue-500 text-white px-8"
                  disabled={!selectedZoneIds.length}
                  type="button"
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button onClick={onBack} variant="outline" type="button">
                Back
              </Button>
              <Button 
                onClick={onNext}
                className="bg-blue-500 text-white px-8"
                disabled={!selectedZoneIds.length}
                type="button"
              >
                Continue
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 