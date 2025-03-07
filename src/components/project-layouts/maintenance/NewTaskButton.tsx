import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TaskCreationSidebar } from "@/components/tasks/TaskCreationSidebar";
import { useLayout } from "@/context/layout";

export const NewTaskButton = () => {
  const { setRightSidebarContent, rightSidebarContent } = useLayout();

  const handleNewTask = () => {
    console.log("New Task button clicked");
    // If sidebar is already open with TaskCreationSidebar, close it
    if (rightSidebarContent) {
      setRightSidebarContent(null);
    } else {
      // Otherwise open it with TaskCreationSidebar
      setRightSidebarContent(<TaskCreationSidebar />);
    }
  };

  return (
    <Button onClick={handleNewTask} className="gap-2">
      <PlusCircle size={16} /> New Task
    </Button>
  );
};
