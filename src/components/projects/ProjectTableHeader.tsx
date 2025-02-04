import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface ProjectTableHeaderProps {
  onSort: (key: string) => void;
}

export const ProjectTableHeader = ({ onSort }: ProjectTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow className="border-b border-gray-200">
        <TableHead className="w-[40%] text-left pl-4">Project</TableHead>
        <TableHead className="w-[20%] text-left">
          <Button
            variant="ghost"
            onClick={() => onSort('client')}
            className="h-8 flex items-center gap-1 hover:bg-gray-100"
          >
            Client
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className="w-[15%] text-left">
          <Button
            variant="ghost"
            onClick={() => onSort('status')}
            className="h-8 flex items-center gap-1 hover:bg-gray-100"
          >
            Status
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className="w-[15%] text-left">
          <Button
            variant="ghost"
            onClick={() => onSort('subscription')}
            className="h-8 flex items-center gap-1 hover:bg-gray-100"
          >
            Subscription
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className="w-[10%] text-left">
          <Button
            variant="ghost"
            onClick={() => onSort('dueDate')}
            className="h-8 flex items-center gap-1 hover:bg-gray-100"
          >
            Due Date
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};