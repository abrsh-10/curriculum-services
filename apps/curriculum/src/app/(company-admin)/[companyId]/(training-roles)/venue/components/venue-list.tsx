import React from "react";
import { Venue } from "@/lib/hooks/useVenue";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react"; // Assuming icons for actions

interface VenueListProps {
  venues: Venue[];
  onEdit: (venueId: string) => void; 
  onDelete: (venueId: string) => void;
}

export function VenueList({ venues, onEdit, onDelete }: VenueListProps) {
  if (!venues || venues.length === 0) {
    // This case should ideally be handled by the parent component's empty state
    return <p className="text-center text-gray-500 py-8">No venues found.</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[25%]">Name</TableHead>
            <TableHead className="w-[25%]">Location</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Woreda</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.map((venue) => (
            <TableRow key={venue.id}>
              <TableCell className="font-medium">{venue.name}</TableCell>
              <TableCell>{venue.location}</TableCell>
              <TableCell>{venue.city?.name || 'N/A'}</TableCell>
              <TableCell>
                {typeof venue.zone === 'string' 
                  ? venue.zone 
                  : (venue.zone as { name?: string })?.name || 'Unknown Zone'
                }
              </TableCell>
              <TableCell>{venue.woreda}</TableCell>
              <TableCell className="text-right space-x-2">
                {/* Ensure buttons are also tightly packed if needed, though less likely issue here */}
                <Link href={`/venue/${venue.id}`} passHref><Button variant="outline" size="sm" className="text-xs">View</Button></Link>
                <Button variant="ghost" size="icon" onClick={() => onEdit(venue.id)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(venue.id)} className="h-8 w-8 text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 