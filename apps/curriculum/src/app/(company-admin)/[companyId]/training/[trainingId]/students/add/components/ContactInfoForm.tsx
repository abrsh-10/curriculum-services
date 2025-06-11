import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UseFormReturn } from "react-hook-form"
import { StudentFormValues } from "./formSchemas"
import { useEffect, useMemo, useState } from "react"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { cn } from "@/lib/utils"
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

interface City {
  id: string
  name: string
  description: string
  zone?: Zone
}

interface ContactInfoFormProps {
  form: UseFormReturn<StudentFormValues>
  countries?: Country[]
  regions?: Region[]
  zones?: Zone[]
  cities?: City[]
}

export function ContactInfoForm({ form, countries, regions, zones, cities }: ContactInfoFormProps) {
  // Local state for cascading selects (not part of form schema) - exactly like venue form
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");

  // Popover states
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

  // Watch form values for cascading selects
  const selectedZoneId = form.watch("zoneId") || '';
  
  // Initialize local state from form values (for edit mode)
  useEffect(() => {
    const countryId = form.watch("countryId");
    const regionId = form.watch("regionId");
    
    if (countryId && countryId !== selectedCountryId) {
      setSelectedCountryId(countryId);
    }
    if (regionId && regionId !== selectedRegionId) {
      setSelectedRegionId(regionId);
    }
  }, [form.watch("countryId"), form.watch("regionId"), selectedCountryId, selectedRegionId]);

  // Filter data based on selections (client-side filtering for hierarchical relationships)
  const availableRegions = useMemo(() => {
    if (!selectedCountryId || !regions) return [];
    return regions.filter((region: Region) => 
      region.country.id === selectedCountryId
    );
  }, [regions, selectedCountryId]);

  const availableZones = useMemo(() => {
    if (!selectedRegionId || !zones) return [];
    return zones.filter((zone: Zone) => 
      zone.region.id === selectedRegionId
    );
  }, [zones, selectedRegionId]);

  const availableCities = useMemo(() => {
    if (!selectedZoneId || !cities) return [];
    return cities.filter((city: City) => 
      city.zone && city.zone.id === selectedZoneId
    );
  }, [cities, selectedZoneId]);

  // Filter data based on search
  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    return countries.filter((country) =>
      country.name.toLowerCase().includes(debouncedCountrySearch.toLowerCase())
    );
  }, [countries, debouncedCountrySearch]);
  
  const filteredRegions = useMemo(() => {
    return availableRegions.filter((region) =>
      region.name.toLowerCase().includes(debouncedRegionSearch.toLowerCase())
    );
  }, [availableRegions, debouncedRegionSearch]);
  
  const filteredZones = useMemo(() => {
    return availableZones.filter((zone) =>
      zone.name.toLowerCase().includes(debouncedZoneSearch.toLowerCase())
    );
  }, [availableZones, debouncedZoneSearch]);
  
  const filteredCities = useMemo(() => {
    return availableCities.filter((city) =>
      city.name.toLowerCase().includes(debouncedCitySearch.toLowerCase())
    );
  }, [availableCities, debouncedCitySearch]);

  // Handle cascading selection changes - exactly like venue form
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    form.setValue('countryId', countryId, { shouldValidate: true });
    // Clear dependent selections
    setSelectedRegionId("");
    form.setValue('regionId', '', { shouldValidate: true });
    form.setValue('zoneId', '', { shouldValidate: true });
    form.setValue('cityId', '', { shouldValidate: true });
    setOpenCountries(false);
  };

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId);
    form.setValue('regionId', regionId, { shouldValidate: true });
    // Clear dependent selections
    form.setValue('zoneId', '', { shouldValidate: true });
    form.setValue('cityId', '', { shouldValidate: true });
    setOpenRegions(false);
  };

  const handleZoneChange = (zoneId: string) => {
    form.setValue('zoneId', zoneId, { shouldValidate: true });
    // Clear dependent selections
    form.setValue('cityId', '', { shouldValidate: true });
    setOpenZones(false);
  };

  const handleCityChange = (cityId: string) => {
    form.setValue('cityId', cityId, { shouldValidate: true });
    setOpenCities(false);
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

  // Get display names for selected items
  const getSelectedCountryName = () => {
    if (!selectedCountryId || !countries) return "";
    const country = countries.find(c => c.id === selectedCountryId);
    return country?.name || "";
  };

  const getSelectedRegionName = () => {
    if (!selectedRegionId || !availableRegions) return "";
    const region = availableRegions.find(r => r.id === selectedRegionId);
    return region?.name || "";
  };

  const getSelectedZoneName = () => {
    if (!selectedZoneId || !availableZones) return "";
    const zone = availableZones.find(z => z.id === selectedZoneId);
    return zone?.name || "";
  };

  const getSelectedCityName = () => {
    const cityId = form.watch("cityId");
    if (!cityId || !availableCities) return "";
    const city = availableCities.find(c => c.id === cityId);
    return city?.name || "";
  };

  // Format phone number to include country code on form submission
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Check if the field being changed is the phone number
      if (name === 'contactPhone') {
        const phoneValue = values.contactPhone;
        if (phoneValue && typeof phoneValue === 'string') {
          // If the phone number already includes +251, leave it as is
          if (!phoneValue.startsWith('+251')) {
            // Remove any existing '+251' prefix to avoid duplicates
            const cleanedNumber = phoneValue.replace(/^\+251/, '');
            
            // Save the full number with country code in form data
            // but don't update the field value to maintain a good UX
            form.setValue('contactPhone', `+251${cleanedNumber}`);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="pb-8">
      {/* Email and Phone section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200 pb-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Email</FormLabel>
              <FormDescription className="text-gray-500 text-sm">
                Enter your email address
              </FormDescription>
              <FormControl>
                <Input {...field} value={field.value || ""} className="h-12 text-sm md:text-md" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Contact Phone</FormLabel>
              <FormDescription className="text-gray-500 text-sm">
                Enter your contact number.
              </FormDescription>
              <div className="flex items-center gap-2">
                <div className="w-[142px] h-12 flex items-center px-4 border border-[#E4E4E4] rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">+251</span>
                  </div>
                </div>
                <FormControl>
                  <Input 
                    {...field} 
                    className="h-12 text-sm md:text-md" 
                    placeholder="911436785"
                    // Display only the local part without the +251 prefix
                    value={field.value?.toString().replace(/^\+251/, '') || ''}
                    onChange={(e) => {
                      // Only allow numeric input
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(onlyNums);
                    }}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Address section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-6">Address</h3>
        
        {/* Country and Region */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Country Selection with Search - exactly like venue form */}
          <FormField
            control={form.control}
            name="countryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Country <span className="text-red-500">*</span></FormLabel>
                <FormDescription className="text-gray-500 text-sm">
                  Select your country
                </FormDescription>
                <Popover open={openCountries} onOpenChange={handleCountriesOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12"
                      disabled={!countries}
                      type="button"
                    >
                      <span className="truncate">
                        {!countries ? "Loading countries..." : (getSelectedCountryName() || "Select a country")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0" 
                    align="start" 
                    side="bottom" 
                    sideOffset={4}
                  >
                    {/* Search Input */}
                    <div className="p-3 border-b" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search countries..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="pl-9"
                          autoFocus={false}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      {!countries ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          Loading countries...
                        </div>
                      ) : filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <div
                            key={country.id}
                            className={cn(
                              "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                              selectedCountryId === country.id && "bg-gray-100"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCountryChange(country.id);
                            }}
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
                          {countrySearch ? "No countries found" : "No countries available"}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Region Selection with Search */}
          <FormField
            control={form.control}
            name="regionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Region <span className="text-red-500">*</span></FormLabel>
                <FormDescription className="text-gray-500 text-sm">
                  Select your region
                </FormDescription>
                <Popover open={openRegions} onOpenChange={handleRegionsOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12"
                      disabled={!selectedCountryId}
                      type="button"
                    >
                      <span className="truncate">
                        {getSelectedRegionName() || (!selectedCountryId ? "Select country first" : "Select a region")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0" 
                    align="start" 
                    side="bottom" 
                    sideOffset={4}
                  >
                    {/* Search Input */}
                    <div className="p-3 border-b" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search regions..."
                          value={regionSearch}
                          onChange={(e) => setRegionSearch(e.target.value)}
                          className="pl-9"
                          autoFocus={false}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      {filteredRegions.length > 0 ? (
                        filteredRegions.map((region) => (
                          <div
                            key={region.id}
                            className={cn(
                              "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                              selectedRegionId === region.id && "bg-gray-100"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRegionChange(region.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRegionId === region.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {region.name} ({region.country.name})
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {regionSearch ? "No regions found" : selectedCountryId ? "No regions available for selected country" : "Please select country first"}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Zone and City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Zone Selection with Search */}
          <FormField
            control={form.control}
            name="zoneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Zone <span className="text-red-500">*</span></FormLabel>
                <FormDescription className="text-gray-500 text-sm">
                  Select your zone
                </FormDescription>
                <Popover open={openZones} onOpenChange={handleZonesOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12"
                      disabled={!selectedRegionId}
                      type="button"
                    >
                      <span className="truncate">
                        {getSelectedZoneName() || (!selectedRegionId ? "Select region first" : "Select a zone")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0" 
                    align="start" 
                    side="bottom" 
                    sideOffset={4}
                  >
                    {/* Search Input */}
                    <div className="p-3 border-b" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search zones..."
                          value={zoneSearch}
                          onChange={(e) => setZoneSearch(e.target.value)}
                          className="pl-9"
                          autoFocus={false}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      {filteredZones.length > 0 ? (
                        filteredZones.map((zone) => (
                          <div
                            key={zone.id}
                            className={cn(
                              "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                              selectedZoneId === zone.id && "bg-gray-100"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleZoneChange(zone.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedZoneId === zone.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {zone.name} ({zone.region.name})
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {zoneSearch ? "No zones found" : selectedRegionId ? "No zones available for selected region" : "Please select region first"}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City Selection with Search */}
          <FormField
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">City/Town </FormLabel>
                <FormDescription className="text-gray-500 text-sm">
                  Select your city or town
                </FormDescription>
                <Popover open={openCities} onOpenChange={handleCitiesOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12"
                      disabled={!selectedZoneId}
                      type="button"
                    >
                      <span className="truncate">
                        {getSelectedCityName() || (!selectedZoneId ? "Select zone first" : "Select a city")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0" 
                    align="start" 
                    side="bottom" 
                    sideOffset={4}
                  >
                    {/* Search Input */}
                    <div className="p-3 border-b" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search cities..."
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          className="pl-9"
                          autoFocus={false}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      {filteredCities.length > 0 ? (
                        filteredCities.map((city) => (
                          <div
                            key={city.id}
                            className={cn(
                              "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                              field.value === city.id && "bg-gray-100"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCityChange(city.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === city.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {city.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {citySearch ? "No cities found" : selectedZoneId ? "No cities available for selected zone" : "Please select zone first"}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Woreda and House Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="woreda"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Woreda/Kebele</FormLabel>
                <FormDescription className="text-gray-500 text-sm">
                  Enter the woreda or kebele.
                </FormDescription>
                <FormControl>
                  <Input {...field} value={field.value || ""} className="h-12 text-sm md:text-md" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="houseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">House Number</FormLabel>
                <FormDescription className="text-gray-500 text-sm">
                  Enter your house number or building name
                </FormDescription>
                <FormControl>
                  <Input {...field} value={field.value || ""} className="h-12 text-sm md:text-md" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
} 