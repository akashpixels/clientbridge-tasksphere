
import { TableCell } from "@/components/ui/table";
import { format } from "date-fns";

interface TaskEtaCellProps {
  eta: string | null;
}

export const TaskEtaCell = ({ eta }: TaskEtaCellProps) => {
  return (
    <TableCell className="text-left">
      {eta ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-600">{format(new Date(eta), "h.mmaaa")}</span>
          <span className="text-xs text-gray-700">{format(new Date(eta), "do MMM")}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-700">Not set</span>
      )}
    </TableCell>
  );
};
