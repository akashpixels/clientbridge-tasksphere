import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  subscriptionFilter: string;
  setSubscriptionFilter: (value: string) => void;
}

export const ProjectFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  subscriptionFilter,
  setSubscriptionFilter,
}: ProjectFiltersProps) => {
  return (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-xs"
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Open">Open</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Review">Review</SelectItem>
          <SelectItem value="Feedback">Feedback</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
          <SelectItem value="Blocked">Blocked</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder="Filter by subscription" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All Projects</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};