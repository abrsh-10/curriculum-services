"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { BaseDataItem, BaseDataType } from "@/types/base-data";
import { Textarea } from "@/components/ui/textarea";
import { useBaseData } from "@/lib/hooks/useBaseData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseDataOptions } from "@/types/base-data";
import { useSingleCascadingLocation } from "@/lib/hooks/useCascadingLocation";

// Constants
const REQUIREMENT_TYPES = [
  { value: "LEARNER", label: "Learner" },
  { value: "INSTRUCTOR", label: "Instructor" },
];

const ASSESSMENT_SUB_TYPES = [
  { value: "FORMATIVE", label: "Formative" },
  { value: "SUMMATIVE", label: "Summative" },
  { value: "OTHER", label: "Other" },
];

interface AddDataDialogProps {
  onAddData?: (data: {
    name: string;
    description: string;
    countryId?: string;
    zoneId?: string;
    regionId?: string;
    range?: string;
    technologicalRequirementType?: string;
    assessmentSubType?: string;
  }) => void;
  onUpdateData?: (data: {
    name: string;
    description: string;
    countryId?: string;
    zoneId?: string;
    regionId?: string;
    range?: string;
    technologicalRequirementType?: string;
    assessmentSubType?: string;
  }) => void;
  initialData?: BaseDataItem & {
    countryId?: string;
    zoneId?: string;
    regionId?: string;
    range?: string;
    technologicalRequirementType?: string;
    assessmentSubType?: string;
  };
  isLoading?: boolean;
  mode?: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  type?: BaseDataType;
}

