
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import TasksTable from "./TasksTable";

interface TasksTabContentProps {
  project: Tables<"projects">;
  selectedMonth: string;
  maxConcurrentTasks: number;
}

const TasksTabContent = ({ project, selectedMonth, maxConcurrentTasks }: TasksTabContentProps) => {
  const [filter, setFilter] = useState("all");

  console.log("Tasks Tab - Max Concurrent Tasks:", maxConcurrentTasks);

  return (
    <div>
      {/* Filtering options can go here */}
      <div className="mb-6 flex justify-between items-center">
        <div className="space-x-2">
          <button
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("all")}
          >
            All Tasks
          </button>
          <button
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filter === "active"
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filter === "completed"
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>

        {/* Add task button would go here */}
      </div>

      <TasksTable 
        projectId={project.id} 
        selectedMonth={selectedMonth}
        statusFilter={filter}
        maxConcurrentTasks={maxConcurrentTasks}
      />
    </div>
  );
};

export default TasksTabContent;
