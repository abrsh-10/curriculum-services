"use client"

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'
import { useBaseData } from '@/lib/hooks/useBaseData'
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
  
  const { 
    watch, 
    setValue, 
    formState: { errors } 
  } = useFormContext<TrainingFormData>();
  
  const selectedCountryIds = watch('countryIds') || [];
  const selectedRegionIds = watch('regionIds') || [];
  const selectedZoneIds = watch('zoneIds') || [];
  const selectedCityIds = watch('cityIds') || [];
  
  // Fetch all available countries
  const { data: allCountries, isLoading: isLoadingCountries } = useBaseData('country', { enabled: true });
  
  // Fetch regions based on selected countries
  const { data: allRegions, isLoading: isLoadingRegions } = useBaseData('region', { enabled: true });
  const availableRegions = (allRegions || []).filter((region: Region) => 
    selectedCountryIds.includes(region.country.id)
  );
  
  // Fetch zones based on selected regions
  const { data: allZones, isLoading: isLoadingZones } = useBaseData('zone', { enabled: true });
  const availableZones = (allZones || []).filter((zone: Zone) => 
    selectedRegionIds.includes(zone.region.id)
  );
  
  // Fetch cities based on selected zones (optional)
  const { data: allCities, isLoading: isLoadingCities } = useBaseData('city', { enabled: true });
  const availableCities = selectedZoneIds.length > 0 
    ? (allCities || []).filter((city: City) => 
        city.zone && selectedZoneIds.includes(city.zone.id)
      )
    : [];

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="lg:text-2xl md:text-xl text-lg font-semibold mb-2 text-center">
          Where will the training take place?
        </h2>
        <p className="lg:text-sm md:text-xs text-xs text-gray-500 text-center mb-8">
          Select the countries, regions, zones, and optionally cities
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Countries */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Countries <span className="text-red-500">*</span></label>
          <Popover open={openCountries} onOpenChange={setOpenCountries}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingCountries}
                type="button"
              >
                <div className="flex flex-wrap gap-1">
                  {selectedCountryIds.length > 0 ? (
                    selectedCountryIds.map(countryId => {
                      const country = allCountries?.find((c: BaseItem) => c.id === countryId);
                      return (
                        <Badge key={countryId} variant="pending">
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
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {allCountries?.map((country: BaseItem) => (
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
                ))}
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
          <Popover open={openRegions} onOpenChange={setOpenRegions}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingRegions || !selectedCountryIds.length}
                type="button"
              >
                <div className="flex flex-wrap gap-1">
                  {selectedRegionIds.length > 0 ? (
                    selectedRegionIds.map(regionId => {
                      const region = availableRegions.find((r: Region) => r.id === regionId);
                      return (
                        <Badge key={regionId} variant="pending">
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
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {availableRegions.length > 0 ? (
                  availableRegions.map((region: Region) => (
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
                    {selectedCountryIds.length ? "No regions available for selected countries" : "Please select countries first"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Zones */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Zones <span className="text-red-500">*</span></label>
          <Popover open={openZones} onOpenChange={setOpenZones}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingZones || !selectedRegionIds.length}
                type="button"
              >
                <div className="flex flex-wrap gap-1">
                  {selectedZoneIds.length > 0 ? (
                    selectedZoneIds.map(zoneId => {
                      const zone = availableZones.find((z: Zone) => z.id === zoneId);
                      return (
                        <Badge key={zoneId} variant="pending">
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
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {availableZones.length > 0 ? (
                  availableZones.map((zone: Zone) => (
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
                    {selectedRegionIds.length ? "No zones available for selected regions" : "Please select regions first"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cities (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cities <span className="text-xs">(Optional)</span></label>
          <Popover open={openCities} onOpenChange={setOpenCities}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                disabled={isLoadingCities || !selectedZoneIds.length}
                type="button"
              >
                <div className="flex flex-wrap gap-1">
                  {selectedCityIds.length > 0 ? (
                    selectedCityIds.map(cityId => {
                      const city = availableCities.find((c: City) => c.id === cityId);
                      return (
                        <Badge key={cityId} variant="pending">
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
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {availableCities.length > 0 ? (
                  availableCities.map((city: City) => (
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
                    {selectedZoneIds.length ? "No cities available for selected zones" : "Please select zones first"}
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