export function AddDataDialog({
  onAddData,
  onUpdateData,
  initialData,
  isLoading,
  mode = "add",
  open,
  onOpenChange,
  type,
}: AddDataDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [countryId, setCountryId] = useState(initialData?.countryId || "");
  const [zoneId, setZoneId] = useState(initialData?.zoneId || "");
  const [regionId, setRegionId] = useState(initialData?.regionId || "");
  const [range, setRange] = useState(initialData?.range || "");
  const [requirementType, setRequirementType] = useState(
    initialData?.technologicalRequirementType || "LEARNER"
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assessmentSubType, setAssessmentSubType] = useState(
    initialData?.assessmentSubType || "FORMATIVE"
  );
  
  // For city cascading: separate country and region state
  const [cityCountryId, setCityCountryId] = useState("");
  const [cityRegionId, setCityRegionId] = useState("");

  // Fetch countries for regions
  const { data: countries } = useBaseData("country", {
    enabled: type === "region",
  } as BaseDataOptions);
  
  // Fetch regions for zones
  const { data: regions } = useBaseData("region", {
    enabled: type === "zone",
  } as BaseDataOptions);
  
  // Use cascading location hook for cities (Country → Region → Zone)
  const {
    countries: cityCountries,
    regions: cityRegions,
    zones: cityZones,
    isLoadingCountries: isLoadingCityCountries,
    isLoadingRegions: isLoadingCityRegions,
    isLoadingZones: isLoadingCityZones,
  } = useSingleCascadingLocation(
    type === "city" ? cityCountryId : undefined,
    type === "city" ? cityRegionId : undefined
  );

  const actualOpen = open ?? dialogOpen;
  const actualOnOpenChange = onOpenChange ?? setDialogOpen;

  const resetForm = () => {
    setName("");
    setDescription("");
    setCountryId("");
    setZoneId("");
    setRegionId("");
    setRange("");
    setRequirementType("LEARNER");
    setAssessmentSubType("FORMATIVE");
    setCityCountryId("");
    setCityRegionId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseData = {
      name,
      description,
      ...(type === "region" && { countryId }),
      ...(type === "city" && { zoneId }),
      ...(type === "age-group" && { range }),
      ...(type === "technological-requirement" && { technologicalRequirementType: requirementType }),
      ...(type === "assessment-type" && { assessmentSubType }),
      ...(type === "zone" && { regionId }),
    };

    if (mode === "edit" && onUpdateData) {
      onUpdateData(baseData);
    } else if (onAddData) {
      onAddData(baseData);
    }
    resetForm();
    actualOnOpenChange(false);
  };

  const isSubmitDisabled = () => {
    if (isLoading) return true;
    if (type === "city" && !zoneId) return true;
    if (type === "region" && !countryId) return true;
    if (type === "zone" && !regionId) return true;
    if (type === "age-group" && !range) return true;
    if (type === "assessment-type" && !assessmentSubType) return true;
    if (!name || !description) return true;
    return false;
  };

  return (
    <Dialog open={actualOpen} onOpenChange={actualOnOpenChange}>
      {mode === "add" && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-full max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 border-b-[0.3px] border-[#CED4DA] pb-4">
          <DialogTitle>{mode === "add" ? "Add Row" : "Edit Row"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 p-10">
          <div className="grid gap-2 px-5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="h-9"
            />
          </div>

          {type === "city" && (
            <div className="grid gap-4 px-5">
              {/* Country Selection */}
              <div className="grid gap-2">
                <Label htmlFor="city-country">Country</Label>
                <Select 
                  value={cityCountryId} 
                  onValueChange={(value) => {
                    setCityCountryId(value);
                    // Clear dependent selections
                    setCityRegionId("");
                    setZoneId("");
                  }}
                  disabled={isLoadingCityCountries}
                >
                  <SelectTrigger>
                    {isLoadingCityCountries ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading countries...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select country" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {cityCountries?.map((country: BaseDataItem) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region Selection */}
              <div className="grid gap-2">
                <Label htmlFor="city-region">Region</Label>
                <Select 
                  value={cityRegionId} 
                  onValueChange={(value) => {
                    setCityRegionId(value);
                    // Clear dependent selection
                    setZoneId("");
                  }}
                  disabled={!cityCountryId || isLoadingCityRegions}
                >
                  <SelectTrigger>
                    {isLoadingCityRegions ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading regions...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={!cityCountryId ? "Select country first" : "Select region"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {cityRegions?.map((region: BaseDataItem) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zone Selection */}
              <div className="grid gap-2">
                <Label htmlFor="city-zone">Zone</Label>
                <Select 
                  value={zoneId} 
                  onValueChange={setZoneId}
                  disabled={!cityRegionId || isLoadingCityZones}
                >
                  <SelectTrigger>
                    {isLoadingCityZones ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading zones...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={!cityRegionId ? "Select region first" : "Select zone"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {cityZones?.map((zone: BaseDataItem) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === "region" && (
            <div className="grid gap-2 px-5">
              <Label htmlFor="country">Country</Label>
              <Select value={countryId} onValueChange={setCountryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country">{countryId && countries?.find((country: BaseDataItem) => country.id === countryId)?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((country: BaseDataItem) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "zone" && (
            <div className="grid gap-2 px-5">
              <Label htmlFor="region">Region</Label>
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region">{regionId && regions?.find((region: BaseDataItem) => region.id === regionId)?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {regions?.map((region: BaseDataItem) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "age-group" && (
            <div className="grid gap-2 px-5">
              <Label htmlFor="range">Age Range</Label>
              <Input
                id="range"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Enter age range (e.g. 18-24)"
                className="h-9"
              />
            </div>
          )}

          {type === "technological-requirement" && (
            <div className="grid gap-2 px-5">
              <Label htmlFor="requirementType">Requirement Type</Label>
              <Select
                value={requirementType}
                onValueChange={setRequirementType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select requirement type" />
                </SelectTrigger>
                <SelectContent>
                  {REQUIREMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "assessment-type" && (
            <div className="grid gap-2 px-5 mt-2">
              <Label htmlFor="assessmentSubType">Assessment Sub Type</Label>
              <Select
                value={assessmentSubType}
                onValueChange={setAssessmentSubType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment sub type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_SUB_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2 px-5 pt-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex justify-center gap-5 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => actualOnOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitDisabled()}
              className="bg-brand text-white hover:bg-brand/90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {mode === "add" ? "Save" : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
