
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TaskCreationSidebar } from "@/components/tasks/TaskCreationSidebar";
import { useLayout } from "@/context/layout";

export const NewTaskButton = () => {
  const { setRightSidebarContent } = useLayout();

  const handleNewTask = () => {
    setRightSidebarContent(<TaskCreationSidebar />);
  };

  return (
    <Button onClick={handleNewTask} className="gap-2">
      <PlusCircle size={16} /> New Task
    </Button>
  );
};
