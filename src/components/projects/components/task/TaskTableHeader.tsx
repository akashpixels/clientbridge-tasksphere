
import React from 'react';
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";

export const TaskTableHeader: React.FC = () => {
  return (
    <div className="   border-t   overflow-hidden mb-6">
      <Table>
        <TableHeader>
          <TableRow className="">
            <TableHead className="w-[8%] px-4">Task</TableHead>
            <TableHead className="w-[10%] px-4">Status</TableHead>
            <TableHead className="w-[30%] px-4">Details</TableHead>
            <TableHead className="w-[5%] px-4 text-center">Device</TableHead>
            <TableHead className="w-[7%] px-4">Priority</TableHead>
            <TableHead className="w-[7%] px-4 text-center">Level</TableHead>
            <TableHead className="w-[8%] px-4 text-left">Start</TableHead>
            <TableHead className="w-[8%] px-4 text-left">End</TableHead>
            <TableHead className="w-[9%] px-4">Links</TableHead>
            <TableHead className="w-[8%] px-4 text-center">Assets</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    </div>
  );
};

export default TaskTableHeader;
