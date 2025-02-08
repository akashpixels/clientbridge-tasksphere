
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TasksTableHeaderProps {
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort: (key: string) => void;
}

export const TasksTableHeader = ({ sortConfig, onSort }: TasksTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead 
          className="cursor-pointer"
          onClick={() => onSort('status')}
        >
          Status {sortConfig.key === 'status' && (
            sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
          )}
        </TableHead>
        <TableHead 
          className="cursor-pointer"
          onClick={() => onSort('details')}
        >
          Details
        </TableHead>
        <TableHead 
          className="cursor-pointer"
          onClick={() => onSort('target_device')}
        >
          Device
        </TableHead>
        <TableHead 
          className="cursor-pointer"
          onClick={() => onSort('priority_level_id')}
        >
          Priority
        </TableHead>
        <TableHead 
          className="cursor-pointer"
          onClick={() => onSort('complexity_level_id')}
        >
      Complexity
        </TableHead>
        <TableHead 
          className="cursor-pointer"
          onClick={() => onSort('eta')}
        >
          ETA
        </TableHead>
        <TableHead>Links</TableHead>
        <TableHead>Assets</TableHead>
        <TableHead>Comments</TableHead>
      </TableRow>
    </TableHeader>
  );
};
