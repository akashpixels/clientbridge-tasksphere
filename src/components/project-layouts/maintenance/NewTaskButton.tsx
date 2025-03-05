
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TaskCreationDialog } from "@/components/tasks/TaskCreationDialog";

export const NewTaskButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <PlusCircle size={16} /> New Task
      </Button>
      <TaskCreationDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
